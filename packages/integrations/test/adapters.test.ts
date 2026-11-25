import { describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import { createDaraja, createEmail, createPaystack, createSms, createWhatsApp, darajaTimestamp, ProviderError, verifyPaystackSignature, verifyWhatsAppSignature } from "../src";

type Call = { url: string; init?: RequestInit };
function mockFetch(responses: Record<string, unknown>, status = 200) {
  const calls: Call[] = [];
  const fn = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const u = String(url);
    calls.push({ url: u, init });
    const key = Object.keys(responses).find((k) => u.includes(k))!;
    return new Response(JSON.stringify(responses[key]), { status });
  });
  return { fetch: fn as unknown as typeof fetch, calls };
}

describe("Daraja", () => {
  const now = () => new Date("2027-01-12T05:30:00Z"); // 08:30 Nairobi
  it("formats the timestamp in Nairobi time", () => expect(darajaTimestamp(now())).toBe("20270112083000"));
  it("gets a token once and sends a correct STK push", async () => {
    const m = mockFetch({ "/oauth/": { access_token: "T", expires_in: "3599" }, "/stkpush/": { CheckoutRequestID: "ws_1", ResponseCode: "0" } });
    const d = createDaraja({ environment: "sandbox", consumerKey: "k", consumerSecret: "s", shortcode: "174379", passkey: "pk", fetch: m.fetch, now });
    await d.stkPush({ phone: "254712345678", amountCents: 450000, accountReference: "FAM-2041-EXTRA", description: "School fees payment", callbackUrl: "https://x/cb" });
    await d.stkPush({ phone: "254712345678", amountCents: 100, accountReference: "2041", description: "x", callbackUrl: "https://x/cb" });
    expect(m.calls.filter((c) => c.url.includes("/oauth/"))).toHaveLength(1);
    expect(m.calls[0].url).toBe("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials");
    expect((m.calls[0].init!.headers as Record<string, string>).Authorization).toBe(`Basic ${Buffer.from("k:s").toString("base64")}`);
    const body = JSON.parse(String(m.calls[1].init!.body));
    expect(body).toMatchObject({ BusinessShortCode: "174379", Timestamp: "20270112083000", TransactionType: "CustomerPayBillOnline", Amount: 4500, PartyB: "174379", AccountReference: "FAM-2041-EXT", TransactionDesc: "School fees p" });
    expect(body.Password).toBe(Buffer.from("174379pk20270112083000").toString("base64"));
  });
  it("refuses fractional shillings and an unconfirmed Ratiba API", async () => {
    const d = createDaraja({ environment: "sandbox", consumerKey: "k", consumerSecret: "s", shortcode: "1", passkey: "p", fetch: mockFetch({}).fetch });
    expect(() => d.stkPush({ phone: "254", amountCents: 150, accountReference: "a", description: "b", callbackUrl: "c" })).toThrow(/whole shillings/);
    expect(() => d.ratiba()).toThrow(/Ratiba/);
  });
  it("registers C2B URLs", async () => {
    const m = mockFetch({ "/oauth/": { access_token: "T", expires_in: 3599 }, registerurl: { ResponseCode: "0" } });
    const d = createDaraja({ environment: "production", consumerKey: "k", consumerSecret: "s", shortcode: "522533", fetch: m.fetch });
    await d.registerUrls({ confirmation: "https://s/c", validation: "https://s/v" });
    expect(m.calls[1].url).toBe("https://api.safaricom.co.ke/mpesa/c2b/v2/registerurl");
    expect(JSON.parse(String(m.calls[1].init!.body))).toEqual({ ShortCode: "522533", ResponseType: "Completed", ConfirmationURL: "https://s/c", ValidationURL: "https://s/v" });
  });
  it("surfaces provider errors", async () => {
    const d = createDaraja({ environment: "sandbox", consumerKey: "k", consumerSecret: "s", shortcode: "1", fetch: mockFetch({ "/oauth/": { error: "bad" } }, 401).fetch });
    await expect(d.accessToken()).rejects.toBeInstanceOf(ProviderError);
  });
});

describe("SMS, WhatsApp, Paystack, email", () => {
  it("sends SMS as a form with the sender ID", async () => {
    const m = mockFetch({ messaging: { SMSMessageData: { Recipients: [{ number: "+254712345678", status: "Success", messageId: "ATX1", cost: "KES 0.8000" }] } } });
    const r = await createSms({ username: "sandbox", apiKey: "K", senderId: "SHULIFE", sandbox: true, fetch: m.fetch }).send(["254712345678"], "Mlima Academy: hello");
    expect(r).toEqual([{ to: "+254712345678", ok: true, providerId: "ATX1", cost: "KES 0.8000" }]);
    const form = new URLSearchParams(String(m.calls[0].init!.body));
    expect(Object.fromEntries(form)).toEqual({ username: "sandbox", to: "+254712345678", message: "Mlima Academy: hello", from: "SHULIFE" });
  });
  it("sends WhatsApp templates with ordered variables", async () => {
    const m = mockFetch({ messages: { messages: [{ id: "wamid.1" }] } });
    const r = await createWhatsApp({ phoneNumberId: "123", token: "T", fetch: m.fetch }).template("254712345678", "receipt", "sw", ["Mlima Academy", "45,000"]);
    expect(r.providerId).toBe("wamid.1");
    expect(m.calls[0].url).toBe("https://graph.facebook.com/v21.0/123/messages");
    expect(JSON.parse(String(m.calls[0].init!.body))).toEqual({ messaging_product: "whatsapp", to: "254712345678", type: "template", template: { name: "receipt", language: { code: "sw" }, components: [{ type: "body", parameters: [{ type: "text", text: "Mlima Academy" }, { type: "text", text: "45,000" }] }] } });
  });
  it("verifies webhook signatures", () => {
    const body = '{"a":1}';
    expect(verifyWhatsAppSignature(body, "sha256=" + createHmac("sha256", "app").update(body).digest("hex"), "app")).toBe(true);
    expect(verifyWhatsAppSignature(body, "sha256=00", "app")).toBe(false);
    expect(verifyPaystackSignature(body, createHmac("sha512", "sk").update(body).digest("hex"), "sk")).toBe(true);
    expect(verifyPaystackSignature(body, null, "sk")).toBe(false);
  });
  it("initialises Paystack in KES cents and sends email", async () => {
    const m = mockFetch({ paystack: { status: true, data: { authorization_url: "https://pay", reference: "SUB-1" } }, resend: { id: "e1" } });
    expect((await createPaystack({ secretKey: "sk", fetch: m.fetch }).initialize({ email: "d@x", amountCents: 6_200_000, reference: "SUB-1", callbackUrl: "https://cb" })).authorization_url).toBe("https://pay");
    expect(JSON.parse(String(m.calls[0].init!.body))).toMatchObject({ amount: 6_200_000, currency: "KES" });
    expect((await createEmail({ apiKey: "re", from: "Shulife <hello@x>", fetch: m.fetch }).send({ to: "d@x", subject: "Statement", html: "<p>Hi</p>" })).id).toBe("e1");
  });
});
