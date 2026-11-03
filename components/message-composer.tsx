"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function MessageComposer({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [author, setAuthor] = useState("Daniel");
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
          ? "Chave de escrita inválida."
          : "A mensagem não foi gravada. Confere o Neon, o schema e a chave.");
        return;
      }

      setBody("");
      setFeedback("Mensagem registrada no Neon.");
      router.refresh();
    } catch {
      setFeedback("Conexão indisponível. Tenta novamente.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="messageForm" onSubmit={send}>
      <div className="formTwo">
        <label>
          <span>Autor</span>
          <input aria-label="Autor da mensagem" value={author} onChange={(e) => setAuthor(e.target.value)} maxLength={40} required disabled={!enabled} />
        </label>
        <label>
          <span>Chave de escrita da demo</span>
          <input aria-label="Chave de escrita" type="password" autoComplete="off" value={key} onChange={(e) => setKey(e.target.value)} required disabled={!enabled} placeholder="Configurada na Vercel" />
        </label>
      </div>
      <label>
        <span>Mensagem</span>
        <textarea aria-label="Mensagem" value={body} onChange={(e) => setBody(e.target.value)} maxLength={280} rows={3} required disabled={!enabled} placeholder="Um pensamento para testar o caminho SideUp → Neon…" />
      </label>
      <div className="formFooter">
        <small>Protótipo de mensagens. Não envia áudio pessoal nem cria INSIDEOUT automaticamente.</small>
        <button className="primaryButton" disabled={!enabled || sending || !body.trim() || !key || !author.trim()} type="submit">
          {sending ? "Enviando…" : "Registrar mensagem"}
          <span aria-hidden="true">↗</span>
        </button>
      </div>
      {feedback && <p className="formFeedback" role="status">{feedback}</p>}
    </form>
  );
}
