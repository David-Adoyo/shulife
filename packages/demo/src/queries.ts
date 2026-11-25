import { buildStatement, clearanceBoard, diffStructures, evaluateClearance, formatKes, gradeName, isoDateNairobi, maskMsisdn, planReminders, projectCash, readReceiptStats, type ClearanceInput } from "@shulife/core";
import { familyBalance, learnerById, reviewQueue } from "./pipeline";
import type { Payment, School } from "./types";

/* Read models for the school app, parent portal and admin console. */

export const currentTerm = (s: School) => s.terms.find((t) => t.status === "open")!;
const inCampus = (s: School, campusId?: string | null) => (l: { campusId: string }) => !campusId || l.campusId === campusId;

/** Billed and collected for this term per learner (allocations against this term's lines). */
export function termPosition(s: School, learnerId: string, termKey = currentTerm(s).key) {
  let billed = 0;
  let outstanding = 0;
  for (const l of s.lines.values()) {
    if (l.learnerId !== learnerId || l.termKey !== termKey) continue;
    billed += l.amount;
    outstanding += l.outstanding;
  }
  let arrears = 0;
  for (const l of s.lines.values()) if (l.learnerId === learnerId && l.termKey < termKey) arrears += l.outstanding;
  return { billed, paid: billed - outstanding, outstanding, arrears, balance: outstanding + arrears };
}

export function dashboard(s: School, campusId?: string | null) {
  const term = currentTerm(s);
  const learners = s.learners.filter(inCampus(s, campusId)).filter((l) => l.status === "active");
  let billed = 0;
  let collected = 0;
  let outstanding = 0;
  for (const l of learners) {
    const p = termPosition(s, l.id);
    billed += p.billed;
    collected += p.paid;
    outstanding += p.balance;
  }
  const todayIso = isoDateNairobi(new Date(s.today));
  const payments = s.payments.filter((p) => p.termId === term.id && (!campusId || p.campusId === campusId));
  const live = payments.filter((p) => p.matchStatus !== "not_ours" && p.matchStatus !== "reversed");
  const electronic = live.filter((p) => p.channel === "c2b" || p.channel === "bank_import" || p.channel === "stk");
  const auto = electronic.filter((p) => p.matchStatus === "auto").length;
  const today = live.filter((p) => isoDateNairobi(new Date(p.paidAt)) === todayIso && p.familyId);

  // Class heatmap: grade × stream, % of this term's fees collected.
  const heat = s.grades.map((g) => ({
    gradeCode: g,
    gradeName: gradeName(g),
    streams: s.streams
      .filter((st) => st.gradeCode === g && (!campusId || st.campusId === campusId))
      .map((st) => {
        const ls = learners.filter((l) => l.streamId === st.id);
        let b = 0;
        let c = 0;
        for (const l of ls) {
          const p = termPosition(s, l.id);
          b += p.billed;
          c += p.paid;
        }
        const clearance = ls.filter((l) => evaluateClearance(clearanceInput(s, l.id), { thresholdPct: s.org.clearancePct }, todayIso) !== "not_cleared").length;
        return { streamId: st.id, name: st.name, campusId: st.campusId, learners: ls.length, pct: b ? Math.round((c / b) * 100) : 0, cleared: clearance };
      }),
  }));

  const plans = s.plans.filter((p) => p.status === "active");
  const onPlans = plans.reduce((sum, p) => sum + p.instalments.reduce((a, i) => a + (i.amount - i.paid), 0), 0);

  // Projection from last term's payment curve.
  const prev = s.terms.find((t) => t.status === "closed")!;
  const prevOpen = Date.parse(prev.opening);
  const weeks: number[] = Array(10).fill(0);
  let prevBilled = 0;
  for (const l of s.lines.values()) if (l.termKey === prev.key) prevBilled += l.amount;
  for (const p of s.payments.filter((x) => x.termId === prev.id && x.familyId)) {
    const w = Math.max(0, Math.floor((Date.parse(p.paidAt) - prevOpen) / (7 * 86_400_000)));
    if (w < weeks.length) weeks[w] += p.amount;
  }
  const projection = projectCash({
    asOf: todayIso,
    days: 30,
    termOpening: term.opening,
    outstanding: Math.max(0, outstanding - onPlans),
    instalments: plans.flatMap((p) => p.instalments.filter((i) => i.paid < i.amount).map((i) => ({ dueDate: i.dueDate, amount: i.amount - i.paid }))),
    ratiba: [],
    history: [{ billed: prevBilled, collectedByWeek: weeks }],
  });

  const queue = reviewQueue(s).filter((p) => !campusId || p.campusId === campusId);
  const unbanked = payments.filter((p) => (p.channel === "cash" || p.channel === "cheque") && !p.banked);
  return {
    term,
    billed,
    collected,
    outstanding,
    pct: billed ? Math.round((collected / billed) * 100) : 0,
    collectedToday: today.reduce((a, p) => a + p.amount, 0),
    paymentsToday: today.length,
    onPlans,
    planCount: plans.length,
    autoMatchRate: electronic.length ? Math.round((auto / electronic.length) * 100) : 0,
    heat,
    feed: live.filter((p) => p.familyId).sort((a, b) => b.paidAt.localeCompare(a.paidAt)).slice(0, 8).map((p) => feedItem(s, p)),
    projection,
    attention: {
      review: queue.length,
      unbanked: unbanked.length,
      unbankedAmount: unbanked.reduce((a, p) => a + p.amount, 0),
      changeRequests: 2,
      unreadMessages: s.inbox.filter((i) => i.status === "open").length,
      nextEvent: s.events.find((e) => e.date >= todayIso) ?? null,
    },
    topBalances: s.families
      .filter((f) => !campusId || f.campusId === campusId)
      .map((f) => ({ family: f, balance: familyBalance(s, f.id) }))
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 5),
    duplicatesIgnored: s.duplicatesIgnored,
  };
}

export function feedItem(s: School, p: Payment) {
  const fam = s.families.find((f) => f.id === p.familyId);
  return {
    id: p.id,
    at: p.paidAt,
    amount: p.amount,
    channel: p.channel,
    payer: p.phoneLast3 ? `07•• ••• ${p.phoneLast3}` : p.channel === "bank_import" ? "Bank" : p.receivedBy ?? "—",
    familyId: p.familyId,
    familyName: fam?.displayName ?? "Unmatched",
    learners: p.split.map((x) => x.name),
    split: p.split,
    credit: p.credit,
    badge: p.matchKind,
    receiptNo: p.receiptNo,
    billRef: p.billRef,
  };
}

export function clearanceInput(s: School, learnerId: string): ClearanceInput {
  const l = learnerById(s, learnerId)!;
  const pos = termPosition(s, learnerId);
  const plan = s.plans.find((p) => p.familyId === l.familyId && p.status !== "completed");
  return {
    learnerId,
    name: `${l.firstName} ${l.lastName}`,
    streamId: l.streamId,
    termFees: pos.billed + pos.arrears,
    paid: pos.paid,
    plan: plan ? { instalments: plan.instalments.map((i) => ({ dueDate: i.dueDate, paid: i.paid >= i.amount })) } : null,
  };
}

export function families(s: School, q = "", campusId?: string | null, filter: "all" | "balance" | "paid" | "plan" = "all") {
  const needle = q.trim().toLowerCase();
  const digits = needle.replace(/\D/g, "");
  return s.families
    .filter((f) => !campusId || f.campusId === campusId)
    .map((f) => {
      const kids = s.learners.filter((l) => l.familyId === f.id);
      const guardians = s.guardians.filter((g) => g.familyId === f.id);
      return { family: f, kids, guardians, balance: familyBalance(s, f.id), plan: s.plans.find((p) => p.familyId === f.id) ?? null };
    })
    .filter((x) => {
      if (filter === "balance" && x.balance <= 0) return false;
      if (filter === "paid" && x.balance > 0) return false;
      if (filter === "plan" && !x.plan) return false;
      if (!needle) return true;
      return (
        x.family.displayName.toLowerCase().includes(needle) ||
        x.family.code.toLowerCase().includes(needle) ||
        x.kids.some((k) => `${k.firstName} ${k.lastName}`.toLowerCase().includes(needle) || k.admissionNumber === digits) ||
        (digits.length >= 6 && x.guardians.some((g) => g.phone.includes(digits.slice(-9))))
      );
    });
}

export function familyDetail(s: School, familyId: string) {
  const f = s.families.find((x) => x.id === familyId);
  if (!f) return null;
  const kids = s.learners.filter((l) => l.familyId === f.id).map((l) => {
    const pos = termPosition(s, l.id);
    const stream = s.streams.find((st) => st.id === l.streamId)!;
    const status = evaluateClearance(clearanceInput(s, l.id), { thresholdPct: s.org.clearancePct }, isoDateNairobi(new Date(s.today)));
    return { learner: l, stream, pos, statement: buildStatement(s.ledger, l.id), status, route: s.routes.find((r) => r.id === l.routeId) ?? null };
  });
  const payments = s.payments.filter((p) => p.familyId === f.id).sort((a, b) => b.paidAt.localeCompare(a.paidAt));
  const plan = s.plans.find((p) => p.familyId === f.id) ?? null;
  const guardians = s.guardians.filter((g) => g.familyId === f.id).map((g) => ({ ...g, masked: maskMsisdn(g.phone) }));
  const term = currentTerm(s);
  const reminders = planReminders({
    term: { id: term.id, openingDate: term.opening, dueDate: term.due },
    family: { familyId: f.id, balance: familyBalance(s, f.id), hasActivePlan: plan?.status === "active", instalments: plan?.instalments.map((i) => ({ n: i.n, totalN: plan.instalments.length, dueDate: i.dueDate, amount: i.amount, paid: i.paid >= i.amount })) },
    config: { quietStart: s.org.quietStart, quietEnd: s.org.quietEnd, maxPerWeek: s.org.maxPerWeek, holidays: [] },
    now: new Date(s.today),
  });
  return { family: f, kids, payments, plan, guardians, balance: familyBalance(s, f.id), reminders };
}

export function feeMatrix(s: School, termId = currentTerm(s).id) {
  const rows = s.structures[termId];
  const prevId = s.terms.find((t) => t.status === "closed")!.id;
  const diff = termId === prevId ? [] : diffStructures({ id: "a", termId: prevId, status: "published", rows: s.structures[prevId] }, { id: "b", termId, status: "published", rows });
  return {
    items: s.feeItems.filter((f) => f.code !== "transport"),
    grades: s.grades,
    cell: (g: string, item: string, col: "day" | "boarder") => rows.find((r) => r.gradeCode === g && r.feeItemId === item)?.[col] ?? 0,
    changed: new Set(diff.map((d) => `${d.gradeCode}|${d.feeItemId}`)),
    routes: s.routes,
  };
}

export function clearanceForStream(s: School, streamId: string) {
  const ls = s.learners.filter((l) => l.streamId === streamId && l.status === "active");
  return clearanceBoard(ls.map((l) => clearanceInput(s, l.id)), { thresholdPct: s.org.clearancePct }, isoDateNairobi(new Date(s.today)));
}

export function reports(s: School, campusId?: string | null) {
  const d = dashboard(s, campusId);
  const term = currentTerm(s);
  const byItem = new Map<string, { billed: number; outstanding: number }>();
  for (const l of s.lines.values()) {
    if (l.termKey !== term.key) continue;
    const learner = learnerById(s, l.learnerId)!;
    if (campusId && learner.campusId !== campusId) continue;
    const cur = byItem.get(l.feeItemName) ?? { billed: 0, outstanding: 0 };
    cur.billed += l.amount;
    cur.outstanding += l.outstanding;
    byItem.set(l.feeItemName, cur);
  }
  const channels = new Map<string, { count: number; amount: number }>();
  for (const p of s.payments.filter((x) => x.termId === term.id && x.familyId && x.matchStatus !== "reversed")) {
    const c = channels.get(p.channel) ?? { count: 0, amount: 0 };
    c.count++;
    c.amount += p.amount;
    channels.set(p.channel, c);
  }
  return {
    byGrade: d.heat.map((h) => {
      const ls = s.learners.filter((l) => l.gradeCode === h.gradeCode && (!campusId || l.campusId === campusId));
      let billed = 0;
      let paid = 0;
      for (const l of ls) {
        const p = termPosition(s, l.id);
        billed += p.billed;
        paid += p.paid;
      }
      return { grade: h.gradeName, learners: ls.length, billed, paid, pct: billed ? Math.round((paid / billed) * 100) : 0 };
    }),
    byItem: [...byItem.entries()].map(([name, v]) => ({ name, ...v })),
    channels: [...channels.entries()].map(([channel, v]) => ({ channel, ...v })),
    plans: s.plans,
    notices: s.notices.map((n) => ({ ...n, rate: readReceiptStats([]) })),
    dashboard: d,
  };
}

/** What a parent sees (portal / WhatsApp). Only their own family. */
export function parentView(s: School, familyId: string) {
  const d = familyDetail(s, familyId);
  if (!d) return null;
  const campus = s.campuses.find((c) => c.id === d.family.campusId)!;
  return {
    school: s.org.name,
    campus,
    term: currentTerm(s),
    family: d.family,
    balance: d.balance,
    children: d.kids.map((k) => ({ name: k.learner.firstName, fullName: `${k.learner.firstName} ${k.learner.lastName}`, admission: k.learner.admissionNumber, grade: `${gradeName(k.learner.gradeCode)} ${k.stream.name}`, balance: k.pos.balance, billed: k.pos.billed, statement: k.statement })),
    receipts: d.payments.filter((p) => p.receiptNo).map((p) => ({ number: p.receiptNo!, amount: p.amount, at: p.paidAt, split: p.split, verifyCode: p.verifyCode })),
    plan: d.plan,
    notices: s.notices.slice(0, 4),
    nextDue: d.plan?.instalments.find((i) => i.paid < i.amount) ?? null,
    payLabel: formatKes(Math.max(0, d.balance)),
  };
}

export function verifyReceipt(s: School, code: string) {
  const p = s.payments.find((x) => x.verifyCode === code);
  if (!p) return null;
  return { school: s.org.name, receipt: p.receiptNo, amount: p.amount, date: p.paidAt, status: p.matchStatus === "reversed" ? "Reversed" : "Valid" };
}
