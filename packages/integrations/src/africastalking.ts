import { json, type Fetch } from "./http";

/** Africa's Talking SMS with sender ID {{SMS_SENDER_ID}}. Delivery reports arrive on a callback. */
export function createSms(cfg: { username: string; apiKey: string; senderId?: string; sandbox?: boolean; fetch?: Fetch }) {
  const f = cfg.fetch ?? fetch;
  const url = cfg.sandbox ? "https://api.sandbox.africastalking.com/version1/messaging" : "https://api.africastalking.com/version1/messaging";
  return {
    async send(to: string[], message: string) {
      const form = new URLSearchParams({ username: cfg.username, to: to.map((t) => (t.startsWith("+") ? t : `+${t}`)).join(","), message });
      if (cfg.senderId) form.set("from", cfg.senderId);
      const res = await f(url, { method: "POST", headers: { apiKey: cfg.apiKey, Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" }, body: form.toString() });
      const body = await json<{ SMSMessageData: { Recipients: { number: string; status: string; messageId: string; cost: string }[] } }>("africastalking", res);
      return body.SMSMessageData.Recipients.map((r) => ({ to: r.number, ok: r.status === "Success", providerId: r.messageId, cost: r.cost }));
    },
  };
}
