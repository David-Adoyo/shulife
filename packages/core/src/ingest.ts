import { kes, type Cents } from "./money";
import { parseCsv } from "./importer";
import { fromNairobi } from "./time";

/**
 * Payment ingestion (§7.2). Every source becomes the same normalised payment,
 * then flows through matching → allocation → receipt. Idempotent on
 * (org_id, provider_ref): a duplicate callback is acknowledged and ignored.
 */

export type Channel = "c2b" | "stk" | "ratiba" | "bank_import" | "cash" | "cheque" | "bank_slip";

export type NormalisedPayment = {
  providerRef: string;
  amount: Cents;
  billRef: string | null;
  msisdn: string | null; // plain or provider-hashed
  payerName: string | null;
  paidAt: string; // ISO instant
  channel: Channel;
  shortcode?: string;
};

/** Daraja C2B confirmation body. */
export type DarajaC2B = {
  TransactionType?: string;
  TransID: string;
  TransTime: string; // yyyyMMddHHmmss, Nairobi time
  TransAmount: string | number;
  BusinessShortCode: string;
  BillRefNumber?: string;
  InvoiceNumber?: string;
  OrgAccountBalance?: string;
  MSISDN?: string;
  FirstName?: string;
  MiddleName?: string;
  LastName?: string;
};

export function parseDarajaC2B(body: DarajaC2B): NormalisedPayment {
  if (!body?.TransID || !body.TransTime || body.TransAmount === undefined) throw new Error("Not a C2B confirmation");
  const t = body.TransTime;
  const paidAt = fromNairobi(+t.slice(0, 4), +t.slice(4, 6), +t.slice(6, 8), +t.slice(8, 10), +t.slice(10, 12)).toISOString();
  const name = [body.FirstName, body.MiddleName, body.LastName].filter(Boolean).join(" ").trim() || null;
  return { providerRef: body.TransID, amount: kes(String(body.TransAmount)), billRef: body.BillRefNumber?.trim() || null, msisdn: body.MSISDN ?? null, payerName: name, paidAt, channel: "c2b", shortcode: body.BusinessShortCode };
}

/** The validation URL accepts all payments (§7.2) — never reject a parent's money. */
export const C2B_VALIDATION_RESPONSE = { ResultCode: 0, ResultDesc: "Accepted" } as const;
export const C2B_CONFIRMATION_RESPONSE = { ResultCode: 0, ResultDesc: "Success" } as const;

/** STK Push callback → normalised payment, or null when the parent cancelled / it failed. */
export function parseStkCallback(body: { Body?: { stkCallback?: { ResultCode: number; ResultDesc: string; CheckoutRequestID: string; CallbackMetadata?: { Item: { Name: string; Value?: string | number }[] } } } }) {
  const cb = body?.Body?.stkCallback;
  if (!cb) throw new Error("Not an STK callback");
  if (cb.ResultCode !== 0) return { checkoutRequestId: cb.CheckoutRequestID, ok: false as const, reason: cb.ResultDesc };
  const item = (n: string) => cb.CallbackMetadata?.Item.find((i) => i.Name === n)?.Value;
  const t = String(item("TransactionDate"));
  const paidAt = fromNairobi(+t.slice(0, 4), +t.slice(4, 6), +t.slice(6, 8), +t.slice(8, 10), +t.slice(10, 12)).toISOString();
  return {
    checkoutRequestId: cb.CheckoutRequestID,
    ok: true as const,
    payment: { providerRef: String(item("MpesaReceiptNumber")), amount: kes(String(item("Amount"))), billRef: null, msisdn: String(item("PhoneNumber") ?? ""), payerName: null, paidAt, channel: "stk" as const },
  };
}

/** Generic bank statement import with a column mapping; dedupes by bank reference. */
export function parseBankCsv(text: string, mapping: { date: number; reference: number; description: number; credit: number; payer?: number }, existingRefs: Set<string> = new Set()) {
  const rows = parseCsv(text);
  const out: NormalisedPayment[] = [];
  const duplicates: string[] = [];
  const errors: { row: number; message: string }[] = [];
  rows.slice(1).forEach((r, i) => {
    const ref = (r[mapping.reference] ?? "").trim();
    const creditRaw = (r[mapping.credit] ?? "").replace(/[^\d.]/g, "");
    if (!creditRaw) return; // debits and blank lines are ignored
    if (!ref) {
      errors.push({ row: i + 2, message: "Missing bank reference" });
      return;
    }
    if (existingRefs.has(ref) || out.some((p) => p.providerRef === ref)) {
      duplicates.push(ref);
      return;
    }
    const date = new Date((r[mapping.date] ?? "").trim());
    if (isNaN(date.getTime())) {
      errors.push({ row: i + 2, message: `Unreadable date “${r[mapping.date]}”` });
      return;
    }
    out.push({ providerRef: ref, amount: kes(creditRaw), billRef: (r[mapping.description] ?? "").trim() || null, msisdn: null, payerName: mapping.payer !== undefined ? (r[mapping.payer] ?? "").trim() || null : null, paidAt: date.toISOString(), channel: "bank_import" });
  });
  return { payments: out, duplicates, errors };
}

/**
 * Idempotent ingestion step. `seen` is backed by the unique (org_id, provider_ref)
 * index in Postgres; here it is any set-like store.
 */
export function ingestOnce<T extends { providerRef: string }>(p: T, seen: { has(ref: string): boolean; add(ref: string): unknown }): { status: "new"; payment: T } | { status: "duplicate" } {
  if (seen.has(p.providerRef)) return { status: "duplicate" };
  seen.add(p.providerRef);
  return { status: "new", payment: p };
}
