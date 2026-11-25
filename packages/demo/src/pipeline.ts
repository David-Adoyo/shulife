import { type LedgerEntry, allocatePayment, matchPayment, receiptNumber, verifyCode, type ChildBalance, type MatchFamily, type MatchLearner } from "@shulife/core";
import type { Family, Guardian, Learner, OpenLine, Payment, School } from "./types";

/**
 * The same pipeline production runs (§5.2): ingest → match → allocate → ledger → receipt.
 * Unmatched or uncertain payments wait in the review queue.
 */

type Index = { size: number; linesByFamily: Map<string, OpenLine[]>; linesByLearner: Map<string, OpenLine[]>; guardiansByFamily: Map<string, Guardian[]>; family: Map<string, Family> };
const indexes = new WeakMap<School, Index>();
/** Lookup tables, rebuilt only when lines, guardians or families are added. */
export function index(s: School): Index {
  const size = s.lines.size * 1e6 + s.guardians.length * 1e3 + s.families.length;
  let ix = indexes.get(s);
  if (ix && ix.size === size) return ix;
  ix = { size, linesByFamily: new Map(), linesByLearner: new Map(), guardiansByFamily: new Map(), family: new Map(s.families.map((f) => [f.id, f])) };
  for (const l of s.lines.values()) {
    const fam = learnerById(s, l.learnerId)!.familyId;
    ix.linesByFamily.set(fam, [...(ix.linesByFamily.get(fam) ?? []), l]);
    ix.linesByLearner.set(l.learnerId, [...(ix.linesByLearner.get(l.learnerId) ?? []), l]);
  }
  for (const g of s.guardians) ix.guardiansByFamily.set(g.familyId, [...(ix.guardiansByFamily.get(g.familyId) ?? []), g]);
  indexes.set(s, ix);
  return ix;
}

export function familyBalance(s: School, familyId: string): number {
  const ix = index(s);
  let total = 0;
  for (const l of ix.linesByFamily.get(familyId) ?? []) total += l.outstanding;
  return total - (ix.family.get(familyId)?.credit ?? 0);
}

const learnerCache = new WeakMap<School, Map<string, Learner>>();
export function learnerById(s: School, id: string): Learner | undefined {
  let m = learnerCache.get(s);
  if (!m || m.size !== s.learners.length) {
    m = new Map(s.learners.map((l) => [l.id, l]));
    learnerCache.set(s, m);
  }
  return m.get(id);
}

export function directory(s: School) {
  const learners: MatchLearner[] = s.learners.map((l) => ({ id: l.id, familyId: l.familyId, admissionNumber: l.admissionNumber, firstName: l.firstName, lastName: l.lastName, gradeCode: l.gradeCode, status: l.status }));
  const families: MatchFamily[] = s.families.map((f) => ({
    id: f.id,
    code: f.code.replace(/^\D+-?/, ""),
    guardianNames: (index(s).guardiansByFamily.get(f.id) ?? []).map((g) => g.name),
    guardianPhoneHashes: (index(s).guardiansByFamily.get(f.id) ?? []).map((g) => g.phoneHash),
    balance: Math.max(0, familyBalance(s, f.id)),
    instalmentAmounts: s.plans.filter((p) => p.familyId === f.id && p.status === "active").flatMap((p) => p.instalments.map((i) => i.amount)),
  }));
  return { learners, families, payerLinks: s.payerLinks.filter((p) => p.source === "learned") };
}

export function childBalances(s: School, familyId: string): ChildBalance[] {
  return s.learners
    .filter((l) => l.familyId === familyId)
    .map((l) => ({
      learnerId: l.id,
      name: l.firstName,
      ageKey: l.ageKey,
      lines: (index(s).linesByLearner.get(l.id) ?? []).filter((x) => x.outstanding > 0).map((x) => ({ lineId: x.lineId, feeItemId: x.feeItemId, feeItemName: x.feeItemName, priority: x.priority, termKey: x.termKey, outstanding: x.outstanding })),
    }));
}

/** Apply a matched payment: allocate between siblings, post ledger credits, number a receipt. */
export function applyPayment(s: School, p: Payment, familyId: string, learnerId: string | null, kind: Payment["matchKind"]) {
  const term = s.terms.find((t) => t.id === p.termId)!;
  const fam = s.families.find((f) => f.id === familyId)!;
  const alloc = allocatePayment({ amount: p.amount, rule: s.org.allocationRule, children: childBalances(s, familyId), matchedLearnerId: learnerId });
  const posted: { ref?: string }[] = [];
  for (const line of alloc.lines) {
    const open = s.lines.get(line.lineId)!;
    open.outstanding -= line.amount;
    const entry = { id: `${p.id}:${line.lineId}`, learnerId: line.learnerId, termKey: term.key, at: p.paidAt, kind: "allocation", description: open.termKey === term.key ? `Payment — ${open.feeItemName}` : `Payment — ${open.feeItemName} (${open.termKey.replace(/(\d+)-(\d)/, "Term $2 $1")})`, amount: -line.amount, ref: undefined as string | undefined } satisfies LedgerEntry;
    s.ledger.push(entry);
    posted.push(entry);
  }
  if (alloc.credit > 0) fam.credit += alloc.credit;
  const campus = s.campuses.find((c) => c.id === p.campusId)!;
  const year = Number(p.paidAt.slice(0, 4));
  const key = `${campus.code}-${year}`;
  s.receiptSeq[key] = (s.receiptSeq[key] ?? 0) + 1;
  p.receiptNo = receiptNumber(campus.code, year, s.receiptSeq[key]);
  p.verifyCode = verifyCode();
  for (const e of posted) e.ref = p.receiptNo;
  p.familyId = familyId;
  p.learnerId = learnerId;
  p.rule = alloc.rule;
  p.split = alloc.perLearner.filter((x) => x.amount > 0);
  p.credit = alloc.credit;
  p.matchStatus = kind === "Reviewed" || kind === "Manual" ? "manual" : "auto";
  p.matchKind = kind;
  return alloc;
}

export function ingest(s: School, p: Payment, opts: { manualFamilyId?: string } = {}) {
  if (s.payments.some((x) => x.providerRef === p.providerRef)) {
    s.duplicatesIgnored++;
    return "duplicate" as const;
  }
  s.payments.push(p);
  if (opts.manualFamilyId) {
    applyPayment(s, p, opts.manualFamilyId, null, "Manual");
    return "manual" as const;
  }
  const r = matchPayment({ billRef: p.billRef, phoneHash: p.phoneHash, payerName: p.payerName, amount: p.amount }, directory(s), { autoThreshold: 90, minMargin: 15, familyPrefix: s.org.familyPrefix });
  p.suggestions = r.suggestions;
  p.confidence = r.best?.score ?? null;
  if (r.decision === "auto" && r.best) {
    const top = r.best.signals[0]?.kind;
    applyPayment(s, p, r.best.familyId, r.best.learnerId, top === "guardian_phone" ? "Guardian phone" : top === "learned_phone" ? "Learned" : "Auto");
    return "auto" as const;
  }
  p.matchStatus = r.decision === "unmatched" ? "unmatched" : "suggested";
  return "review" as const;
}

/** The bursar resolves a review card: assign to a family (and learn the phone), or mark not ours. */
export function resolveReview(s: School, paymentId: string, action: { familyId: string } | { notOurs: true }) {
  const p = s.payments.find((x) => x.id === paymentId);
  if (!p || (p.matchStatus !== "suggested" && p.matchStatus !== "unmatched")) throw new Error("Not in the review queue");
  if ("notOurs" in action) {
    p.matchStatus = "not_ours";
    p.matchKind = "—";
    return p;
  }
  const suggestion = p.suggestions.find((x) => x.familyId === action.familyId);
  applyPayment(s, p, action.familyId, suggestion?.learnerId ?? null, "Reviewed");
  // Learning: the payer's phone now points at this family (§7.3).
  if (p.phoneHash && !s.payerLinks.some((l) => l.phoneHash === p.phoneHash && l.familyId === action.familyId)) s.payerLinks.push({ phoneHash: p.phoneHash, familyId: action.familyId, source: "learned" });
  return p;
}

export function reviewQueue(s: School) {
  return s.payments.filter((p) => p.matchStatus === "suggested" || p.matchStatus === "unmatched").sort((a, b) => b.paidAt.localeCompare(a.paidAt));
}

/** Family credit is applied automatically to new charges (§7.4), with its own ledger line. */
export function applyCredit(s: School, familyId: string, at: string, termKey: string) {
  const fam = s.families.find((f) => f.id === familyId)!;
  if (fam.credit <= 0) return 0;
  const owed = childBalances(s, familyId).reduce((a, c) => a + c.lines.reduce((x, l) => x + l.outstanding, 0), 0);
  const use = Math.min(fam.credit, owed);
  if (use <= 0) return 0;
  const alloc = allocatePayment({ amount: use, rule: s.org.allocationRule, children: childBalances(s, familyId) });
  for (const line of alloc.lines) {
    const open = s.lines.get(line.lineId)!;
    open.outstanding -= line.amount;
    s.ledger.push({ id: `credit:${familyId}:${termKey}:${line.lineId}`, learnerId: line.learnerId, termKey, at, kind: "credit_applied", description: `Credit applied — ${open.feeItemName}`, amount: -line.amount });
  }
  fam.credit -= use;
  return use;
}
