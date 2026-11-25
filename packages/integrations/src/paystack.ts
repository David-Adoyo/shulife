import { createHmac, timingSafeEqual } from "node:crypto";
import { json, type Fetch } from "./http";

/** Paystack cards for Shulife's OWN subscription billing — never for school fees (§5.1). */
export function createPaystack(cfg: { secretKey: string; fetch?: Fetch }) {
  const f = cfg.fetch ?? fetch;
  return {
    async initialize(p: { email: string; amountCents: number; reference: string; callbackUrl: string }) {
      const res = await f("https://api.paystack.co/transaction/initialize", { method: "POST", headers: { Authorization: `Bearer ${cfg.secretKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ email: p.email, amount: p.amountCents, currency: "KES", reference: p.reference, callback_url: p.callbackUrl }) });
      const body = await json<{ status: boolean; data: { authorization_url: string; reference: string } }>("paystack", res);
      return body.data;
    },
  };
}

export function verifyPaystackSignature(rawBody: string, header: string | null, secretKey: string) {
  if (!header) return false;
  const expected = createHmac("sha512", secretKey).update(rawBody).digest("hex");
  return header.length === expected.length && timingSafeEqual(Buffer.from(header), Buffer.from(expected));
}
