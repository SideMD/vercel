import MessageComposer from "@/components/message-composer";
import { getSql } from "@/lib/db";

export const dynamic = "force-dynamic";

type DemoMessage = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

type DemoState = {
  kind: "unconfigured" | "offline" | "schema" | "connected";
  serverTime: string | null;
  messages: DemoMessage[];
};

async function readDemo(): Promise<DemoState> {
  const sql = getSql();
  if (!sql) {
    return { kind: "unconfigured", serverTime: null, messages: [] };
  }

  let serverTime: string | null = null;
  try {
    const rows = await sql`select current_timestamp as server_time`;
    serverTime = String(rows[0]?.server_time ?? "");
  } catch {
    return { kind: "offline", serverTime: null, messages: [] };
  }

  try {
    const rows = await sql`
      select id, author, body, created_at
      from public.side_demo_messages
      order by created_at desc, id desc
      limit 10
    `;
    const messages = rows.map((row) => ({
      id: String(row.id),
      author: String(row.author),
      body: String(row.body),
      createdAt: String(row.created_at),
    }));
    return { kind: "connected", serverTime, messages };
  } catch {
    return { kind: "schema", serverTime, messages: [] };
  }
}

const explanations = {
  unconfigured: "Neon ainda não está vinculado a este deployment.",
  offline: "Neon configurado, mas a consulta não respondeu.",
  schema: "Neon respondeu. Falta executar db/schema.sql no SQL Editor.",
  connected: "Conexão real com Neon estabelecida.",
};

export default async function Home() {
  const data = await readDemo();
  const online = data.kind === "connected";

  return (
    <main className="shell">
      <header className="siteHeader">
        <div className="brand" aria-label="SideMinD">
          <span>side</span><span className="brandPoint">.</span><span>md</span>
          <span className="brandLabel">SideMinD</span>
        </div>
        <div className="headerRight">
          <span className="headerCaption">SIDEUP / WEB</span>
          <span className="edition">ALPHA 01</span>
        </div>
      </header>

      <section className="hero">
        <div className="eyebrow"><span className="signal" /> UM ESPAÇO DA PESSOA</div>
        <h1>A sua Side.<br /><span>A sua MinD.</span></h1>
        <p className="heroLead">
          Seu espaço digital começa aqui. A inteligência entra quando é necessária.
          A pessoa, suas mensagens e a continuidade permanecem no centro.
        </p>
        <div className="heroActions">
          <a className="primaryButton" href="#neon">Explorar o primeiro SideUp <span aria-hidden="true">↗</span></a>
          <span className="hint">Next.js + Vercel + Neon</span>
        </div>
        <div className="orb orbOne" aria-hidden="true" />
        <div className="orb orbTwo" aria-hidden="true" />
      </section>

      <section className="principleGrid" aria-label="Princípios">
        <article className="principle">
          <span className="ordinal">01 / EDGE</span>
          <h2>Você é a origem.</h2>
          <p>Sua Side sustenta a identidade. Os serviços se conectam a ela, não o contrário.</p>
        </article>
        <article className="principle">
          <span className="ordinal">02 / MESSAGE</span>
          <h2>Conversa preservada.</h2>
          <p>Mensagem primeiro. INSIDEOUT quando uma diferença merece emergir.</p>
        </article>
        <article className="principle">
          <span className="ordinal">03 / RESOURCES</span>
          <h2>Potência sob demanda.</h2>
          <p>Vercel e Neon trabalham como recursos de um ecossistema maior.</p>
        </article>
      </section>

      <section id="neon" className="demoSection">
        <div className="sectionTop">
          <div>
            <div className="eyebrow mini">PROVA DE CONCEITO / 001</div>
            <h2>SideUp Messages</h2>
            <p>O primeiro encontro entre interface web, processamento e persistência.</p>
          </div>
          <div className={`statusPill ${online ? "good" : "pending"}`}>
            <span className="statusDot" />
            {online ? "NEON CONNECTED" : data.kind === "schema" ? "NEON CONNECTED · SCHEMA PENDING" : "NEON SETUP PENDING"}
          </div>
        </div>

        <div className="demoGrid">
          <article className="surface compose">
            <div className="surfaceTop">
              <span className="surfaceNumber">A / INPUT</span>
              <span className="liveMark">MESSAGE → DATABASE</span>
            </div>
            <h3>Uma mensagem, persistida.</h3>
            <p className="surfaceDescription">
              Teste uma escrita real com sua chave privada de demonstração.
              Nada de credenciais armazenadas no navegador.
            </p>
            <MessageComposer enabled={online} />
          </article>

          <article className="surface history">
            <div className="surfaceTop">
              <span className="surfaceNumber">B / STORAGE</span>
              <span className="liveMark">POSTGRESQL / NEON</span>
            </div>
            <h3>Linha recuperável.</h3>
            <p className="surfaceDescription">
              Os registros abaixo vêm de consultas ao banco a cada carregamento.
            </p>
            <div className="databaseNotice">
              <span className={`statusDot ${online ? "ok" : ""}`} />
              <div>
                <strong>{online ? "Banco conectado" : "Aguardando configuração"}</strong>
                <span>{explanations[data.kind]}</span>
              </div>
            </div>
            {data.messages.length ? (
              <ol className="messageList">
                {data.messages.map((msg) => (
                  <li key={msg.id}>
                    <div className="messageHeading">
                      <strong>{msg.author}</strong>
                      <span>{new Date(msg.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    </div>
                    <p>{msg.body}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="emptyState">
                <span aria-hidden="true">↗</span>
                <p>{online ? "Nenhuma mensagem ainda." : "Conecte o Neon para visualizar as mensagens."}</p>
              </div>
            )}
          </article>
        </div>
        <div className="demoFoot">
          <span>Endpoint de saúde: <code>/api/health</code></span>
          <span>Esta demonstração não substitui a MESSAGE LINE pessoal.</span>
        </div>
      </section>

      <section className="closing">
        <p>O próximo SideUp não precisa começar do zero.</p>
        <h2>Os recursos mudam.<br /><span>A Side permanece.</span></h2>
      </section>

      <footer className="footer">
        <span>side.md <span className="footerAccent">/ SideMinD</span></span>
        <span>SideUp Web · Prova de conceito</span>
      </footer>
    </main>
  );
}
