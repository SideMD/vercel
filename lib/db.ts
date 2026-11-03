import { neon } from "@neondatabase/serverless";

export function getSql() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  return url ? neon(url) : null;
}
