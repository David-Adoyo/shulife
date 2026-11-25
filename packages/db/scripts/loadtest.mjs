// Term-opening burst (§14): fire M-Pesa confirmations at a running Shulife server and
// check the database afterwards: no loss, no duplicates, receipts within budget.
// Usage: DATABASE_URL=… BASE=http://localhost:4300 node scripts/loadtest.mjs [total] [concurrency]
import pg from "pg";
const total = Number(process.argv[2] ?? 2000);
const concurrency = Number(process.argv[3] ?? 40);
const BASE = process.env.BASE ?? "http://localhost:4300";
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();
const adms = (await db.query(`select l.admission_number, c.code from learners l join campuses c on c.id = l.campus_id where l.status = 'active'`)).rows;
const before = Number((await db.query(`select count(*) from payments`)).rows[0].count);
const rawBefore = Number((await db.query(`select count(*) from raw_mpesa_events`)).rows[0].count);

const uniqueCount = Math.round(total * 0.9);
const run = Date.now().toString(36).toUpperCase();
const events = [];
for (let i = 0; i < uniqueCount; i++) {
  const a = adms[(i * 7919) % adms.length];
  const ref = i % 10 < 7 ? `ADM ${a.admission_number}` : i % 10 < 9 ? a.admission_number : "school fees";
  events.push({ campus: a.code.toLowerCase(), body: { TransactionType: "Pay Bill", TransID: `LT${run}${String(i).padStart(5, "0")}`, TransTime: "20270203101500", TransAmount: String(500 + (i % 20) * 250), BusinessShortCode: "522533", BillRefNumber: ref, MSISDN: `2547${String(10000000 + i).slice(-8)}`, FirstName: "LOAD" } });
}
for (let i = 0; events.length < total; i++) events.push(events[(i * 13) % uniqueCount]); // repeated callbacks
events.sort(() => Math.random() - 0.5);

const latencies = [];
let errors = 0;
let next = 0;
const started = Date.now();
async function worker() {
  while (next < events.length) {
    const e = events[next++];
    const t = Date.now();
    try {
      const r = await fetch(`${BASE}/api/webhooks/mpesa/${e.campus}/demo-${e.campus}/confirmation`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(e.body) });
      const j = await r.json();
      if (r.status !== 200 || j.ResultCode !== 0) errors++;
    } catch {
      errors++;
    }
    latencies.push(Date.now() - t);
  }
}
await Promise.all(Array.from({ length: concurrency }, worker));
const seconds = (Date.now() - started) / 1000;
latencies.sort((a, b) => a - b);
const pct = (p) => latencies[Math.min(latencies.length - 1, Math.floor((p / 100) * latencies.length))];

const stored = Number((await db.query(`select count(*) from payments where provider_ref like $1`, [`LT${run}%`])).rows[0].count);
const distinct = Number((await db.query(`select count(distinct provider_ref) from payments where provider_ref like $1`, [`LT${run}%`])).rows[0].count);
const raw = Number((await db.query(`select count(*) from raw_mpesa_events`)).rows[0].count) - rawBefore;
const receipted = Number((await db.query(`select count(*) from payments p join receipts r on r.payment_id = p.id where p.provider_ref like $1`, [`LT${run}%`])).rows[0].count);
const auto = Number((await db.query(`select count(*) from payments where provider_ref like $1 and match_status = 'auto'`, [`LT${run}%`])).rows[0].count);
await db.end();

const report = { sent: total, unique: uniqueCount, duplicatesSent: total - uniqueCount, httpErrors: errors, seconds: +seconds.toFixed(1), perSecond: +(total / seconds).toFixed(1), p50ms: pct(50), p95ms: pct(95), p99ms: pct(99), rawEventsStored: raw, paymentsStored: stored, distinctPayments: distinct, lost: uniqueCount - stored, duplicatesStored: stored - distinct, receipted, autoMatched: auto };
console.log(JSON.stringify(report, null, 2));
const ok = report.lost === 0 && report.duplicatesStored === 0 && report.httpErrors === 0 && report.rawEventsStored === total && report.p95ms < 30_000;
console.log(ok ? "LOAD TEST PASSED" : "LOAD TEST FAILED");
process.exit(ok ? 0 : 1);
