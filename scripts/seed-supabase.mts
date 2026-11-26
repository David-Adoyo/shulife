// Loads the fictional demo school ("Mlima Academy") into a database over the Supabase
// Management API (HTTPS), by turning saveSchool's queries into literal SQL.
// Usage: NODE_USE_ENV_PROXY=1 npx tsx scripts/seed-supabase.mts <project-ref>   (or --print > demo.sql)
import { createSchool } from "@shulife/demo";
import { saveSchool } from "@shulife/db";

const lit = (v: unknown): string => {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (Array.isArray(v)) return v.length ? `ARRAY[${v.map(lit).join(",")}]` : "'{}'";
  return `'${String(v).replace(/'/g, "''")}'`;
};
const statements: string[] = [];
const fake = {
  async query(text: string, params: unknown[] = []) {
    if (/^(begin|commit|rollback)$/i.test(text.trim())) return { rows: [], rowCount: 0 };
    statements.push(text.replace(/\$(\d+)/g, (_, n) => lit(params[Number(n) - 1])) + ";");
    return { rows: [{ id: "x" }], rowCount: 1 };
  },
};
const orgId = await saveSchool(fake as never, createSchool());
const ref = process.argv[2];
if (!ref || ref === "--print") {
  process.stdout.write(statements.join("\n") + "\n");
} else {
  // Send in ~1.5 MB chunks, each in its own transaction.
  let chunk: string[] = [];
  let size = 0;
  let sent = 0;
  const flush = async () => {
    if (!chunk.length) return;
    const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, { method: "POST", headers: { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN ?? "proxy-injected"}`, "content-type": "application/json" }, body: JSON.stringify({ query: `begin;\n${chunk.join("\n")}\ncommit;` }) });
    if (!r.ok) throw new Error(`${r.status}: ${(await r.text()).slice(0, 500)}`);
    sent += chunk.length;
    console.error(`sent ${sent}/${statements.length} statements`);
    chunk = [];
    size = 0;
  };
  for (const s of statements) {
    chunk.push(s);
    size += s.length;
    if (size > 1_500_000) await flush();
  }
  await flush();
  console.error(`demo school loaded: organisation ${orgId}`);
}
