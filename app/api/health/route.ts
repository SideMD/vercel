import { getSql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store" };

export async function GET() {
  const sql = getSql();
  if (!sql) {
    return Response.json(
      { status: "setup_required", database: "not_configured" },
      { status: 503, headers },
    );
  }

  try {
    const rows = await sql`select current_timestamp as server_time`;
    return Response.json(
      {
        status: "ok",
        database: "connected",
        serverTime: rows[0]?.server_time ?? null,
      },
      { headers },
    );
  } catch {
    return Response.json(
      { status: "unavailable", database: "connection_failed" },
      { status: 503, headers },
    );
  }
}
