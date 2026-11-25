import { createHmac, timingSafeEqual } from "node:crypto";
import { json, type Fetch } from "./http";

/** WhatsApp Business Cloud API: Utility templates out, commands in (§7.10). */
export function createWhatsApp(cfg: { phoneNumberId: string; token: string; apiVersion?: string; fetch?: Fetch }) {
  const f = cfg.fetch ?? fetch;
  const url = `https://graph.facebook.com/${cfg.apiVersion ?? "v21.0"}/${cfg.phoneNumberId}/messages`;
  const send = async (payload: Record<string, unknown>) => {
    const res = await f(url, { method: "POST", headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" }, body: JSON.stringify({ messaging_product: "whatsapp", ...payload }) });
    const body = await json<{ messages: { id: string }[] }>("whatsapp", res);
    return { providerId: body.messages[0]?.id };
  };
  return {
    /** Templates must be approved by Meta (Utility category). Variables fill {{1}}, {{2}}, … in order. */
    template: (to: string, name: string, lang: "en" | "sw", vars: string[]) =>
      send({ to, type: "template", template: { name, language: { code: lang === "sw" ? "sw" : "en_GB" }, components: vars.length ? [{ type: "body", parameters: vars.map((text) => ({ type: "text", text })) }] : [] } }),
    /** Free text is only allowed inside the 24-hour window after the parent messages the school. */
    text: (to: string, body: string) => send({ to, type: "text", text: { body } }),
  };
}

/** Verify Meta's X-Hub-Signature-256 header against the raw request body. */
export function verifyWhatsAppSignature(rawBody: string, header: string | null, appSecret: string) {
  if (!header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const got = header.slice(7);
  return got.length === expected.length && timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}
