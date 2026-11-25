import { NextResponse } from "next/server";
import { createRateLimiter, familyBalanceSafe, handleInbound, hashMsisdn, normalizeMsisdn } from "./deps";

/**
 * WhatsApp assistant webhook (§7.10). Production receives the Cloud API payload and
 * replies through the Cloud API; the demo accepts { from, text } and returns the reply.
 */
export const dynamic = "force-dynamic";
const limiter = createRateLimiter(10, 10 * 60_000);

export async function GET(req: Request) {
  // Meta webhook verification handshake
  const u = new URL(req.url);
  if (u.searchParams.get("hub.verify_token") === (process.env.WHATSAPP_VERIFY_TOKEN ?? "demo-verify")) return new NextResponse(u.searchParams.get("hub.challenge"));
  return new NextResponse(null, { status: 403 });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { from?: string; text?: string; entry?: { changes?: { value?: { messages?: { from: string; text?: { body: string } }[] } }[] }[] };
  const msg = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  const from = normalizeMsisdn(msg?.from ?? body.from ?? "");
  const text = msg?.text?.body ?? body.text ?? "";
  if (!from) return NextResponse.json({ error: "invalid sender" }, { status: 400 });
  const { school, families } = familyBalanceSafe();
  const reply = handleInbound({ senderPhoneHash: hashMsisdn(from, "demo-salt"), text, school, families, rateLimiter: limiter });
  return NextResponse.json({ to: from, reply });
}
