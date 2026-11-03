import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };
type Provider = "gemini" | "perplexity" | "claude" | "nvidia" | "modal" | "modal_glm";

function secureEqual(value: string, expected: string): boolean {
  if (!value || !expected) return false;
  const a = Buffer.from(value, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

function jsonError(error: string, status: number, provider?: Provider, remoteStatus?: number) {
  return Response.json({ error, ...(provider ? { provider } : {}), ...(remoteStatus ? { remoteStatus } : {}) }, { status, headers: noStore });
}

const compatible = (response: Record<string, any>) =>
  String(response.choices?.[0]?.message?.content ?? "").slice(0, 10000);

function modalEndpoint() {
  const raw = process.env.MODAL_ENDPOINT_URL;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || !url.hostname.endsWith(".modal.run") ||
      url.username || url.password || url.search || url.hash) return null;
    return url;
  } catch { return null; }
}

export async function POST(request: Request) {
  const gate = process.env.SIDE_INFERENCE_GATE_KEY || "";
  if (!gate) return jsonError("inference_gate_not_configured", 503);
  if (!secureEqual(request.headers.get("x-side-gate-key") || "", gate)) {
    return jsonError("unauthorized", 401);
  }
  const raw: unknown = await request.json().catch(() => null);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return jsonError("invalid_payload", 400);
  const data = raw as Record<string, unknown>;
  const provider = data.provider;
  const prompt = typeof data.prompt === "string" ? data.prompt.trim() : "";
  if (!["gemini", "perplexity", "claude", "nvidia", "modal", "modal_glm"].includes(String(provider)) ||
      prompt.length < 1 || prompt.length > 2000) return jsonError("invalid_provider_or_prompt", 400);
  const selected = provider as Provider;

  let model = "";
  let response: Response;
  try {
    const signal = AbortSignal.timeout(25000);
    if (selected === "gemini") {
      const key = process.env.GEMINI_API_KEY;
      if (!key) return jsonError("gemini_not_connected", 503, selected);
      model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
      if (!/^[\w.-]{1,100}$/.test(model)) return jsonError("invalid_gemini_model", 500);
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
        signal, cache: "no-store",
      });
    } else if (selected === "perplexity") {
      const key = process.env.PERPLEXITY_API_KEY;
      if (!key) return jsonError("perplexity_not_connected", 503, selected);
      model = process.env.PERPLEXITY_MODEL || "sonar";
      response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], stream: false }),
        signal, cache: "no-store",
      });
    } else if (selected === "claude") {
      const key = process.env.ANTHROPIC_API_KEY;
      const chosenModel = process.env.CLAUDE_MODEL;
      if (!key || !chosenModel) return jsonError("claude_key_or_model_not_connected", 503, selected);
      model = chosenModel;
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model, max_tokens: 800, messages: [{ role: "user", content: prompt }],
        }),
        signal, cache: "no-store",
      });
    } else if (selected === "nvidia") {
      const key = process.env.NVIDIA_API_KEY;
      if (!key) return jsonError("nvidia_nim_not_connected", 503, selected);
      model = process.env.NVIDIA_MODEL || "openai/gpt-oss-120b";
      response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], max_tokens: 800, stream: false }),
        signal, cache: "no-store",
      });
    } else if (selected === "modal_glm") {
      const key = process.env.MODAL_PROXY_KEY;
      const secret = process.env.MODAL_PROXY_SECRET;
      if (!key || !secret) return jsonError("modal_proxy_not_connected", 503, selected);
      model = "zai-org/GLM-5.3-Flash";
      const endpoint = "https://sidemd--ep-glm-5-3-flash-server.us-west.modal.direct/v1/chat/completions";
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}.${secret}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 128,
          stream: false,
          reasoning_effort: "none",
        }),
        signal, cache: "no-store",
      });
    } else {
      const endpoint = modalEndpoint();
      const id = process.env.MODAL_PROXY_KEY;
      const secret = process.env.MODAL_PROXY_SECRET;
      if (!endpoint || !id || !secret) return jsonError("modal_endpoint_or_auth_not_connected", 503, selected);
      model = "modal-sideup-probe";
      response = await fetch(endpoint.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Modal-Key": id,
          "Modal-Secret": secret,
        },
        body: JSON.stringify({ text: prompt }),
        signal, cache: "no-store",
      });
    }
  } catch {
    return jsonError("provider_unreachable", 503, selected);
  }

  if (!response.ok) return jsonError("provider_request_failed", 502, selected, response.status);
  try {
    const value = await response.json() as Record<string, any>;
    const text: string = selected === "gemini"
      ? (value.candidates?.[0]?.content?.parts ?? []).map((p: {text?: string}) => p.text ?? "").join("\n")
      : selected === "claude"
        ? (value.content ?? []).filter((x: {type?: string}) => x.type === "text").map((x: {text?: string}) => x.text ?? "").join("\n")
        : selected === "modal"
          ? String(value.summary ?? value.message ?? JSON.stringify(value))
          : compatible(value);
    const citations = selected === "perplexity" && Array.isArray(value.citations)
      ? value.citations.filter((s: unknown) => typeof s === "string").slice(0, 8) : [];
    return Response.json({
      status: "ok", provider: selected, model, text: text.slice(0, 10000), citations,
      kind: selected === "modal" ? "compute_probe" : "inference",
    }, { headers: noStore });
  } catch { return jsonError("provider_invalid_response", 502, selected); }
}
