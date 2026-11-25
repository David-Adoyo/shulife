import { createHash } from "node:crypto";

/**
 * Kenyan phone numbers → E.164 digits without "+", e.g. 254712345678.
 * Accepts 0712…, 712…, 254712…, +254 712…, and the 01xx (Safaricom/Airtel) ranges.
 */
export function normalizeMsisdn(input: string | null | undefined): string | null {
  if (!input) return null;
  let d = input.replace(/[^\d]/g, "");
  if (d.startsWith("00254")) d = d.slice(2);
  if (d.startsWith("254")) d = d.slice(3);
  else if (d.startsWith("0")) d = d.slice(1);
  if (!/^[17]\d{8}$/.test(d)) return null;
  return "254" + d;
}

export function isValidKenyanPhone(input: string): boolean {
  return normalizeMsisdn(input) !== null;
}

/** For lists: `0712 ••• 488`. Never show the full number outside the family profile. */
export function maskMsisdn(msisdn: string): string {
  const n = normalizeMsisdn(msisdn);
  if (!n) return "•••";
  const local = "0" + n.slice(3);
  return `${local.slice(0, 4)} ••• ${local.slice(-3)}`;
}

export function last3(msisdn: string): string {
  const n = normalizeMsisdn(msisdn) ?? msisdn;
  return n.slice(-3);
}

/**
 * Payment matching uses a salted hash of the phone number (§13), so raw numbers
 * are not needed to recognise a payer. Daraja sends either a plain MSISDN or an
 * already-hashed one; pass `alreadyHashed` for the latter.
 */
export function hashMsisdn(msisdn: string, salt: string): string {
  const n = normalizeMsisdn(msisdn);
  if (!n) throw new Error("Invalid phone number");
  return createHash("sha256").update(`${salt}:${n}`).digest("hex");
}
