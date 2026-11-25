import { assertCents, type Cents } from "./money";

/**
 * Director's cash projection (§7.12). Expected inflows for the next N days from:
 *  - plan instalments due, weighted by how reliably plans are paid,
 *  - Ratiba standing orders (treated as near-certain),
 *  - the historical payment curve: the share of billed fees that arrived in the
 *    same week of term in earlier terms, applied to today's outstanding balance.
 * Needs at least one closed term of history; otherwise status is "learning".
 */

export type HistoryTerm = {
  billed: Cents;
  /** Collected per week of term, index 0 = opening week. */
  collectedByWeek: Cents[];
};

export type ProjectionInput = {
  asOf: string; // ISO date
  days: 30 | 60 | 90;
  termOpening: string;
  outstanding: Cents; // non-plan balances still owed this term
  instalments: { dueDate: string; amount: Cents }[];
  ratiba: { dueDate: string; amount: Cents }[];
  history: HistoryTerm[];
  planReliability?: number; // default 0.85
};

export type ProjectionDay = { date: string; expected: Cents; low: Cents; high: Cents };

export function projectCash(input: ProjectionInput): { status: "ok" | "learning"; days: ProjectionDay[]; total: Cents; notes: string[] } {
  const reliability = input.planReliability ?? 0.85;
  const start = Date.parse(input.asOf);
  const opening = Date.parse(input.termOpening);
  const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
  const learning = input.history.length === 0;

  // Average share of billed fees collected in each week of term, across history.
  const maxWeeks = Math.max(0, ...input.history.map((h) => h.collectedByWeek.length));
  const weekShare = Array.from({ length: maxWeeks }, (_, w) => {
    const shares = input.history.filter((h) => h.billed > 0).map((h) => (h.collectedByWeek[w] ?? 0) / h.billed);
    return shares.length ? shares.reduce((a, b) => a + b, 0) / shares.length : 0;
  });
  // Share of what was still outstanding at the start of each week that then arrived.
  const remainingShare = (w: number) => {
    const before = weekShare.slice(0, w).reduce((a, b) => a + b, 0);
    return Math.max(1e-9, 1 - before);
  };

  // Expected collection per week from the outstanding balance, decaying as money arrives:
  // each week collects the historical share of what was still owed at the start of that week.
  const asOfWeek = Math.floor((start - opening) / (7 * 86_400_000));
  const weeklyFromCurve = new Map<number, Cents>();
  if (!learning) {
    let left = input.outstanding;
    for (let w = Math.max(0, asOfWeek); w < weekShare.length; w++) {
      const got = Math.round(left * Math.min(1, weekShare[w] / remainingShare(w)));
      weeklyFromCurve.set(w, got);
      left -= got;
    }
  }

  const days: ProjectionDay[] = [];
  for (let i = 0; i < input.days; i++) {
    const t = start + i * 86_400_000;
    const date = iso(t);
    let expected = 0;
    let certain = 0;
    for (const r of input.ratiba) if (r.dueDate === date) certain += r.amount;
    for (const p of input.instalments) if (p.dueDate === date) expected += Math.round(p.amount * reliability);
    const week = Math.floor((t - opening) / (7 * 86_400_000));
    expected += Math.round((weeklyFromCurve.get(week) ?? 0) / 7);
    const spread = Math.round(expected * 0.25);
    days.push({ date, expected: assertCents(expected + certain), low: expected - spread + certain, high: expected + spread + certain });
  }
  const total = days.reduce((s, d) => s + d.expected, 0);
  const notes: string[] = [];
  if (learning) notes.push("Learning your school’s payment pattern — projections improve after your first full term.");
  else {
    const firstThree = weekShare.slice(0, 3).reduce((a, b) => a + b, 0);
    if (firstThree >= 0.5) notes.push(`Most fees typically arrive in the first 3 weeks of term (${Math.round(firstThree * 100)}%).`);
  }
  if (input.ratiba.length) notes.push(`${input.ratiba.length} Ratiba payments are scheduled in this period.`);
  return { status: learning ? "learning" : "ok", days, total, notes };
}
