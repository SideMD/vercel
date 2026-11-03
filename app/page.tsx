import MessageComposer from "@/components/message-composer";
import InferenceComposer from "@/components/inference-composer";
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
  unconfigured: "Neon is not yet linked to this deployment.",
  offline: "Neon is configured, but the query did not respond.",
  schema: "Neon responded. Run db/schema.sql in the SQL Editor.",
  connected: "Live Neon database connection established.",
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
        <div className="eyebrow"><span className="signal" /> A SPACE FOR THE PERSON</div>
        <h1>Your Side.<br /><span>Your MinD.</span></h1>
        <p className="heroLead">
          Your digital space starts here. Intelligence joins when you need it.
          You, your messages and continuity remain at the center.
        </p>
        <div className="heroActions">
          <a className="primaryButton" href="#neon">Explore the first SideUp <span aria-hidden="true">↗</span></a>
          <span className="hint">Next.js + Vercel + Neon</span>
        </div>
        <div className="orb orbOne" aria-hidden="true" />
        <div className="orb orbTwo" aria-hidden="true" />
      </section>

      <section className="principleGrid" aria-label="Princípios">
        <article className="principle">
          <span className="ordinal">01 / EDGE</span>
          <h2>You are the origin.</h2>
          <p>Your Side holds your identity. Services connect to it, not the other way around.</p>
        </article>
        <article className="principle">
          <span className="ordinal">02 / MESSAGE</span>
          <h2>Messages preserved.</h2>
          <p>Message first. INSIDEOUT when a meaningful difference emerges.</p>
        </article>
        <article className="principle">
          <span className="ordinal">03 / RESOURCES</span>
          <h2>Compute on demand.</h2>
          <p>Vercel and Neon are resources in a larger ecosystem.</p>
        </article>
      </section>

      <section id="neon" className="demoSection">
        <div className="sectionTop">
          <div>
            <div className="eyebrow mini">PROOF OF CONCEPT / 001</div>
            <h2>SideUp Messages</h2>
            <p>A first meeting between web interface, processing, and persistence.</p>
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
            <h3>A message, persisted.</h3>
            <p className="surfaceDescription">
              Test a real write with your private demo key.
              No credentials stored by the site in browser storage.
            </p>
            <MessageComposer enabled={online} />
          </article>

          <article className="surface history">
            <div className="surfaceTop">
              <span className="surfaceNumber">B / STORAGE</span>
              <span className="liveMark">POSTGRESQL / NEON</span>
            </div>
            <h3>Recoverable timeline.</h3>
            <p className="surfaceDescription">
              The records below are queried from the database on every page load.
            </p>
            <div className="databaseNotice">
              <span className={`statusDot ${online ? "ok" : ""}`} />
              <div>
                <strong>{online ? "Database connected" : "Awaiting configuration"}</strong>
                <span>{explanations[data.kind]}</span>
              </div>
            </div>
            {data.messages.length ? (
              <ol className="messageList">
                {data.messages.map((msg) => (
                  <li key={msg.id}>
                    <div className="messageHeading">
                      <strong>{msg.author}</strong>
                      <span>{new Date(msg.createdAt).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    </div>
                    <p>{msg.body}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="emptyState">
                <span aria-hidden="true">↗</span>
                <p>{online ? "No messages yet." : "Connect Neon to view messages."}</p>
              </div>
            )}
          </article>
        </div>
        <div className="demoFoot">
          <span>Health endpoint: <code>/api/health</code></span>
          <span>This demo does not replace your personal MESSAGE LINE.</span>
        </div>
      </section>

      <section id="ai-workspaces" className="demoSection providerSection">
        <div className="sectionTop">
          <div>
            <div className="eyebrow mini">WORKSPACES / ON DEMAND</div>
            <h2>Bring intelligence into the meeting.</h2>
            <p>Google Gemini, Perplexity, Claude, NVIDIA and Modal are independent resources. Your Side stays yours.</p>
          </div>
        </div>
        <article className="surface providerSurface">
          <div className="surfaceTop">
            <span className="surfaceNumber">C / PROCESSING</span>
            <span className="liveMark">GEMINI · PERPLEXITY · CLAUDE · NVIDIA · MODAL</span>
          </div>
          <h3>Ask an AI workspace.</h3>
          <p className="surfaceDescription">
            Optional server-side access through keys configured on Vercel. No provider credentials are sent to the browser.
          </p>
          <InferenceComposer
            enabled={Boolean(process.env.SIDE_INFERENCE_GATE_KEY)}
            status={{
              gemini: Boolean(process.env.GEMINI_API_KEY),
              perplexity: Boolean(process.env.PERPLEXITY_API_KEY),
              claude: Boolean(process.env.ANTHROPIC_API_KEY && process.env.CLAUDE_MODEL),
              nvidia: Boolean(process.env.NVIDIA_API_KEY),
              modal: Boolean(process.env.MODAL_ENDPOINT_URL && process.env.MODAL_TOKEN_ID && process.env.MODAL_TOKEN_SECRET),
            }}
          />
        </article>
      </section>

      <section className="closing">
        <p>The next SideUp does not need to start from scratch.</p>
        <h2>Resources change.<br /><span>The Side remains.</span></h2>
      </section>

      <footer className="footer">
        <span>side.md <span className="footerAccent">/ SideMinD</span></span>
        <span>SideUp Web · Proof of concept</span>
      </footer>
    </main>
  );
}
