import { timingSafeEqual } from "node:crypto";
import { getSql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store" };

function authorized(provided: string, expected: string) {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET() {
  const sql = getSql();
  if (!sql) {
    return Response.json({ error: "database_not_configured" }, { status: 503, headers });
  }
  try {
    const rows = await sql`
      select id, author, body, created_at
      from public.side_demo_messages
      order by created_at desc, id desc
      limit 10
    `;
    return Response.json({ messages: rows }, { headers });
  } catch {
    return Response.json({ error: "database_or_schema_unavailable" }, { status: 503, headers });
  }
}

export async function POST(request: Request) {
  const configuredKey = process.env.SIDE_DEMO_WRITE_KEY || "";
  if (!configuredKey) {
    return Response.json({ error: "demo_writes_disabled" }, { status: 503, headers });
  }
  if (!authorized(request.headers.get("x-side-write-key") ?? "", configuredKey)) {
    return Response.json({ error: "unauthorized" }, { status: 401, headers });
  }

  const sql = getSql();
  if (!sql) {
    return Response.json({ error: "database_not_configured" }, { status: 503, headers });
  }

  const data: unknown = await request.json().catch(() => null);
  if (!data || typeof data !== "object") {
    return Response.json({ error: "invalid_payload" }, { status: 400, headers });
  }
  const input = data as Record<string, unknown>;
  const author = typeof input.author === "string" ? input.author.trim() : "";
  const body = typeof input.body === "string" ? input.body.trim() : "";

  if (!author || author.length > 40 || !body || body.length > 280) {
    return Response.json({ error: "invalid_length" }, { status: 400, headers });
  }

  try {
    const rows = await sql`
      insert into public.side_demo_messages (author, body)
      values (${author}, ${body})
      returning id
    `;
    return Response.json({ status: "stored", id: String(rows[0]?.id ?? "") }, { status: 201, headers });
  } catch {
    return Response.json({ error: "database_write_failed" }, { status: 503, headers });
  }
}
