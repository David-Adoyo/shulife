import { createHash } from "node:crypto";
import type pg from "pg";
import { gradeLevel, gradeName, type LedgerEntry } from "@shulife/core";
import { seedCommunication, type OpenLine, type Payment, type School } from "@shulife/demo";

/**
 * Postgres persistence for the school model. `saveSchool` writes a whole school
 * (used to seed a database with the demo), `loadSchool` rebuilds the in-memory
 * model from the tables, and `persistIngest` / `persistResolution` write each new
 * payment through in one transaction. The database's unique (org_id, provider_ref)
 * index is the final word on duplicates.
 *
 * Runs with a service-role connection: callers must have authorised the request.
 */

type Db = pg.PoolClient | pg.Client;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
/** Deterministic UUID for a demo string id (stable across runs). */
export function uid(kind: string, id: string): string {
  if (UUID.test(id)) return id;
  const h = createHash("md5").update(`${kind}:${id}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
const SYSTEM_USER = "00000000-0000-4000-a000-000000000001";

async function insertMany(db: Db, table: string, cols: string[], rows: unknown[][], suffix = "") {
  const per = Math.max(1, Math.floor(30000 / cols.length));
  for (let i = 0; i < rows.length; i += per) {
    const chunk = rows.slice(i, i + per);
    const params: unknown[] = [];
    const values = chunk.map((r) => `(${r.map((v) => (params.push(v), `$${params.length}`)).join(",")})`).join(",");
    await db.query(`insert into ${table} (${cols.join(",")}) values ${values} ${suffix}`, params);
  }
}

/** The fee line a ledger entry settles, from the id formats the pipeline uses. */
function settledLine(e: LedgerEntry): string | null {
  if (e.kind === "credit_applied") return e.id.split(":").slice(3).join(":");
  if (e.kind === "allocation") return e.id.slice(e.id.indexOf(":") + 1);
  if (e.kind === "reversal" && e.id.endsWith(":rev")) {
    const inner = e.id.slice(0, -4);
    return inner.slice(inner.indexOf(":") + 1);
  }
  return null;
}

export async function saveSchool(db: Db, s: School): Promise<string> {
  const org = uid("org", s.org.id);
  const term = (key: string) => s.terms.find((t) => t.key === key)!;
  await db.query("begin");
  try {
    await db.query(`insert into organisations (id, name, allocation_rule, clearance_pct, quiet_start, quiet_end, max_reminders_per_week, family_code_prefix, is_demo) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [org, s.org.name, s.org.allocationRule, s.org.clearancePct, s.org.quietStart, s.org.quietEnd, s.org.maxPerWeek, s.org.familyPrefix, s.org.isDemo ?? false]);
    await insertMany(db, "campuses", ["id", "org_id", "name", "code", "phone", "paybill_display"], s.campuses.map((c) => [uid("campus", c.id), org, c.name, c.code, s.org.officePhone, c.paybill]));
    const years = [...new Set(s.terms.map((t) => t.year))];
    await insertMany(db, "academic_years", ["id", "org_id", "name", "starts_on", "ends_on"], years.map((y) => [uid("year", String(y)), org, String(y), `${y}-01-01`, `${y}-12-31`]));
    await insertMany(db, "terms", ["id", "org_id", "academic_year_id", "name", "number", "opens_on", "closes_on", "fee_due_on", "status"], s.terms.map((t) => [uid("term", t.id), org, uid("year", String(t.year)), t.name, t.number, t.opening, t.closing, t.due, t.status]));
    await insertMany(db, "grades", ["id", "org_id", "code", "display_name", "sort_order", "level"], s.grades.map((g, i) => [uid("grade", g), org, g, gradeName(g), i, gradeLevel(g)]));
    await insertMany(db, "streams", ["id", "org_id", "campus_id", "grade_id", "name"], s.streams.map((st) => [uid("stream", st.id), org, uid("campus", st.campusId), uid("grade", st.gradeCode), st.name]));
    await insertMany(db, "transport_routes", ["id", "org_id", "campus_id", "name", "amount_cents"], s.routes.map((r) => [uid("route", r.id), org, uid("campus", r.campusId), r.name, r.amount]));
    await insertMany(db, "families", ["id", "org_id", "code", "display_name", "preferred_language", "credit_cents", "consent_whatsapp"], s.families.map((f) => [uid("family", f.id), org, f.code, f.displayName, f.lang, f.credit, s.guardians.some((g) => g.familyId === f.id && g.whatsapp)]));
    await insertMany(db, "guardians", ["id", "org_id", "family_id", "name", "relationship", "phone_e164", "phone_hash", "phone_last3", "whatsapp_opt_in", "preferred_language", "is_primary_payer"], s.guardians.map((g) => [uid("guardian", g.id), org, uid("family", g.familyId), g.name, g.relationship, `254${g.phone.slice(1)}`, g.phoneHash, g.phone.slice(-3), g.whatsapp, g.lang, g.isPayer]));
    await insertMany(db, "learners", ["id", "org_id", "campus_id", "family_id", "admission_number", "first_name", "last_name", "status", "boarding", "date_of_birth"], s.learners.map((l) => [uid("learner", l.id), org, uid("campus", l.campusId), uid("family", l.familyId), l.admissionNumber, l.firstName, l.lastName, l.status, l.boarding, `${l.ageKey}-01`]));
    await insertMany(db, "learner_guardians", ["org_id", "learner_id", "guardian_id"], s.learners.flatMap((l) => s.guardians.filter((g) => g.familyId === l.familyId).map((g) => [org, uid("learner", l.id), uid("guardian", g.id)])));
    const open = s.terms.find((t) => t.status === "open")!;
    await insertMany(db, "enrolments", ["org_id", "learner_id", "term_id", "grade_id", "stream_id", "boarding", "route_id"], s.learners.map((l) => [org, uid("learner", l.id), uid("term", open.id), uid("grade", l.gradeCode), uid("stream", l.streamId), l.boarding, l.routeId ? uid("route", l.routeId) : null]));
    await insertMany(db, "fee_items", ["id", "org_id", "code", "name", "kind", "pro_rata", "allocation_priority"], s.feeItems.map((f) => [uid("fee", f.id), org, f.code, f.name, f.kind, f.proRata, f.priority]));
    const lunch = s.feeItems.find((f) => f.code === "lunch")!;
    await insertMany(db, "optional_subscriptions", ["org_id", "learner_id", "term_id", "fee_item_id"], s.learners.filter((l) => l.lunch).map((l) => [org, uid("learner", l.id), uid("term", open.id), uid("fee", lunch.id)]));
    for (const t of s.terms) {
      const fsId = uid("structure", t.id);
      await db.query(`insert into fee_structures (id, org_id, campus_id, term_id, status, published_at) values ($1,$2,$3,$4,'published', now())`, [fsId, org, uid("campus", s.campuses[0].id), uid("term", t.id)]);
      await insertMany(db, "fee_structure_rows", ["org_id", "structure_id", "grade_id", "fee_item_id", "day_cents", "boarder_cents"], s.structures[t.id].map((r) => [org, fsId, uid("grade", r.gradeCode), uid("fee", r.feeItemId), r.day, r.boarder]));
    }
    const sponsor = uid("sponsor", s.sponsor.id);
    await db.query(`insert into sponsors (id, org_id, name) values ($1,$2,$3)`, [sponsor, org, s.sponsor.name]);
    await insertMany(db, "sponsorships", ["org_id", "sponsor_id", "learner_id", "fee_item_codes", "percent"], s.learners.filter((l) => l.sponsored).map((l) => [org, sponsor, uid("learner", l.id), ["tuition"], 50]));

    // Invoices: the charge line of each fee item carries the open-line id used by allocations.
    await insertMany(db, "invoices", ["id", "org_id", "campus_id", "learner_id", "term_id", "number", "total_cents", "created_at"], s.invoices.map((i) => [uid("inv", i.id), org, uid("campus", i.campusId), uid("learner", i.learnerId), uid("term", i.termId), i.number, i.total, new Date(Date.parse(s.terms.find((t) => t.id === i.termId)!.opening) - 14 * 86_400_000).toISOString()]));
    const lineRows: unknown[][] = [];
    for (const inv of s.invoices) {
      for (const l of inv.lines) {
        const id = l.kind === "charge" ? uid("line", `${inv.id}:${l.feeItemCode}`) : uid("il", `${inv.id}:${l.key}`);
        lineRows.push([id, org, uid("inv", inv.id), l.feeItemId ? uid("fee", l.feeItemId) : null, l.kind, l.description, l.amount, l.optional, l.sponsorId ? sponsor : null]);
      }
    }
    await insertMany(db, "invoice_lines", ["id", "org_id", "invoice_id", "fee_item_id", "kind", "description", "amount_cents", "optional", "sponsor_id"], lineRows);
    await insertMany(db, "ledger_entries", ["id", "org_id", "learner_id", "term_id", "kind", "description", "amount_cents", "ref", "source_id", "created_at"], s.ledger.map((e) => {
      const line = settledLine(e);
      return [uid("le", e.id), org, uid("learner", e.learnerId), uid("term", term(e.termKey).id), e.kind, e.description, e.amount, e.ref ?? null, line ? uid("line", line) : null, e.at];
    }));

    const deposit = uid("deposit", "demo");
    await db.query(`insert into bank_deposits (id, org_id, deposited_on, slip_ref, amount_cents) values ($1,$2,$3,'DEMO-DEPOSITS',0)`, [deposit, org, s.today.slice(0, 10)]);
    for (const p of s.payments) await insertPayment(db, org, s, p, s.ledger.filter((e) => e.id.startsWith(`${p.id}:`)), deposit);
    await insertMany(db, "payer_links", ["org_id", "phone_hash", "family_id", "source"], s.payerLinks.map((l) => [org, l.phoneHash, uid("family", l.familyId), l.source]), "on conflict do nothing");
    for (const plan of s.plans) {
      const pid = uid("plan", plan.id);
      await db.query(`insert into payment_plans (id, org_id, family_id, term_id, status, total_cents, accepted_at) values ($1,$2,$3,$4,$5,$6,$7)`, [pid, org, uid("family", plan.familyId), uid("term", plan.termId), plan.status, plan.total, plan.acceptedAt]);
      await insertMany(db, "plan_instalments", ["org_id", "plan_id", "n", "due_on", "amount_cents", "paid_cents"], plan.instalments.map((i) => [org, pid, i.n, i.dueDate, i.amount, i.paid]));
    }
    await db.query("commit");
    return org;
  } catch (e) {
    await db.query("rollback");
    throw e;
  }
}

/** Insert one payment with its receipt, allocations, review card and manual-receipt record. */
async function insertPayment(db: Db, org: string, s: School, p: Payment, entries: LedgerEntry[], depositId: string | null, onConflictSkip = false) {
  const id = uid("pay", p.id);
  const r = await db.query(
    `insert into payments (id, org_id, campus_id, provider_ref, amount_cents, msisdn_hash, msisdn_last3, payer_name, bill_ref, paid_at, channel, match_status, confidence, matched_family_id, matched_learner_id, rule_used, match_kind)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) ${onConflictSkip ? "on conflict (org_id, provider_ref) do nothing" : ""} returning id`,
    [id, org, uid("campus", p.campusId), p.providerRef, p.amount, p.phoneHash, p.phoneLast3, p.payerName, p.billRef, p.paidAt, p.channel, p.matchStatus, p.confidence, p.familyId ? uid("family", p.familyId) : null, p.learnerId ? uid("learner", p.learnerId) : null, p.rule, p.matchKind],
  );
  if (r.rowCount === 0) return false;
  if (p.receiptNo) await db.query(`insert into receipts (org_id, payment_id, number, verify_code) values ($1,$2,$3,$4)`, [org, id, p.receiptNo, p.verifyCode]);
  const allocs = entries.filter((e) => e.kind === "allocation");
  if (allocs.length) await insertMany(db, "allocations", ["id", "org_id", "payment_id", "learner_id", "invoice_line_id", "amount_cents", "rule"], allocs.map((e) => [uid("alloc", e.id), org, id, uid("learner", e.learnerId), uid("line", settledLine(e)!), -e.amount, p.rule ?? "oldest_balance"]));
  if (p.matchStatus === "suggested" || p.matchStatus === "unmatched" || p.matchStatus === "not_ours" || p.matchKind === "Reviewed") {
    const resolved = p.matchStatus === "manual" ? "assigned" : p.matchStatus === "not_ours" ? "not_ours" : null;
    await db.query(`insert into review_queue (org_id, payment_id, suggestions, resolution, resolved_family_id) values ($1,$2,$3,$4,$5)`, [org, id, JSON.stringify((p.suggestions ?? []).map((sg) => ({ ...sg, familyId: uid("family", sg.familyId), learnerId: sg.learnerId ? uid("learner", sg.learnerId) : null, signals: sg.signals.map((x) => ({ ...x, learnerId: x.learnerId ? uid("learner", x.learnerId) : undefined })) }))), resolved, resolved === "assigned" && p.familyId ? uid("family", p.familyId) : null]);
  }
  if (p.channel === "cash" || p.channel === "cheque" || p.channel === "bank_slip") {
    await db.query(`insert into manual_receipts (org_id, payment_id, book_ref, photo_path, received_by, received_on, banked_deposit_id) values ($1,$2,$3,$4,$5,$6,$7)`, [org, id, p.bookRef ?? "—", "demo/no-photo", SYSTEM_USER, p.paidAt.slice(0, 10), p.banked ? depositId : null]);
  }
  return true;
}

async function writeLedger(db: Db, org: string, s: School, entries: LedgerEntry[]) {
  const term = (key: string) => s.terms.find((t) => t.key === key)!;
  if (!entries.length) return;
  await insertMany(db, "ledger_entries", ["id", "org_id", "learner_id", "term_id", "kind", "description", "amount_cents", "ref", "source_id", "created_at"], entries.map((e) => {
    const line = settledLine(e);
    return [uid("le", e.id), org, uid("learner", e.learnerId), uid("term", term(e.termKey).id), e.kind, e.description, e.amount, e.ref ?? null, line ? uid("line", line) : null, e.at];
  }));
}

/** Write a newly ingested payment (and its ledger lines). Returns "duplicate" if the DB already has it. */
export async function persistIngest(db: Db, s: School, p: Payment, newEntries: LedgerEntry[]): Promise<"saved" | "duplicate"> {
  const org = uid("org", s.org.id);
  await db.query("begin");
  try {
    const ok = await insertPayment(db, org, s, p, newEntries, null, true);
    if (!ok) {
      await db.query("rollback");
      return "duplicate";
    }
    await writeLedger(db, org, s, newEntries);
    if (p.familyId) await db.query(`update families set credit_cents = $1 where id = $2`, [s.families.find((f) => f.id === p.familyId)!.credit, uid("family", p.familyId)]);
    await db.query("commit");
    return "saved";
  } catch (e) {
    await db.query("rollback");
    throw e;
  }
}

/** Write a review-queue decision: matching fields, allocations, ledger, receipt and the learned phone. */
export async function persistResolution(db: Db, s: School, p: Payment, newEntries: LedgerEntry[]) {
  const org = uid("org", s.org.id);
  const id = uid("pay", p.id);
  await db.query("begin");
  try {
    await db.query(`update payments set match_status = $1, matched_family_id = $2, matched_learner_id = $3, rule_used = $4, match_kind = $5 where id = $6`, [p.matchStatus, p.familyId ? uid("family", p.familyId) : null, p.learnerId ? uid("learner", p.learnerId) : null, p.rule, p.matchKind, id]);
    await db.query(`update review_queue set resolution = $1, resolved_family_id = $2, resolved_at = now() where payment_id = $3`, [p.matchStatus === "not_ours" ? "not_ours" : "assigned", p.familyId ? uid("family", p.familyId) : null, id]);
    if (p.receiptNo) await db.query(`insert into receipts (org_id, payment_id, number, verify_code) values ($1,$2,$3,$4) on conflict do nothing`, [org, id, p.receiptNo, p.verifyCode]);
    const allocs = newEntries.filter((e) => e.kind === "allocation");
    if (allocs.length) await insertMany(db, "allocations", ["id", "org_id", "payment_id", "learner_id", "invoice_line_id", "amount_cents", "rule"], allocs.map((e) => [uid("alloc", e.id), org, id, uid("learner", e.learnerId), uid("line", settledLine(e)!), -e.amount, p.rule ?? "oldest_balance"]));
    await writeLedger(db, org, s, newEntries);
    if (p.familyId) {
      await db.query(`update families set credit_cents = $1 where id = $2`, [s.families.find((f) => f.id === p.familyId)!.credit, uid("family", p.familyId)]);
      if (p.phoneHash) await db.query(`insert into payer_links (org_id, phone_hash, family_id, source) values ($1,$2,$3,'learned') on conflict do nothing`, [org, p.phoneHash, uid("family", p.familyId)]);
    }
    await db.query("commit");
  } catch (e) {
    await db.query("rollback");
    throw e;
  }
}

export async function saveRawEvent(db: Db, orgId: string, kind: string, payload: unknown, headers: Record<string, string>) {
  await db.query(`insert into raw_mpesa_events (org_id, kind, payload, headers) values ($1,$2,$3,$4)`, [orgId, kind, JSON.stringify(payload), JSON.stringify(headers)]);
}

export async function firstOrgId(db: Db): Promise<string | null> {
  const r = await db.query(`select id from organisations order by created_at limit 1`);
  return r.rows[0]?.id ?? null;
}

/** The school's change counter (bumped by triggers on every write). */
export async function orgVersion(db: Db, orgId: string): Promise<number> {
  const r = await db.query(`select version from org_versions where org_id = $1`, [orgId]);
  return Number(r.rows[0]?.version ?? 0);
}

/** Rebuild the school model from Postgres. Ids are the database UUIDs. */
export async function loadSchool(db: Db, orgId: string, opts: { today: string }): Promise<School> {
  const q = async <T = Record<string, any>>(sql: string) => (await db.query(sql, [orgId])).rows as T[];
  const [org] = await q(`select * from organisations where id = $1`);
  if (!org) throw new Error("Organisation not found");
  const campuses = await q(`select * from campuses where org_id = $1 order by code desc`);
  const grades = await q(`select * from grades where org_id = $1 order by sort_order`);
  const gradeCode = new Map(grades.map((g) => [g.id, g.code as string]));
  const terms = await q(`select t.*, extract(year from t.opens_on)::int as year from terms t where org_id = $1 order by opens_on`);
  const termKey = new Map(terms.map((t) => [t.id, `${t.year}-${t.number}`]));
  const openTerm = terms.find((t) => t.status === "open")!;
  const streams = await q(`select * from streams where org_id = $1`);
  const routes = await q(`select * from transport_routes where org_id = $1 order by name`);
  const families = await q(`select * from families where org_id = $1 order by code`);
  const guardians = await q(`select * from guardians where org_id = $1`);
  const learners = await q(`select l.*, e.grade_id, e.stream_id, e.route_id, (os.id is not null) as lunch, (sp.id is not null) as sponsored
    from learners l
    left join enrolments e on e.learner_id = l.id and e.term_id = (select id from terms where org_id = $1 and status = 'open' limit 1)
    left join optional_subscriptions os on os.learner_id = l.id and os.term_id = e.term_id
    left join sponsorships sp on sp.learner_id = l.id
    where l.org_id = $1`);
  const feeItems = await q(`select * from fee_items where org_id = $1`);
  const rows = await q(`select r.*, s.term_id from fee_structure_rows r join fee_structures s on s.id = r.structure_id where r.org_id = $1`);
  const invoices = await q(`select * from invoices where org_id = $1`);
  const lines = await q(`select * from invoice_lines where org_id = $1`);
  const ledger = await q(`select * from ledger_entries where org_id = $1 order by created_at, id`);
  const payments = await q(`select p.*, r.number as receipt_no, r.verify_code, rq.suggestions, mr.book_ref, mr.banked_deposit_id from payments p
    left join receipts r on r.payment_id = p.id left join review_queue rq on rq.payment_id = p.id left join manual_receipts mr on mr.payment_id = p.id where p.org_id = $1 order by paid_at`);
  const allocs = await q(`select * from allocations where org_id = $1`);
  const links = await q(`select * from payer_links where org_id = $1`);
  const plans = await q(`select * from payment_plans where org_id = $1`);
  const instalments = await q(`select * from plan_instalments where org_id = $1 order by n`);
  const [sponsor] = await q(`select * from sponsors where org_id = $1 limit 1`);
  const iso = (d: Date | string) => (d instanceof Date ? d.toISOString() : new Date(d).toISOString());
  const day = (d: Date | string) => (d instanceof Date ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : String(d).slice(0, 10));
  const learnerFirst = new Map(learners.map((l) => [l.id, l.first_name as string]));

  // Open lines: net per fee item per invoice, keyed by the charge line, less ledger lines that settle it.
  const settled = new Map<string, number>();
  for (const e of ledger) if (e.source_id) settled.set(e.source_id, (settled.get(e.source_id) ?? 0) + Number(e.amount_cents));
  const feeById = new Map(feeItems.map((f) => [f.id, f]));
  const openLines = new Map<string, OpenLine>();
  const linesByInvoice = new Map<string, any[]>();
  for (const l of lines) linesByInvoice.set(l.invoice_id, [...(linesByInvoice.get(l.invoice_id) ?? []), l]);
  for (const inv of invoices) {
    const ls = linesByInvoice.get(inv.id) ?? [];
    for (const charge of ls.filter((l) => l.kind === "charge" && l.fee_item_id)) {
      const net = ls.filter((l) => l.fee_item_id === charge.fee_item_id).reduce((a, l) => a + Number(l.amount_cents), 0);
      if (net <= 0) continue;
      const f = feeById.get(charge.fee_item_id)!;
      openLines.set(charge.id, { lineId: charge.id, learnerId: inv.learner_id, termKey: termKey.get(inv.term_id)!, feeItemId: f.id, feeItemCode: f.code, feeItemName: f.name, priority: f.allocation_priority, amount: net, outstanding: net + (settled.get(charge.id) ?? 0) });
    }
  }

  // A payment belongs to the latest term whose statements had gone out (14 days before opening).
  const termFor = (at: string) => [...terms].reverse().find((t) => Date.parse(day(t.opens_on)) - 14 * 86_400_000 <= Date.parse(at))?.id ?? terms[0].id;
  void openTerm;
  const allocByPayment = new Map<string, any[]>();
  for (const a of allocs) allocByPayment.set(a.payment_id, [...(allocByPayment.get(a.payment_id) ?? []), a]);
  const receiptSeq: Record<string, number> = {};
  const school: School = {
    org: { id: org.id, name: org.name, allocationRule: org.allocation_rule, clearancePct: org.clearance_pct, quietStart: String(org.quiet_start).slice(0, 5), quietEnd: String(org.quiet_end).slice(0, 5), maxPerWeek: org.max_reminders_per_week, officePhone: campuses[0]?.phone ?? "", familyPrefix: org.family_code_prefix, isDemo: org.is_demo ?? false, county: campuses[0]?.county ?? "", setup: org.setup ?? {}, liveAt: org.live_at ? new Date(org.live_at).toISOString() : null },
    today: opts.today,
    campuses: campuses.map((c) => ({ id: c.id, name: c.name, code: c.code, paybill: c.paybill_display ?? "" })),
    grades: grades.map((g) => g.code),
    streams: streams.map((s) => ({ id: s.id, campusId: s.campus_id, gradeCode: gradeCode.get(s.grade_id)!, name: s.name, teacher: "" })),
    routes: routes.map((r) => ({ id: r.id, campusId: r.campus_id, name: r.name, amount: Number(r.amount_cents) })),
    families: families.map((f) => ({ id: f.id, code: f.code, displayName: f.display_name, lang: f.preferred_language, credit: Number(f.credit_cents), campusId: learners.find((l) => l.family_id === f.id)?.campus_id ?? campuses[0].id })),
    guardians: guardians.map((g) => ({ id: g.id, familyId: g.family_id, name: g.name, relationship: g.relationship ?? "", phone: `0${String(g.phone_e164).slice(3)}`, phoneHash: g.phone_hash, whatsapp: g.whatsapp_opt_in, lang: g.preferred_language, isPayer: g.is_primary_payer })),
    learners: learners.map((l) => ({ id: l.id, campusId: l.campus_id, familyId: l.family_id, admissionNumber: l.admission_number, firstName: l.first_name, lastName: l.last_name, gradeCode: gradeCode.get(l.grade_id) ?? "PP1", streamId: l.stream_id, boarding: l.boarding, routeId: l.route_id, lunch: l.lunch, status: l.status, ageKey: day(l.date_of_birth).slice(0, 7), sponsored: l.sponsored, staffChild: false })),
    terms: terms.map((t) => ({ id: t.id, key: `${t.year}-${t.number}`, name: t.name, number: t.number, year: t.year, opening: day(t.opens_on), closing: day(t.closes_on), due: day(t.fee_due_on), status: t.status === "closed" ? "closed" : "open" })),
    feeItems: feeItems.map((f) => ({ id: f.id, code: f.code, name: f.name, kind: f.kind, proRata: f.pro_rata, priority: f.allocation_priority })),
    structures: Object.fromEntries(terms.map((t) => [t.id, rows.filter((r) => r.term_id === t.id).map((r) => ({ gradeCode: gradeCode.get(r.grade_id)!, feeItemId: r.fee_item_id, day: Number(r.day_cents), boarder: Number(r.boarder_cents) }))])),
    invoices: invoices.map((i) => ({ id: i.id, number: i.number, campusId: i.campus_id, learnerId: i.learner_id, termId: i.term_id, idempotencyKey: `${i.learner_id}:${i.term_id}`, total: Number(i.total_cents), lines: [] })),
    lines: openLines,
    ledger: ledger.map((e) => ({ id: e.id, learnerId: e.learner_id, termKey: termKey.get(e.term_id)!, at: iso(e.created_at), kind: e.kind, description: e.description, amount: Number(e.amount_cents), ref: e.ref ?? undefined })),
    payments: payments.map((p) => {
      const a = (allocByPayment.get(p.id) ?? []).filter((x) => !x.reversal_of);
      const per = new Map<string, number>();
      for (const x of a) per.set(x.learner_id, (per.get(x.learner_id) ?? 0) + Number(x.amount_cents));
      const allocated = [...per.values()].reduce((s, v) => s + v, 0);
      if (p.receipt_no) {
        const m = String(p.receipt_no).match(/^RCT-([A-Z]+)-(\d+)-(\d+)$/);
        if (m) receiptSeq[`${m[1]}-${m[2]}`] = Math.max(receiptSeq[`${m[1]}-${m[2]}`] ?? 0, Number(m[3]));
      }
      return {
        id: p.id, providerRef: p.provider_ref, campusId: p.campus_id, amount: Number(p.amount_cents), billRef: p.bill_ref, phoneLast3: p.msisdn_last3, phoneHash: p.msisdn_hash, payerName: p.payer_name, paidAt: iso(p.paid_at), channel: p.channel,
        matchStatus: p.match_status, matchKind: p.match_kind ?? "—", confidence: p.confidence, familyId: p.matched_family_id, learnerId: p.matched_learner_id, rule: p.rule_used,
        split: [...per.entries()].map(([learnerId, amount]) => ({ learnerId, name: learnerFirst.get(learnerId) ?? "", amount })),
        credit: p.matched_family_id && p.match_status !== "reversed" ? Number(p.amount_cents) - allocated : 0,
        receiptNo: p.receipt_no, verifyCode: p.verify_code, termId: termFor(iso(p.paid_at)),
        suggestions: p.suggestions ?? [], bookRef: p.book_ref ?? undefined, receivedBy: p.book_ref ? "Front office" : undefined, banked: p.book_ref ? Boolean(p.banked_deposit_id) : undefined,
      } satisfies Payment;
    }),
    payerLinks: links.map((l) => ({ phoneHash: l.phone_hash, familyId: l.family_id, source: l.source })),
    plans: plans.map((p) => ({ id: p.id, familyId: p.family_id, termId: p.term_id, status: p.status, total: Number(p.total_cents), acceptedAt: iso(p.accepted_at), instalments: instalments.filter((i) => i.plan_id === p.id).map((i) => ({ n: i.n, dueDate: day(i.due_on), amount: Number(i.amount_cents), paid: Number(i.paid_cents) })) })),
    notices: [],
    events: [],
    inbox: [],
    duplicatesIgnored: 0,
    receiptSeq,
    sponsor: sponsor ? { id: sponsor.id, name: sponsor.name } : { id: "", name: "" },
  };
  if (school.org.isDemo) seedCommunication(school); // fictional notices and events for the demo only
  return school;
}
