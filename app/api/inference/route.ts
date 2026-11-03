import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store" };
type Provider = "gemini" | "perplexity";

function accepted(provided: string, expected: string) {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const gate = process.env.SIDE_INFERENCE_GATE_KEY ?? "";
  if (!gate) {
    return Response.json({ error: "inference_not_configured" }, { status: 503, headers });
  }
  if (!accepted(request.headers.get("x-side-gate-key") ?? "", gate)) {
    return Response.json({ error: "unauthorized" }, { status: 401, headers });
  }

  const raw: unknown = await request.json().catch(() => null);
  if (!raw || typeof raw !== "object") {
    return Response.json({ error: "invalid_body" }, { status: 400, headers });
  }
  const data = raw as Record<string, unknown>;
  const provider = data.provider;
  const prompt = typeof data.prompt === "string" ? data.prompt.trim() : "";
  if ((provider !== "gemini" && provider !== "perplexity") || !prompt || prompt.length > 2000) {
    return Response.json({ error: "invalid_provider_or_prompt" }, { status: 400, headers });
  }

  try {
    let response: Response;
    let model: string;
    if (provider === "gemini") {
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        return Response.json({ error: "gemini_key_not_configured" }, { status: 503, headers });
      }
      model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
      if (!/^[a-zA-Z0-9_.-]{1,100}$/.test(model)) {
        return Response.json({ error: "invalid_model_configuration" }, { status: 500, headers });
      }
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
          signal: AbortSignal.timeout(25000),
          cache: "no-store",
        },
      );
    } else {
      const key = process.env.PERPLEXITY_API_KEY;
      if (!key) {
        return Response.json({ error: "perplexity_key_not_configured" }, { status: 503, headers });
      }
      model = process.env.PERPLEXITY_MODEL || "sonar";
      response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          stream: false,
        }),
        signal: AbortSignal.timeout(25000),
        cache: "no-store",
      });
    }
    if (!response.ok) {
      return Response.json(
        { error: "provider_request_failed", provider, status: response.status },
        { status: 502, headers },
      );
    }
    const value: any = await response.json();
    const answer: string = provider === "gemini"
      ? (value?.candidates?.[0]?.content?.parts ?? []).map((part: any) => part.text ?? "").join("\n")
      : value?.choices?.[0]?.message?.content ?? "";
    const citations = provider === "perplexity" && Array.isArray(value?.citations)
      ? value.citations.filter((x: unknown) => typeof x === "string").slice(0, 8)
      : [];
    return Response.json({
      status: "ok", provider: provider as Provider, model,
      text: String(answer).slice(0, 10000), citations,
    }, { headers });
  } catch {
    return Response.json({ error: "provider_unavailable" }, { status: 503, headers });
  }
}
