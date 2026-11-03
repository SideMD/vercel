"use client";

import { useState, type FormEvent } from "react";

type Provider = "gemini" | "perplexity";
type Result = { text: string; model: string; citations?: string[] };

export default function InferenceComposer({ enabled }: { enabled: boolean }) {
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
        setError(data.error === "unauthorized" ? "Invalid workspace access key."
          : data.error === "gemini_key_not_configured" || data.error === "perplexity_key_not_configured"
          ? "This provider is not connected yet." : "Provider unavailable. Check the deployment settings.");
      } else {
        setReply({ text: data.text, model: data.model, citations: data.citations });
      }
    } catch {
      setError("Request failed. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="messageForm" onSubmit={send}>
      <div className="formTwo">
        <label>
          <span>AI provider</span>
          <select value={provider} onChange={(e) => setProvider(e.target.value as Provider)}>
            <option value="gemini">Google Gemini</option>
            <option value="perplexity">Perplexity</option>
          </select>
        </label>
        <label>
          <span>Private workspace key</span>
          <input type="password" autoComplete="off" required value={key} onChange={(e) => setKey(e.target.value)}
            placeholder="Configured on Vercel" />
        </label>
      </div>
      <label>
        <span>What should this workspace think about?</span>
        <textarea required maxLength={2000} rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask the AI provider a question…" />
      </label>
      <div className="formFooter">
        <small>Uses external AI APIs on demand. Prompts are sent to the selected provider and may incur API charges.</small>
        <button className="primaryButton" type="submit" disabled={!enabled || loading || !key || !prompt.trim()}>
          {loading ? "Processing…" : "Send to workspace"} <span aria-hidden="true">↗</span>
        </button>
      </div>
      {!enabled && <p className="formFeedback" role="status">Set SIDE_INFERENCE_GATE_KEY in Vercel to enable this demo.</p>}
      {error && <p className="formFeedback" role="alert">{error}</p>}
      {reply && (
        <div className="aiResult" role="status">
          <strong>{provider} · {reply.model}</strong>
          <p>{reply.text}</p>
          {reply.citations && reply.citations.length > 0 && (
            <div>{reply.citations.map((url) => <a key={url} href={url} target="_blank" rel="noreferrer">{url}</a>)}</div>
          )}
        </div>
      )}
    </form>
  );
}
