"use client";

import { useState, type FormEvent } from "react";

type Provider = "gemini" | "perplexity" | "claude" | "nvidia" | "modal" | "modal_glm";
type Result = { text: string; model: string; citations?: string[]; kind?: string };
type Status = Record<Provider, boolean>;

const providers: { key: Provider; label: string; type: string }[] = [
  { key: "gemini", label: "Google Gemini", type: "AI API" },
  { key: "perplexity", label: "Perplexity Sonar", type: "AI API" },
  { key: "claude", label: "Anthropic Claude", type: "AI API" },
  { key: "nvidia", label: "NVIDIA NIM", type: "AI API" },
  { key: "modal", label: "Modal", type: "CPU compute probe" },
  { key: "modal_glm", label: "Modal · GLM 5.3 Flash", type: "Shared AI API · per token" },
];

export default function InferenceComposer({ enabled, status }: {
  enabled: boolean;
  status: Status;
}) {
  const [provider, setProvider] = useState<Provider>("gemini");
  const [key, setKey] = useState("");
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setReply(null);
    setError("");
    try {
      const response = await fetch("/api/inference", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-side-gate-key": key },
        body: JSON.stringify({ provider, prompt }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401) setError("Invalid workspace access key.");
        else if (response.status === 503 && data.error?.includes("not_connected")) {
          setError("Provider not connected. Set the required Vercel environment variables.");
        } else setError("Provider request failed. Check the deployment settings and API account.");
      } else {
        setReply({ text: data.text, model: data.model, citations: data.citations, kind: data.kind });
      }
    } catch {
      setError("Request failed. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="providerGrid">
        {providers.map((item) => (
          <div className="providerLine" key={item.key}>
            <strong>{item.label}</strong>
            <span>{item.type}</span>
            <span className={status[item.key] ? "providerReady" : "providerMissing"}>
              {status[item.key] ? "Configured · not yet tested" : "Connection pending"}
            </span>
          </div>
        ))}
        <div className="providerLine">
          <strong>NVIDIA DGX Cloud</strong>
          <span>Dedicated compute</span>
          <span className="providerMissing">Provisioned instance not verified</span>
        </div>
      </div>
      <form className="messageForm" onSubmit={send}>
        <div className="formTwo">
          <label>
            <span>AI / compute resource</span>
            <select value={provider} onChange={(e) => setProvider(e.target.value as Provider)}>
              {providers.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}
            </select>
          </label>
          <label>
            <span>Private workspace gate key</span>
            <input type="password" autoComplete="off" required value={key} onChange={(e) => setKey(e.target.value)}
              placeholder="Configured on Vercel" />
          </label>
        </div>
        <label>
          <span>{provider === "modal" ? "Text to process on Modal CPU" : "Ask the selected AI provider"}</span>
          <textarea required maxLength={2000} rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)}
            placeholder="A short test message to prove this resource works…" />
        </label>
        <div className="formFooter">
          <small>Processing is on demand. API calls may incur charges. Provider keys remain server-side; the gate key is entered by the operator.</small>
          <button className="primaryButton" type="submit"
            disabled={!enabled || !status[provider] || loading || !key || !prompt.trim()}>
            {loading ? "Processing…" : "Test resource"} <span aria-hidden="true">↗</span>
          </button>
        </div>
        {!enabled && <p className="formFeedback" role="status">Configure SIDE_INFERENCE_GATE_KEY in Vercel before testing.</p>}
        {error && <p className="formFeedback" role="alert">{error}</p>}
        {reply && <div className="aiResult" role="status">
          <strong>{provider} · {reply.model} · {reply.kind === "compute_probe" ? "CPU probe" : "AI response"}</strong>
          <p>{reply.text}</p>
          {reply.citations?.map((url) => <a key={url} href={url} target="_blank" rel="noreferrer">{url}</a>)}
        </div>}
      </form>
    </div>
  );
}
