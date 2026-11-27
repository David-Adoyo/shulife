"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { KENYA_GRADES, groupFamilies, mapColumns, parseCsv, validateImport } from "@shulife/core";
import { goLive, importLearners, invoiceTerm, saveClasses, saveDetails, saveFees, type FeeItemInput } from "@shulife/db";
import { invalidate, school, withDb } from "@/lib/db";
import { setupContext } from "./context";
import { FEE_COLUMNS } from "./fees";

const text = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const cents = (v: string) => Math.max(0, Math.round(Number(v.replace(/[^\d.]/g, "") || 0) * 100));
const fail = (step: string, message: string): never => redirect(`/setup/?step=${step}&error=${encodeURIComponent(message)}`);

/** Save a step; on success go to `next` (a query string built from the step's result). */
async function run<T>(step: string, fn: (ctx: Awaited<ReturnType<typeof setupContext>>) => Promise<T>, next: (result: T) => string) {
  const ctx = await setupContext();
  let result: T;
  try {
    result = await fn(ctx);
  } catch (e) {
    const msg = (e as { code?: string; message: string }).code === "23505" ? "Something with that name or number already exists." : (e as Error).message;
    return fail(step, msg);
  }
  invalidate(ctx.org);
  revalidatePath("/", "layout");
  redirect(`/setup/?${next(result)}`);
}

/* 1. School details */
export async function saveDetailsAction(f: FormData) {
  const name = text(f, "name");
  const prefix = text(f, "prefix").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5) || "FAM";
  const campuses = [0, 1, 2]
    .map((i) => ({ name: text(f, `campus_name_${i}`), code: text(f, `campus_code_${i}`).toUpperCase().replace(/[^A-Z]/g, ""), paybill: text(f, `campus_paybill_${i}`).replace(/\D/g, "") }))
    .filter((c) => c.name || c.code);
  if (name.length < 3) fail("details", "Enter the school’s name.");
  if (!campuses.length) fail("details", "Add at least one campus.");
  for (const c of campuses) {
    if (!/^[A-Z]{3,4}$/.test(c.code)) fail("details", `Campus code “${c.code}” must be 3 or 4 letters, e.g. MAIN or RUI.`);
    if (c.paybill && !/^\d{5,7}$/.test(c.paybill)) fail("details", `“${c.paybill}” doesn’t look like a Paybill or Till number.`);
  }
  await run("details", ({ org, actor }) => withDb((c) => saveDetails(c, org, actor, { name, county: text(f, "county"), phone: text(f, "phone"), familyPrefix: prefix, campuses })), () => "step=classes");
}

/* 2. Classes and term */
export async function saveClassesAction(f: FormData) {
  const grades = f.getAll("grade").map(String).filter((g) => (KENYA_GRADES as readonly string[]).includes(g));
  const streams = text(f, "streams").split(/[,\n]/).map((x) => x.trim()).filter(Boolean).slice(0, 8);
  const year = Number(text(f, "year"));
  const number = Number(text(f, "number"));
  const opens = text(f, "opens");
  const closes = text(f, "closes");
  const due = text(f, "due") || opens;
  if (!grades.length) fail("classes", "Tick the grades your school teaches.");
  if (!(year >= 2024 && year <= 2040) || ![1, 2, 3].includes(number)) fail("classes", "Choose the year and term number.");
  if (!opens || !closes || closes <= opens) fail("classes", "The term must close after it opens.");
  await run("classes", ({ org, actor }) => withDb((c) => saveClasses(c, org, actor, { grades, streams, term: { year, number, opens, closes, due } })), () => "step=fees");
}

/* 3. Fees */
export async function saveFeesAction(f: FormData) {
  const ctx = await setupContext();
  const items: FeeItemInput[] = [];
  for (const col of FEE_COLUMNS) {
    const perGrade: FeeItemInput["perGrade"] = {};
    for (const g of ctx.s.grades) {
      const v = cents(text(f, `fee:${col.code}:${g}`));
      if (v > 0) perGrade[g] = { day: v, boarder: v };
    }
    if (Object.keys(perGrade).length) items.push({ code: col.code, name: col.name, kind: col.kind, perGrade });
  }
  const routes = [0, 1, 2, 3, 4, 5].map((i) => ({ name: text(f, `route_name_${i}`), amount: cents(text(f, `route_amount_${i}`)) })).filter((r) => r.name && r.amount > 0);
  const rule = text(f, "rule");
  const clearance = Math.min(100, Math.max(0, Number(text(f, "clearance")) || 70));
  if (!items.some((i) => i.code === "tuition")) fail("fees", "Enter the tuition fee for at least one grade.");
  if (!["oldest_balance", "proportional", "eldest_first", "youngest_first", "exact_number"].includes(rule)) fail("fees", "Choose how family payments are shared.");
  await run("fees", ({ org, actor }) => withDb((c) => saveFees(c, org, actor, { items, routes, allocationRule: rule, clearancePct: clearance })), () => "step=learners");
}

/* 4. Learners */
export async function importLearnersAction(f: FormData) {
  const ctx = await setupContext();
  const file = f.get("file");
  const csv = file instanceof File && file.size ? await file.text() : text(f, "csv");
  const rows = parseCsv(csv);
  if (rows.length < 2) fail("learners", "Add a header row and at least one learner.");
  const { rows: good, issues } = validateImport(rows.slice(1), mapColumns(rows[0]));
  const errors = issues.filter((i) => i.severity === "error");
  if (errors.length) fail("learners", `${errors.length} rows need fixing first, e.g. row ${errors[0].row}: ${errors[0].message}`);
  const campusId = text(f, "campus") || ctx.s.campuses[0]?.id;
  if (!campusId) fail("learners", "Add a campus first.");
  const families = groupFamilies(good, ctx.s.org.familyPrefix);
  await run("learners", ({ org, actor }) => withDb((c) => importLearners(c, org, actor, families, campusId)), (r) => `step=learners&added=${r?.added ?? 0}&skipped=${r?.skipped ?? 0}`);
}

/* 5. Invoices */
export async function invoiceTermAction() {
  await run(
    "invoices",
    async ({ org, actor }) => {
      const s = await school(org);
      return withDb((c) => invoiceTerm(c, s, actor));
    },
    (r) => `step=invoices&invoiced=${r?.count ?? 0}&total=${r?.total ?? 0}`,
  );
}

/* 6. Go live */
export async function goLiveAction() {
  await run("payments", ({ org, actor }) => withDb((c) => goLive(c, org, actor)), () => "step=done");
}
