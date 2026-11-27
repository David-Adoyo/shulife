import { randomUUID } from "node:crypto";
import type pg from "pg";
import { buildInvoice, gradeLevel, gradeName, hashMsisdn, invoiceNumber, KENYA_GRADES, priorityFor, type ImportRow } from "@shulife/core";
import { SALT, type School } from "@shulife/demo";
import { uid } from "./store";

/**
 * Setting up a real school, one step at a time. Every function writes in one transaction
 * and marks its step done in organisations.setup. Ids are real UUIDs (never demo ids).
 */
type Db = pg.PoolClient | pg.Client;
export type SetupStep = "details" | "classes" | "fees" | "learners" | "invoices" | "payments";
export const SETUP_STEPS: SetupStep[] = ["details", "classes", "fees", "learners", "invoices", "payments"];

async function tx<T>(db: Db, fn: () => Promise<T>): Promise<T> {
  await db.query("begin");
  try {
    const r = await fn();
    await db.query("commit");
    return r;
  } catch (e) {
    await db.query("rollback");
    throw e;
  }
}
const mark = (db: Db, org: string, step: SetupStep) => db.query(`update organisations set setup = setup || jsonb_build_object($2::text, true) where id = $1`, [org, step]);
const audit = (db: Db, org: string, actor: string, action: string, detail: unknown) =>
  db.query(`insert into audit_log (org_id, actor, action, entity, entity_id, detail) values ($1, $2, $3, 'organisations', $4, $5)`, [org, actor, action, org, JSON.stringify(detail)]);

/* ---------- 1. School details and campuses ---------- */

export type CampusInput = { name: string; code: string; paybill: string };
export type DetailsInput = { name: string; county: string; phone: string; familyPrefix: string; campuses: CampusInput[] };

export async function saveDetails(db: Db, org: string, actor: string, d: DetailsInput) {
  return tx(db, async () => {
    await db.query(`update organisations set name = $2, family_code_prefix = $3 where id = $1`, [org, d.name, d.familyPrefix]);
    for (const c of d.campuses) {
      const r = await db.query(
        `insert into campuses (org_id, name, code, phone, county, paybill_display, created_by) values ($1,$2,$3,$4,$5,$6,$7)
         on conflict (org_id, code) do update set name = excluded.name, phone = excluded.phone, county = excluded.county, paybill_display = excluded.paybill_display
         returning id`,
        [org, c.name, c.code, d.phone, d.county, c.paybill || null, actor],
      );
      const campusId = r.rows[0].id;
      if (c.paybill) {
        await db.query(
          `insert into payment_integrations (org_id, campus_id, provider, shortcode, environment, created_by) values ($1,$2,'mpesa_paybill',$3,'production',$4)
           on conflict (campus_id, provider) do update set shortcode = excluded.shortcode`,
          [org, campusId, c.paybill, actor],
        );
      }
    }
    await mark(db, org, "details");
    await audit(db, org, actor, "setup.details", { name: d.name, campuses: d.campuses.map((c) => c.code) });
  });
}

/* ---------- 2. Classes and the current term ---------- */

export type ClassesInput = { grades: string[]; streams: string[]; term: { year: number; number: number; opens: string; closes: string; due: string } };

export async function saveClasses(db: Db, org: string, actor: string, d: ClassesInput) {
  const grades = KENYA_GRADES.filter((g) => d.grades.includes(g));
  if (!grades.length) throw new Error("Choose at least one grade");
  const streams = d.streams.length ? d.streams : ["A"];
  return tx(db, async () => {
    const campuses = (await db.query(`select id from campuses where org_id = $1`, [org])).rows.map((r) => r.id as string);
    if (!campuses.length) throw new Error("Add a campus first");
    for (const [i, g] of grades.entries()) {
      const gr = await db.query(
        `insert into grades (org_id, code, display_name, sort_order, level) values ($1,$2,$3,$4,$5)
         on conflict (org_id, code) do update set sort_order = excluded.sort_order returning id`,
        [org, g, gradeName(g), i, gradeLevel(g)],
      );
      for (const campus of campuses)
        for (const name of streams)
          await db.query(`insert into streams (org_id, campus_id, grade_id, name, created_by) values ($1,$2,$3,$4,$5) on conflict (campus_id, grade_id, name) where archived_at is null do nothing`, [org, campus, gr.rows[0].id, name, actor]);
    }
    const t = d.term;
    let year = (await db.query(`select id from academic_years where org_id = $1 and name = $2`, [org, String(t.year)])).rows[0]?.id;
    if (!year) year = (await db.query(`insert into academic_years (org_id, name, starts_on, ends_on, created_by) values ($1,$2,$3,$4,$5) returning id`, [org, String(t.year), `${t.year}-01-01`, `${t.year}-12-31`, actor])).rows[0].id;
    const name = `Term ${t.number} ${t.year}`;
    const existing = (await db.query(`select id from terms where org_id = $1 and academic_year_id = $2 and number = $3`, [org, year, t.number])).rows[0]?.id;
    if (existing) await db.query(`update terms set opens_on = $2, closes_on = $3, fee_due_on = $4, status = 'open' where id = $1`, [existing, t.opens, t.closes, t.due]);
    else await db.query(`insert into terms (org_id, academic_year_id, name, number, opens_on, closes_on, fee_due_on, status, created_by) values ($1,$2,$3,$4,$5,$6,$7,'open',$8)`, [org, year, name, t.number, t.opens, t.closes, t.due, actor]);
    await mark(db, org, "classes");
    await audit(db, org, actor, "setup.classes", { grades, streams, term: name });
  });
}

/* ---------- 3. Fees ---------- */

export type FeeItemInput = { code: string; name: string; kind: "mandatory" | "optional"; perGrade: Record<string, { day: number; boarder: number }> };
export type FeesInput = { items: FeeItemInput[]; routes: { name: string; amount: number }[]; allocationRule: string; clearancePct: number };

/** Priority for paying off fee items: balances brought forward first, then the usual order. */
const priority = (code: string) => (code === "arrears" ? 1 : code === "activity" ? 50 : code === "exam" ? 60 : priorityFor(code));

export async function openTermId(db: Db, org: string): Promise<string> {
  const t = (await db.query(`select id from terms where org_id = $1 and status = 'open' order by opens_on desc limit 1`, [org])).rows[0]?.id;
  if (!t) throw new Error("Set the term dates first");
  return t;
}

export async function saveFees(db: Db, org: string, actor: string, d: FeesInput) {
  return tx(db, async () => {
    const term = await openTermId(db, org);
    const campuses = (await db.query(`select id from campuses where org_id = $1 order by created_at`, [org])).rows.map((r) => r.id as string);
    const structure = await db.query(`select id, status from fee_structures where campus_id = $1 and term_id = $2`, [campuses[0], term]);
    if (structure.rows[0]?.status === "published") throw new Error("This term’s fees are already invoiced. Changes need a new fee structure version.");
    const sid = structure.rows[0]?.id ?? (await db.query(`insert into fee_structures (org_id, campus_id, term_id, status, created_by) values ($1,$2,$3,'draft',$4) returning id`, [org, campuses[0], term, actor])).rows[0].id;
    const grades = new Map((await db.query(`select id, code from grades where org_id = $1`, [org])).rows.map((r) => [r.code as string, r.id as string]));
    const items = [...d.items];
    if (d.routes.length && !items.some((i) => i.code === "transport")) items.push({ code: "transport", name: "Transport", kind: "optional", perGrade: {} });
    for (const item of items) {
      const f = await db.query(
        `insert into fee_items (org_id, code, name, kind, pro_rata, allocation_priority) values ($1,$2,$3,$4,$5,$6)
         on conflict (org_id, code) do update set name = excluded.name, kind = excluded.kind returning id`,
        [org, item.code, item.name, item.kind, item.code === "tuition", priority(item.code)],
      );
      for (const [g, amt] of Object.entries(item.perGrade)) {
        const gid = grades.get(g);
        if (!gid) continue;
        await db.query(
          `insert into fee_structure_rows (org_id, structure_id, grade_id, fee_item_id, day_cents, boarder_cents) values ($1,$2,$3,$4,$5,$6)
           on conflict (structure_id, grade_id, fee_item_id) do update set day_cents = excluded.day_cents, boarder_cents = excluded.boarder_cents`,
          [org, sid, gid, f.rows[0].id, amt.day, amt.boarder],
        );
      }
    }
    for (const r of d.routes)
      for (const campus of campuses) {
        const hit = await db.query(`update transport_routes set amount_cents = $3 where campus_id = $1 and name = $2 and archived_at is null returning id`, [campus, r.name, r.amount]);
        if (!hit.rowCount) await db.query(`insert into transport_routes (org_id, campus_id, name, amount_cents, created_by) values ($1,$2,$3,$4,$5)`, [org, campus, r.name, r.amount, actor]);
      }
    await db.query(`update organisations set allocation_rule = $2, clearance_pct = $3 where id = $1`, [org, d.allocationRule, d.clearancePct]);
    await mark(db, org, "fees");
    await audit(db, org, actor, "setup.fees", { items: items.map((i) => i.code), routes: d.routes.length });
  });
}

/* ---------- 4. Learners and families ---------- */

export type FamilyGroup = { code: string; displayName: string; learners: ImportRow[]; guardians: { name: string; phone: string | null }[] };

export async function importLearners(db: Db, org: string, actor: string, families: FamilyGroup[], campusId: string) {
  return tx(db, async () => {
    const term = await openTermId(db, org);
    const grades = new Map((await db.query(`select id, code from grades where org_id = $1`, [org])).rows.map((r) => [r.code as string, r.id as string]));
    const streams = (await db.query(`select s.id, s.name, g.code from streams s join grades g on g.id = s.grade_id where s.campus_id = $1 and s.archived_at is null order by s.name`, [campusId])).rows;
    const routes = (await db.query(`select id, name from transport_routes where campus_id = $1 and archived_at is null`, [campusId])).rows;
    const lunch = (await db.query(`select id from fee_items where org_id = $1 and code = 'lunch'`, [org])).rows[0]?.id ?? null;
    const taken = new Set((await db.query(`select admission_number from learners where campus_id = $1`, [campusId])).rows.map((r) => r.admission_number as string));
    let added = 0;
    let skipped = 0;
    for (const fam of families) {
      const fresh = fam.learners.filter((l) => !taken.has(l.admission));
      skipped += fam.learners.length - fresh.length;
      if (!fresh.length) continue;
      const f = await db.query(
        `insert into families (org_id, code, display_name, consent_whatsapp, created_by) values ($1,$2,$3,false,$4)
         on conflict (org_id, code) do update set display_name = families.display_name returning id`,
        [org, fam.code, fam.displayName, actor],
      );
      const familyId = f.rows[0].id as string;
      const guardianIds: string[] = [];
      for (const [i, g] of fam.guardians.entries()) {
        const phone = g.phone;
        const r = await db.query(
          `insert into guardians (org_id, family_id, name, phone_e164, phone_hash, phone_last3, is_primary_payer, created_by) values ($1,$2,$3,$4,$5,$6,$7,$8) returning id`,
          [org, familyId, g.name || "Parent", phone, phone ? hashMsisdn(phone, SALT) : null, phone ? phone.slice(-3) : null, i === 0, actor],
        );
        guardianIds.push(r.rows[0].id);
        if (phone) await db.query(`insert into payer_links (org_id, phone_hash, family_id, source) values ($1,$2,$3,'guardian_record') on conflict do nothing`, [org, hashMsisdn(phone, SALT), familyId]);
      }
      for (const l of fresh) {
        const gradeId = grades.get(l.gradeCode);
        if (!gradeId) throw new Error(`Row ${l.row}: ${gradeName(l.gradeCode)} isn’t one of this school’s grades. Add it in Classes first.`);
        const stream = streams.find((s) => s.code === l.gradeCode && s.name.toLowerCase() === l.stream.toLowerCase()) ?? streams.find((s) => s.code === l.gradeCode);
        const route = l.route ? routes.find((r) => r.name.toLowerCase() === l.route.toLowerCase()) : null;
        const r = await db.query(
          `insert into learners (org_id, campus_id, family_id, admission_number, first_name, last_name, other_names, boarding, opening_balance_cents, created_by) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id`,
          [org, campusId, familyId, l.admission, l.firstName, l.lastName || "", l.otherNames || null, l.boarding, l.openingBalance, actor],
        );
        const learnerId = r.rows[0].id;
        for (const gid of guardianIds) await db.query(`insert into learner_guardians (org_id, learner_id, guardian_id) values ($1,$2,$3)`, [org, learnerId, gid]);
        await db.query(`insert into enrolments (org_id, learner_id, term_id, grade_id, stream_id, boarding, route_id, created_by) values ($1,$2,$3,$4,$5,$6,$7,$8)`, [org, learnerId, term, gradeId, stream?.id ?? null, l.boarding, route?.id ?? null, actor]);
        if (l.lunch && lunch) await db.query(`insert into optional_subscriptions (org_id, learner_id, term_id, fee_item_id) values ($1,$2,$3,$4) on conflict do nothing`, [org, learnerId, term, lunch]);
        taken.add(l.admission);
        added++;
      }
    }
    await mark(db, org, "learners");
    await audit(db, org, actor, "setup.learners", { added, skipped });
    return { added, skipped };
  });
}

/* ---------- 5. Invoice the term ---------- */

/**
 * Invoice every active learner who has no invoice for the open term yet (safe to run
 * again), adding last term's balance as a "Balance brought forward" line. Uses the
 * loaded school model so the amounts match exactly what the app shows.
 */
export async function invoiceTerm(db: Db, s: School, actor: string) {
  const org = s.org.id;
  return tx(db, async () => {
    const term = s.terms.find((t) => t.status === "open");
    if (!term) throw new Error("Set the term dates first");
    const structure = (await db.query(`select id, status from fee_structures where term_id = $1`, [term.id])).rows[0];
    if (!structure) throw new Error("Enter the fee structure first");
    const rows = s.structures[term.id] ?? [];
    if (!rows.length) throw new Error("The fee structure has no amounts yet");
    let arrears = s.feeItems.find((f) => f.code === "arrears");
    if (!arrears) {
      const id = (await db.query(`insert into fee_items (org_id, code, name, kind, pro_rata, allocation_priority) values ($1,'arrears','Balance brought forward','mandatory',false,1) on conflict (org_id, code) do update set name = excluded.name returning id`, [org])).rows[0].id;
      arrears = { id, code: "arrears", name: "Balance brought forward", kind: "mandatory", proRata: false, priority: 1 };
    }
    const opening = new Map((await db.query(`select id, opening_balance_cents from learners where org_id = $1 and opening_balance_cents is not null`, [org])).rows.map((r) => [r.id as string, Number(r.opening_balance_cents)]));
    const invoiced = new Set((await db.query(`select learner_id from invoices where term_id = $1`, [term.id])).rows.map((r) => r.learner_id as string));
    const seq: Record<string, number> = {};
    for (const r of (await db.query(`select c.code, count(i.*)::int n from invoices i join campuses c on c.id = i.campus_id where i.term_id = $1 group by c.code`, [term.id])).rows) seq[r.code] = r.n;
    const lunch = s.feeItems.find((f) => f.code === "lunch");
    const items = s.feeItems.map((f) => ({ ...f }));
    const posted = new Date().toISOString();
    let count = 0;
    let total = 0;
    const credits = new Map<string, number>();

    const byFamily = new Map<string, typeof s.learners>();
    for (const l of s.learners.filter((x) => x.status === "active")) byFamily.set(l.familyId, [...(byFamily.get(l.familyId) ?? []), l]);
    for (const kids of byFamily.values()) {
      kids.sort((a, b) => a.admissionNumber.localeCompare(b.admissionNumber, undefined, { numeric: true }));
      for (const [rank, l] of kids.entries()) {
        if (invoiced.has(l.id)) continue;
        const campus = s.campuses.find((c) => c.id === l.campusId)!;
        const route = s.routes.find((r) => r.id === l.routeId) ?? null;
        const inv = buildInvoice({
          enrolment: { learnerId: l.id, termId: term.id, gradeCode: l.gradeCode, boarding: l.boarding, optionalItemIds: l.lunch && lunch ? [lunch.id] : [], route, siblingRank: rank + 1 },
          structure: { id: structure.id, termId: term.id, status: "approved", rows },
          feeItems: items,
          term: { opening: term.opening, closing: term.closing },
        });
        const bf = opening.get(l.id) ?? 0;
        if (bf > 0) inv.lines.unshift({ key: `charge:${arrears.id}`, kind: "charge", feeItemId: arrears.id, feeItemCode: "arrears", description: "Balance brought forward", amount: bf, optional: false });
        if (bf < 0) credits.set(l.familyId, (credits.get(l.familyId) ?? 0) - bf);
        inv.total = inv.lines.reduce((a, x) => a + x.amount, 0);
        if (!inv.lines.length) continue;
        seq[campus.code] = (seq[campus.code] ?? 0) + 1;
        const id = randomUUID();
        const number = invoiceNumber(campus.code, term.year, term.number, seq[campus.code]);
        await db.query(`insert into invoices (id, org_id, campus_id, learner_id, term_id, number, total_cents, created_by) values ($1,$2,$3,$4,$5,$6,$7,$8)`, [id, org, campus.id, l.id, term.id, number, inv.total, actor]);
        for (const line of inv.lines) {
          const lineId = line.kind === "charge" ? uid("line", `${id}:${line.feeItemCode}`) : uid("il", `${id}:${line.key}`);
          await db.query(`insert into invoice_lines (id, org_id, invoice_id, fee_item_id, kind, description, amount_cents, optional) values ($1,$2,$3,$4,$5,$6,$7,$8)`, [lineId, org, id, line.feeItemId, line.kind, line.description, line.amount, line.optional]);
          await db.query(
            `insert into ledger_entries (id, org_id, learner_id, term_id, kind, description, amount_cents, ref, created_at) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [uid("le", `${id}:${line.key}`), org, l.id, term.id, line.feeItemCode === "arrears" ? "brought_forward" : line.kind === "charge" ? "invoice_line" : "discount", line.description, line.amount, number, posted],
          );
        }
        count++;
        total += inv.total;
      }
    }
    for (const [familyId, credit] of credits) await db.query(`update families set credit_cents = credit_cents + $2 where id = $1`, [familyId, credit]);
    if (structure.status !== "published") await db.query(`update fee_structures set status = 'published', published_at = now() where id = $1`, [structure.id]);
    await mark(db, org, "invoices");
    await audit(db, org, actor, "setup.invoices", { invoices: count, total });
    return { count, total };
  });
}

/* ---------- 6. Payments and going live ---------- */

export async function paybillCallbacks(db: Db, org: string) {
  return (
    await db.query(
      `select c.id as campus_id, c.name, c.code, p.shortcode, p.callback_secret from campuses c
       left join payment_integrations p on p.campus_id = c.id and p.provider = 'mpesa_paybill' where c.org_id = $1 order by c.created_at`,
      [org],
    )
  ).rows as { campus_id: string; name: string; code: string; shortcode: string | null; callback_secret: string | null }[];
}

export async function goLive(db: Db, org: string, actor: string) {
  return tx(db, async () => {
    await db.query(`update organisations set live_at = coalesce(live_at, now()) where id = $1`, [org]);
    await mark(db, org, "payments");
    await audit(db, org, actor, "setup.live", {});
  });
}
