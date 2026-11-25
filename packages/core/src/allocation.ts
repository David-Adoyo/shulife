import { assertCents, formatKes, splitProportional, type Cents } from "./money";

/**
 * Sibling allocation engine (§7.4). Shares one payment between a family's
 * children by the school's rule, then within each child by fee-item priority
 * (older terms first). Overpayment becomes credit.
 */

export type AllocationRule = "oldest_balance" | "proportional" | "youngest_first" | "eldest_first" | "exact_number";

export type OpenLine = {
  lineId: string;
  feeItemId: string;
  feeItemName: string;
  /** Lower number = paid first (tuition → boarding → lunch → transport → other). */
  priority: number;
  /** Sortable term key; smaller = older, e.g. "2026-3" < "2027-1". */
  termKey: string;
  outstanding: Cents;
};

export type ChildBalance = {
  learnerId: string;
  name: string;
  /** Used for eldest/youngest; ISO date or a join-order key. Smaller = older child. */
  ageKey: string;
  lines: OpenLine[];
};

export type AllocationLine = { learnerId: string; lineId: string; feeItemId: string; amount: Cents };

export type AllocationResult = {
  rule: AllocationRule;
  lines: AllocationLine[];
  perLearner: { learnerId: string; name: string; amount: Cents }[];
  /** Overpayment held as credit, applied to the next invoice automatically. */
  credit: Cents;
  creditLevel: "family" | "learner";
  creditLearnerId: string | null;
};

const outstandingOf = (c: ChildBalance) => c.lines.reduce((s, l) => s + l.outstanding, 0);

function payLines(lines: OpenLine[], amount: Cents): { paid: { line: OpenLine; amount: Cents }[]; left: Cents } {
  const ordered = [...lines].filter((l) => l.outstanding > 0).sort((a, b) => a.termKey.localeCompare(b.termKey) || a.priority - b.priority || a.lineId.localeCompare(b.lineId));
  const paid: { line: OpenLine; amount: Cents }[] = [];
  let left = amount;
  for (const line of ordered) {
    if (left <= 0) break;
    const take = Math.min(line.outstanding, left);
    paid.push({ line, amount: take });
    left -= take;
  }
  return { paid, left };
}

/** Split an amount across children, capping each at what they owe; returns per-child amounts. */
function capProportional(amount: Cents, owed: Cents[]): Cents[] {
  const total = owed.reduce((a, b) => a + b, 0);
  if (amount >= total) return [...owed];
  // Parents see whole shillings: split in units of KSh 1 when everything allows it.
  const unit = amount % 100 === 0 && owed.every((o) => o % 100 === 0) ? 100 : 1;
  return splitProportional(amount, owed, unit);
}

export function allocatePayment(input: {
  amount: Cents;
  rule: AllocationRule;
  children: ChildBalance[];
  /** The learner whose admission number was used, if any. */
  matchedLearnerId?: string | null;
}): AllocationResult {
  const amount = assertCents(input.amount);
  if (amount <= 0) throw new Error("Payment amount must be positive");
  let rule = input.rule;
  // Work on deep copies so callers' data is never mutated.
  const children = input.children.map((c) => ({ ...c, lines: c.lines.map((l) => ({ ...l })) }));

  // Exact-number only needs a specific learner; with a family code, fall back to the default rule.
  if (rule === "exact_number" && !input.matchedLearnerId) rule = "oldest_balance";

  const perChild = new Map<string, Cents>(children.map((c) => [c.learnerId, 0]));
  const lines: AllocationLine[] = [];
  const credit = { amount: 0, level: "family" as "family" | "learner", learnerId: null as string | null };

  const give = (child: ChildBalance, amt: Cents, subset?: OpenLine[]) => {
    if (amt <= 0) return 0;
    const { paid, left } = payLines(subset ?? child.lines, amt);
    for (const p of paid) {
      lines.push({ learnerId: child.learnerId, lineId: p.line.lineId, feeItemId: p.line.feeItemId, amount: p.amount });
      p.line.outstanding -= p.amount; // a working copy
    }
    perChild.set(child.learnerId, (perChild.get(child.learnerId) ?? 0) + (amt - left));
    return left;
  };

  let remaining = amount;
  if (rule === "exact_number") {
    const child = children.find((c) => c.learnerId === input.matchedLearnerId);
    if (!child) throw new Error("Matched learner is not in this family");
    remaining = give(child, remaining);
    credit.level = "learner";
    credit.learnerId = child.learnerId;
  } else if (rule === "eldest_first" || rule === "youngest_first") {
    const ordered = children.sort((a, b) => (rule === "eldest_first" ? a.ageKey.localeCompare(b.ageKey) : b.ageKey.localeCompare(a.ageKey)));
    for (const c of ordered) remaining = give(c, remaining);
  } else if (rule === "proportional") {
    const shares = capProportional(remaining, children.map(outstandingOf));
    children.forEach((c, i) => {
      remaining -= shares[i] - give(c, shares[i]);
    });
  } else {
    // Oldest balance first: settle each term tier (oldest first) across all children,
    // sharing a tier in proportion to each child's balance in that tier.
    const tiers = [...new Set(children.flatMap((c) => c.lines.filter((l) => l.outstanding > 0).map((l) => l.termKey)))].sort();
    for (const tier of tiers) {
      if (remaining <= 0) break;
      const tierLines = children.map((c) => c.lines.filter((l) => l.termKey === tier && l.outstanding > 0));
      const owed = tierLines.map((ls) => ls.reduce((s, l) => s + l.outstanding, 0));
      const shares = capProportional(remaining, owed);
      children.forEach((c, i) => {
        remaining -= shares[i] - give(c, shares[i], tierLines[i]);
      });
    }
  }

  credit.amount = remaining;
  return {
    rule,
    lines,
    perLearner: input.children.map((c) => ({ learnerId: c.learnerId, name: c.name, amount: perChild.get(c.learnerId) ?? 0 })),
    credit: credit.amount,
    creditLevel: credit.amount > 0 ? credit.level : "family",
    creditLearnerId: credit.amount > 0 ? credit.learnerId : null,
  };
}

/** Parent split confirmation text: "Amani KSh 20,000, Baraka KSh 15,000". */
export function describeSplit(r: AllocationResult): string {
  const parts = r.perLearner.filter((p) => p.amount > 0).map((p) => `${p.name} ${formatKes(p.amount)}`);
  if (r.credit > 0) parts.push(`credit ${formatKes(r.credit)}`);
  return parts.join(", ");
}

/** Default fee-item priority (§7.4): tuition → boarding → lunch → transport → other. */
export const DEFAULT_PRIORITY: Record<string, number> = { tuition: 10, boarding: 20, lunch: 30, transport: 40 };
export const priorityFor = (feeItemCode: string) => DEFAULT_PRIORITY[feeItemCode] ?? 90;
