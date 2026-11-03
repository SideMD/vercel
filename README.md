# SideMinD · SideUp Web

First public web workspace for SideMinD. Next.js 16 + Neon PostgreSQL. Code in this repository never contains Neon credentials.

## Deploy on Vercel

1. Import GitHub repository **SideMD/vercel** into the desired Vercel account or team. Framework: Next.js. Root Directory: repository root (`./`). Production Branch: `main`.
2. In Vercel **Storage / Marketplace**, connect **Neon** to the project. If you already have a Neon account/database, choose the existing database rather than accidentally provisioning a second one. Alternatively copy its *pooled* database connection string directly to Vercel Project Settings → Environment Variables as `DATABASE_URL`. Never paste this secret into chats or commit it.
3. Neon SQL Editor: execute `db/schema.sql` once in the database selected for this prototype.
4. Set a long random `SIDE_DEMO_WRITE_KEY` in Vercel **Environment Variables** to enable the protected demo form. Keep it server-side. Without this secret the app remains read-only.
5. Redeploy. Open `/api/health`: `{"status":"ok","database":"connected"}` means this deployment queried Neon. The homepage then reads persisted messages.
6. Map your verified SideMinD domain from Vercel Project Settings → Domains after the project is healthy. Do not assume `side.md` or a subdomain is already pointed at this particular project.

## Local

```sh
npm install
cp .env.example .env.local
# Enter your Neon DATABASE_URL and optional SIDE_DEMO_WRITE_KEY into .env.local
npm run dev
```

## Architecture

- **Vercel:** stateless Next.js web/API deployment; does not own the person's identity or the sole authoritative records.
- **Neon:** independent PostgreSQL. Other trusted Edge/cloud services can connect with distinct restricted roles and separate credentials. Vercel should not be the only consumer or administrator.
- **Side/Edge:** remains owner of the person's original audio, MESSAGE LINE, TL, and private sources. Public demo messages here are **not** production INSIDEOUTs.
- **Security:** write key is only a demo gate, not production authentication, rate limiting, or multi-tenant access control. Before collecting real personal messages implement individual login, authorization, rate limiting, audit and encrypted/private storage. Never expose `DATABASE_URL` or OIDC signing private keys in client code.

## Routes

- `/` – responsive SideMinD starting screen, Neon status and persisted demo messages
- `/api/health` – performs a real Neon connectivity query; 503 until configured
- `/api/messages` – authenticated POST for short demo messages (requires SIDE_DEMO_WRITE_KEY)

A Vercel account / team and Neon credentials must be connected by an authorized owner in Vercel/Neon. Pushing files to GitHub alone does not prove a live deployment.