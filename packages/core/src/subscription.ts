import type { Cents } from "./money";

/**
 * Shulife's own billing (§7.13): free until the first automatically matched
 * payment, then a trial, then billing per enrolled learner per term with a
 * minimum. Overdue → read-only after a grace period. Payment ingestion,
 * receipts and parent balances NEVER stop, whatever the state.
 */
export type SubState = "free" | "trial" | "active" | "overdue" | "read_only";

export type SubEvent =
  | { type: "first_auto_match"; at: string }
  | { type: "trial_ended"; at: string }
  | { type: "invoice_issued"; at: string; dueAt: string }
  | { type: "invoice_paid"; at: string }
  | { type: "tick"; at: string };

export type Subscription = { state: SubState; trialEndsAt: string | null; dueAt: string | null; graceDays: number; trialDays: number };

const plusDays = (iso: string, d: number) => new Date(Date.parse(iso) + d * 86_400_000).toISOString();

export function nextSubscription(s: Subscription, e: SubEvent): Subscription {
  switch (e.type) {
    case "first_auto_match":
      return s.state === "free" ? { ...s, state: "trial", trialEndsAt: plusDays(e.at, s.trialDays) } : s;
    case "trial_ended":
      return s.state === "trial" ? { ...s, state: "active" } : s;
    case "invoice_issued":
      return s.state === "free" || s.state === "trial" ? s : { ...s, dueAt: e.dueAt };
    case "invoice_paid":
      return s.state === "overdue" || s.state === "read_only" || s.state === "active" ? { ...s, state: "active", dueAt: null } : s;
    case "tick": {
      const now = Date.parse(e.at);
      if (s.state === "trial" && s.trialEndsAt && now >= Date.parse(s.trialEndsAt)) return { ...s, state: "active" };
      if (s.state === "active" && s.dueAt && now > Date.parse(s.dueAt)) return { ...s, state: "overdue" };
      if (s.state === "overdue" && s.dueAt && now > Date.parse(plusDays(s.dueAt, s.graceDays))) return { ...s, state: "read_only" };
      return s;
    }
  }
}

export function capabilities(state: SubState) {
  return {
    canEdit: state !== "read_only",
    // These are deliberately unconditional (§7.13).
    paymentIngestion: true,
    receipts: true,
    parentBalances: true,
    banner: state === "overdue" ? "Your Shulife invoice is overdue." : state === "read_only" ? "Your account is read-only until the invoice is paid. Payments and receipts are still running." : null,
  };
}

export function termCharge(enrolledLearners: number, pricePerLearner: Cents, minimum: Cents): Cents {
  return Math.max(minimum, enrolledLearners * pricePerLearner);
}
