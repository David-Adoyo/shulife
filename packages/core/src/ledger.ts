import { sum, type Cents } from "./money";

/**
 * Append-only learner ledger (§6.3). Debits are charges; credits are payment
 * allocations, discounts, waivers and sponsor payments. Corrections are new
 * adjusting entries — entries are never edited or deleted (§0.1 rule 6).
 */
export type LedgerEntry = {
  id: string;
  learnerId: string;
  termKey: string; // "2027-1"
  at: string; // ISO instant
  kind: "invoice_line" | "charge" | "allocation" | "discount" | "waiver" | "sponsor" | "brought_forward" | "reversal" | "credit_applied";
  description: string;
  /** Positive = debit (owed), negative = credit (reduces balance). */
  amount: Cents;
  ref?: string; // receipt or invoice number
};

export function balanceOf(entries: LedgerEntry[], learnerId?: string): Cents {
  return sum(entries.filter((e) => !learnerId || e.learnerId === learnerId).map((e) => e.amount));
}

export function familyBalance(entries: LedgerEntry[], learnerIds: string[]): Cents {
  const set = new Set(learnerIds);
  return sum(entries.filter((e) => set.has(e.learnerId)).map((e) => e.amount));
}

/** Freeze an array so accidental mutation throws in development. */
export function appendOnly<T>(list: readonly T[], entry: T): readonly T[] {
  return Object.freeze([...list, entry]);
}

/** A reversal is a new entry that cancels an earlier one. */
export function reverse(entry: LedgerEntry, id: string, at: string, reason: string): LedgerEntry {
  return { ...entry, id, at, kind: "reversal", amount: -entry.amount, description: `Reversal: ${reason}` };
}

export type StatementSection = { termKey: string; broughtForward: Cents; lines: LedgerEntry[]; charges: Cents; credits: Cents; closing: Cents };

/** Bank-statement style statement per learner, grouped by term with balance brought forward. */
export function buildStatement(entries: LedgerEntry[], learnerId: string): { sections: StatementSection[]; balance: Cents } {
  const mine = entries.filter((e) => e.learnerId === learnerId).sort((a, b) => a.termKey.localeCompare(b.termKey) || a.at.localeCompare(b.at));
  const terms = [...new Set(mine.map((e) => e.termKey))];
  let running = 0;
  const sections = terms.map((termKey) => {
    const lines = mine.filter((e) => e.termKey === termKey && e.kind !== "brought_forward");
    const bf = running;
    const charges = sum(lines.filter((l) => l.amount > 0).map((l) => l.amount));
    const credits = sum(lines.filter((l) => l.amount < 0).map((l) => l.amount));
    running = bf + charges + credits;
    return { termKey, broughtForward: bf, lines, charges, credits, closing: running };
  });
  return { sections, balance: running };
}
