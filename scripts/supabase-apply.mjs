// Applies supabase/migrations to a Supabase project through the Management API and records
// them in supabase_migrations.schema_migrations (so `supabase db push` stays in sync).
// Usage: SUPABASE_ACCESS_TOKEN=sbp_… node scripts/supabase-apply.mjs <project-ref>
import { readdirSync, readFileSync } from "node:fs";
const ref = process.argv[2];
if (!ref) throw new Error("Usage: node scripts/supabase-apply.mjs <project-ref>");
const token = process.env.SUPABASE_ACCESS_TOKEN ?? "proxy-injected";
export async function sql(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ query }) });
  const text = await r.text();
  if (!r.ok) throw new Error(`${r.status}: ${text.slice(0, 600)}`);
  return JSON.parse(text);
}
await sql(`create schema if not exists supabase_migrations;
  create table if not exists supabase_migrations.schema_migrations (version text primary key, statements text[], name text)`);
const done = new Set((await sql(`select version from supabase_migrations.schema_migrations`)).map((r) => r.version));
const dir = new URL("../supabase/migrations/", import.meta.url);
for (const f of readdirSync(dir).filter((x) => x.endsWith(".sql")).sort()) {
  const [version, ...rest] = f.replace(/\.sql$/, "").split("_");
  if (done.has(version)) { console.log(`skip  ${f}`); continue; }
  const body = readFileSync(new URL(f, dir), "utf8");
  const q = (s) => `'${s.replace(/'/g, "''")}'`;
  await sql(`begin;\n${body}\n;insert into supabase_migrations.schema_migrations (version, name, statements) values (${q(version)}, ${q(rest.join("_"))}, array[${q(body)}]);\ncommit;`);
  console.log(`apply ${f}`);
}
