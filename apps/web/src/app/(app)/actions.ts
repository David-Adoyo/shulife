"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { kes, resolveAudience, checkTone } from "@shulife/core";
import { getSchool, ingest, resetSchool, resolveReview, type Payment } from "@shulife/demo";
import { can, getSession, ROLES, type Role } from "@/lib/session";
import { serial, withDb } from "@/lib/db";
import { persistIngest, persistResolution } from "@shulife/db";

export async function setRole(formData: FormData) {
  const role = String(formData.get("role")) as Role;
  if (!ROLES.some((r) => r.id === role)) return;
  (await cookies()).set("demo_role", role, { path: "/", sameSite: "lax" });
  redirect(role === "class_teacher" ? "/app/clearance/" : "/app/");
}

export async function setCampus(formData: FormData) {
  (await cookies()).set("demo_campus", String(formData.get("campus") ?? "all"), { path: "/", sameSite: "lax" });
  revalidatePath("/app", "layout");
}

export async function resolveCard(formData: FormData) {
  const session = await getSession();
  if (!can.review(session.role)) throw new Error("Not allowed");
  const id = String(formData.get("paymentId"));
  const family = formData.get("familyId");
  await serial(async () => {
    const s = getSchool();
    const n = s.ledger.length;
    const p = resolveReview(s, id, family ? { familyId: String(family) } : { notOurs: true });
    const entries = s.ledger.slice(n);
    await withDb((c) => persistResolution(c, s, p, entries));
  });
  revalidatePath("/app", "layout");
}

export async function recordManualReceipt(formData: FormData) {
  const session = await getSession();
  if (!can.manualReceipt(session.role)) throw new Error("Not allowed");
  const s = getSchool();
  const familyId = String(formData.get("familyId"));
  const amount = kes(String(formData.get("amount") ?? "0"));
  const channel = String(formData.get("channel")) as "cash" | "cheque" | "bank_slip";
  const bookRef = String(formData.get("bookRef") ?? "").trim();
  if (!bookRef || amount <= 0) throw new Error("Enter an amount and the receipt-book number");
  const fam = s.families.find((f) => f.id === familyId)!;
  const term = s.terms.find((t) => t.status === "open")!;
  const p: Payment = { id: crypto.randomUUID(), providerRef: `${channel.toUpperCase()}-${crypto.randomUUID().slice(0, 13)}`, campusId: fam.campusId, amount, billRef: null, phoneLast3: null, phoneHash: null, payerName: null, paidAt: process.env.SHULIFE_TODAY === "now" ? new Date().toISOString() : s.today, channel, matchStatus: "unmatched", matchKind: "—", confidence: null, familyId: null, learnerId: null, rule: null, split: [], credit: 0, receiptNo: null, verifyCode: null, termId: term.id, suggestions: [], bookRef, receivedBy: session.name, banked: false };
  await serial(async () => {
    const n = s.ledger.length;
    ingest(s, p, { manualFamilyId: familyId });
    const entries = s.ledger.slice(n);
    await withDb((c) => persistIngest(c, s, p, entries));
  });
  revalidatePath("/app", "layout");
  redirect(`/app/families/${familyId}/?receipt=${p.receiptNo}`);
}

export async function previewAudience(_: unknown, formData: FormData) {
  const s = getSchool();
  const kind = String(formData.get("kind"));
  const value = String(formData.get("value") ?? "");
  const body = String(formData.get("body") ?? "");
  const learners = s.learners.map((l) => ({ id: l.id, campusId: l.campusId, gradeCode: l.gradeCode, streamId: l.streamId, routeId: l.routeId, boarding: l.boarding, status: l.status, guardianIds: s.guardians.filter((g) => g.familyId === l.familyId).map((g) => g.id) }));
  const guardians = s.guardians.map((g) => ({ id: g.id, receivesNotices: true }));
  const audience =
    kind === "grade" ? { kind: "grade" as const, gradeCodes: [value] } : kind === "stream" ? { kind: "stream" as const, streamIds: [value] } : kind === "route" ? { kind: "route" as const, routeIds: [value] } : kind === "boarding" ? { kind: "boarding" as const, value: value as "day" | "boarder" } : { kind: "whole_school" as const };
  const ids = resolveAudience([audience], learners, guardians);
  return { count: ids.length, whatsapp: s.guardians.filter((g) => ids.includes(g.id) && g.whatsapp).length, tone: checkTone(body) };
}

export async function resetDemo() {
  resetSchool();
  revalidatePath("/", "layout");
  redirect("/app/");
}

export async function checkImport(_: unknown, formData: FormData) {
  const { parseCsv, mapColumns, validateImport, groupFamilies } = await import("@shulife/core");
  const file = formData.get("file");
  const text = file instanceof File && file.size ? await file.text() : String(formData.get("csv") ?? "");
  const rows = parseCsv(text);
  if (rows.length < 2) return { error: "Add a header row and at least one learner." };
  const map = mapColumns(rows[0]);
  const { rows: good, issues } = validateImport(rows.slice(1), map);
  const families = groupFamilies(good);
  return {
    error: null,
    total: rows.length - 1,
    ok: good.length,
    issues: issues.slice(0, 50),
    families: families.slice(0, 20).map((f) => ({ code: f.code, name: f.displayName, learners: f.learners.map((l) => `${l.firstName} ${l.lastName} (${l.gradeCode})`), needsConfirmation: f.needsConfirmation })),
    familyCount: families.length,
    mapped: Object.keys(map),
  };
}
