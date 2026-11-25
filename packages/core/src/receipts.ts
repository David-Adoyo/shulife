import { randomBytes } from "node:crypto";
import { sum, type Cents } from "./money";

/** `RCT-RUI-2027-000456` (§7.5) */
export function receiptNumber(campusCode: string, year: number, seq: number): string {
  if (!/^[A-Z]{3,4}$/.test(campusCode)) throw new Error("Campus code must be 3–4 capital letters");
  return `RCT-${campusCode}-${year}-${String(seq).padStart(6, "0")}`;
}

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L

/** Short code behind the receipt QR: `{{DOMAIN}}/r/{code}`. */
export function verifyCode(length = 10): string {
  const bytes = randomBytes(length);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

/** The public verification page shows only these fields (§7.5). */
export function publicReceiptView(r: { schoolName: string; number: string; amount: Cents; paidAt: string; reversed?: boolean }) {
  return { school: r.schoolName, receipt: r.number, amount: r.amount, date: r.paidAt, status: r.reversed ? "Reversed" : "Valid" };
}

/* ---------- Daily cash-up and banking (§7.6) ---------- */

export type ManualReceipt = { id: string; receiverId: string; channel: "cash" | "cheque" | "bank_slip"; amount: Cents; receivedOn: string; bankedDepositId: string | null; hasPhoto: boolean };

export function cashUp(receipts: ManualReceipt[], day: string) {
  const today = receipts.filter((r) => r.receivedOn === day);
  const byReceiver = new Map<string, Record<ManualReceipt["channel"], Cents>>();
  for (const r of today) {
    const cur = byReceiver.get(r.receiverId) ?? { cash: 0, cheque: 0, bank_slip: 0 };
    cur[r.channel] += r.amount;
    byReceiver.set(r.receiverId, cur);
  }
  return { day, count: today.length, total: sum(today.map((r) => r.amount)), byReceiver, missingPhotos: today.filter((r) => !r.hasPhoto).map((r) => r.id) };
}

/** Variance between what a deposit slip says and the receipts linked to it. */
export function bankingVariance(depositAmount: Cents, linked: ManualReceipt[]): Cents {
  return depositAmount - sum(linked.map((r) => r.amount));
}

/** Cash or cheques not banked within the SLA → director alert. */
export function unbankedAlerts(receipts: ManualReceipt[], today: string, slaDays: number) {
  const limit = Date.parse(today) - slaDays * 86_400_000;
  return receipts.filter((r) => r.channel !== "bank_slip" && !r.bankedDepositId && Date.parse(r.receivedOn) < limit);
}

export function requireManualReceiptValid(r: Partial<ManualReceipt> & { bookRef?: string }): string[] {
  const errors: string[] = [];
  if (!r.amount || r.amount <= 0) errors.push("Enter an amount");
  if (!r.hasPhoto) errors.push("Add a photo of the slip or cheque");
  if (!r.bookRef) errors.push("Enter the receipt-book number");
  if (!r.receiverId) errors.push("Choose who received it");
  return errors;
}
