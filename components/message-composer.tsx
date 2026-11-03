"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function MessageComposer({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [author, setAuthor] = useState("Guest");
  const [body, setBody] = useState("");
  const [key, setKey] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled || sending) return;
    setSending(true);
    setFeedback("");

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-side-write-key": key,
        },
        body: JSON.stringify({ author, body }),
      });

      if (!response.ok) {
        setFeedback(response.status === 401
          ? "Invalid demo write key."
          : "Not saved. Check Neon, the schema and your write key.");
        return;
      }

      setBody("");
      setFeedback("Message saved to Neon.");
      router.refresh();
    } catch {
      setFeedback("Connection unavailable. Try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="messageForm" onSubmit={send}>
      <div className="formTwo">
        <label>
          <span>Author</span>
          <input aria-label="Message author" value={author} onChange={(e) => setAuthor(e.target.value)} maxLength={40} required disabled={!enabled} />
        </label>
        <label>
          <span>Demo write key</span>
          <input aria-label="Write key" type="password" autoComplete="off" value={key} onChange={(e) => setKey(e.target.value)} required disabled={!enabled} placeholder="Configured on Vercel" />
        </label>
      </div>
      <label>
        <span>Message</span>
        <textarea aria-label="Message" value={body} onChange={(e) => setBody(e.target.value)} maxLength={280} rows={3} required disabled={!enabled} placeholder="A message to test SideUp → Neon…" />
      </label>
      <div className="formFooter">
        <small>Prototype messages only. No private audio or automatic INSIDEOUT creation.</small>
        <button className="primaryButton" disabled={!enabled || sending || !body.trim() || !key || !author.trim()} type="submit">
          {sending ? "Sending…" : "Save message"}
          <span aria-hidden="true">↗</span>
        </button>
      </div>
      {feedback && <p className="formFeedback" role="status">{feedback}</p>}
    </form>
  );
}
