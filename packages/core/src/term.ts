import type { Cents } from "./money";
import type { LedgerEntry } from "./ledger";

/**
 * Term lifecycle (§7.11). Closing a term locks it and carries every balance
 * forward as a "balance brought forward" line — positive balances and credits alike.
 */
export function closeTerm(input: {
  closingTermKey: string;
  nextTermKey: string;
  at: string;
  balances: { learnerId: string; balance: Cents; status: "active" | "left" | "graduated" | "suspended" | "prospective" }[];
  idFor: (learnerId: string) => string;
}): { carried: LedgerEntry[]; closing: LedgerEntry[]; leavers: { learnerId: string; balance: Cents; certificateEligible: boolean }[] } {
  const carried: LedgerEntry[] = [];
  const closing: LedgerEntry[] = [];
  const leavers: { learnerId: string; balance: Cents; certificateEligible: boolean }[] = [];
  for (const b of input.balances) {
    if (b.status === "left" || b.status === "graduated") {
      leavers.push({ learnerId: b.learnerId, balance: b.balance, certificateEligible: b.balance === 0 });
      continue; // leavers keep their final statement; nothing moves to the next term
    }
    if (b.balance === 0) continue;
    // Close the old term to zero and open the new term with the same amount, so per-term sums stay correct.
    closing.push({ id: `${input.idFor(b.learnerId)}-close`, learnerId: b.learnerId, termKey: input.closingTermKey, at: input.at, kind: "brought_forward", description: "Carried forward to next term", amount: -b.balance });
    carried.push({ id: input.idFor(b.learnerId), learnerId: b.learnerId, termKey: input.nextTermKey, at: input.at, kind: "brought_forward", description: b.balance > 0 ? "Balance brought forward" : "Credit brought forward", amount: b.balance });
  }
  return { carried, closing, leavers };
}

/** Promote wizard: grade +1; the last grade graduates. */
export function promoteGrade(code: string, order: string[]): string | "graduate" {
  const i = order.indexOf(code);
  if (i === -1) throw new Error(`Unknown grade ${code}`);
  return i === order.length - 1 ? "graduate" : order[i + 1];
}

/** Kenyan structure seeded by default (§4.2). */
export const KENYA_GRADES = ["PP1", "PP2", "G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10", "G11", "G12"] as const;

export function gradeLevel(code: string): "pre_primary" | "primary" | "junior" | "senior" {
  if (code.startsWith("PP")) return "pre_primary";
  const n = Number(code.slice(1));
  return n <= 6 ? "primary" : n <= 9 ? "junior" : "senior";
}

export function gradeName(code: string): string {
  return code.startsWith("PP") ? code : `Grade ${code.slice(1)}`;
}
