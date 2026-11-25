import type { Cents } from "./money";

/**
 * Clearance engine (§7.8) — "kinder than sending children home".
 * Cleared if paid ≥ threshold % of the term's fees, OR on a plan with no missed
 * instalment, OR overridden by the head/bursar with a reason.
 */

export type ClearanceStatus = "cleared" | "on_plan" | "not_cleared" | "overridden";

export type ClearanceInput = {
  learnerId: string;
  name: string;
  streamId: string;
  termFees: Cents;
  paid: Cents;
  plan?: { instalments: { dueDate: string; paid: boolean }[] } | null;
  override?: { by: string; reason: string } | null;
};

export function evaluateClearance(l: ClearanceInput, rule: { thresholdPct: number }, asOf: string): ClearanceStatus {
  if (l.override) {
    if (!l.override.reason.trim()) throw new Error("An override needs a reason");
    return "overridden";
  }
  if (l.termFees <= 0 || l.paid * 100 >= l.termFees * rule.thresholdPct) return "cleared";
  if (l.plan) {
    const missed = l.plan.instalments.some((i) => !i.paid && i.dueDate < asOf);
    if (!missed) return "on_plan";
  }
  return "not_cleared";
}

/** The Clearance Board: four columns of learner chips. */
export function clearanceBoard(learners: ClearanceInput[], rule: { thresholdPct: number }, asOf: string) {
  const board: Record<ClearanceStatus, { learnerId: string; name: string }[]> = { cleared: [], on_plan: [], not_cleared: [], overridden: [] };
  for (const l of learners) board[evaluateClearance(l, rule, asOf)].push({ learnerId: l.learnerId, name: l.name });
  return board;
}

/**
 * What a class teacher may see (§6.6): names and status only — no money fields
 * at all, so nothing can leak through the UI or an export.
 */
export function teacherView(learners: ClearanceInput[], rule: { thresholdPct: number }, asOf: string, streamIds: string[]) {
  return learners
    .filter((l) => streamIds.includes(l.streamId))
    .map((l) => ({ learnerId: l.learnerId, name: l.name, status: evaluateClearance(l, rule, asOf) }));
}
