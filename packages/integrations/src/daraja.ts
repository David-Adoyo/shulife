import { json, type Fetch } from "./http";

/**
 * Safaricom Daraja (§7.2). One client per school campus, using the school's OWN
 * credentials (Shulife never holds fees). Secrets come from Supabase Vault.
 */
export type DarajaConfig = {
  environment: "sandbox" | "production";
  consumerKey: string;
  consumerSecret: string;
  shortcode: string;
  passkey?: string; // Lipa na M-Pesa Online (STK) passkey
  fetch?: Fetch;
  now?: () => Date;
};

const BASE = { sandbox: "https://sandbox.safaricom.co.ke", production: "https://api.safaricom.co.ke" };

/** `yyyyMMddHHmmss` in Nairobi time, as Daraja expects. */
export function darajaTimestamp(d: Date) {
  const t = new Date(d.getTime() + 3 * 3_600_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${t.getUTCFullYear()}${p(t.getUTCMonth() + 1)}${p(t.getUTCDate())}${p(t.getUTCHours())}${p(t.getUTCMinutes())}${p(t.getUTCSeconds())}`;
}

export function createDaraja(cfg: DarajaConfig) {
  const f = cfg.fetch ?? fetch;
  const base = BASE[cfg.environment];
  const now = cfg.now ?? (() => new Date());
  let token: { value: string; expires: number } | null = null;

  async function accessToken() {
    if (token && token.expires > Date.now() + 60_000) return token.value;
    const basic = Buffer.from(`${cfg.consumerKey}:${cfg.consumerSecret}`).toString("base64");
    const res = await f(`${base}/oauth/v1/generate?grant_type=client_credentials`, { headers: { Authorization: `Basic ${basic}` } });
    const body = await json<{ access_token: string; expires_in: string | number }>("daraja", res);
    token = { value: body.access_token, expires: Date.now() + Number(body.expires_in) * 1000 };
    return token.value;
  }

  async function post<T>(path: string, payload: unknown) {
    const res = await f(`${base}${path}`, { method: "POST", headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    return json<T>("daraja", res);
  }

  function password(ts: string) {
    if (!cfg.passkey) throw new Error("STK needs the Lipa na M-Pesa Online passkey");
    return Buffer.from(`${cfg.shortcode}${cfg.passkey}${ts}`).toString("base64");
  }

  return {
    accessToken,
    /** Register the per-campus secret callback URLs. Validation accepts all payments. */
    registerUrls: (urls: { confirmation: string; validation: string }) =>
      post<{ ResponseCode: string; ResponseDescription: string }>("/mpesa/c2b/v2/registerurl", { ShortCode: cfg.shortcode, ResponseType: "Completed", ConfirmationURL: urls.confirmation, ValidationURL: urls.validation }),

    /** "Pay now" from the portal, reminder links and the bursar's "Request payment". */
    stkPush: (p: { phone: string; amountCents: number; accountReference: string; description: string; callbackUrl: string }) => {
      if (p.amountCents % 100 !== 0) throw new Error("M-Pesa only takes whole shillings");
      const ts = darajaTimestamp(now());
      return post<{ MerchantRequestID: string; CheckoutRequestID: string; ResponseCode: string; CustomerMessage: string }>("/mpesa/stkpush/v1/processrequest", {
        BusinessShortCode: cfg.shortcode,
        Password: password(ts),
        Timestamp: ts,
        TransactionType: "CustomerPayBillOnline",
        Amount: p.amountCents / 100,
        PartyA: p.phone,
        PartyB: cfg.shortcode,
        PhoneNumber: p.phone,
        CallBackURL: p.callbackUrl,
        AccountReference: p.accountReference.slice(0, 12),
        TransactionDesc: p.description.slice(0, 13),
      });
    },

    /** Nightly reconciliation of pending STK requests (§7.2). */
    stkQuery: (checkoutRequestId: string) => {
      const ts = darajaTimestamp(now());
      return post<{ ResultCode: string; ResultDesc: string }>("/mpesa/stkpushquery/v1/query", { BusinessShortCode: cfg.shortcode, Password: password(ts), Timestamp: ts, CheckoutRequestID: checkoutRequestId });
    },

    /**
     * M-PESA Ratiba (standing orders). The endpoint and fields must be confirmed
     * against Safaricom's current documentation and the school's onboarding
     * (see docs/RUNBOOK.md) before this is switched on.
     */
    ratiba: () => {
      throw new Error("M-PESA Ratiba is not enabled: confirm the API with Safaricom first");
    },
  };
}
