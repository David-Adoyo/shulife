import { NextResponse } from "next/server";
import { C2B_CONFIRMATION_RESPONSE, C2B_VALIDATION_RESPONSE, hashMsisdn, last3, parseDarajaC2B, type DarajaC2B } from "@shulife/core";
import { getSchool, ingest, SALT, type Payment } from "@shulife/demo";
import { timingSafeEqual } from "node:crypto";

/**
 * Safaricom Daraja C2B callbacks (§7.2): /api/webhooks/mpesa/{campus}/{secret}/{validation|confirmation}
 * - The secret path is per campus (stored in payment_integrations.callback_secret).
 * - Validation accepts all payments; never reject a parent's money.
 * - Confirmation stores the raw event first, dedupes on TransID and always returns 200 fast.
 *   Production enqueues to pgmq; the demo processes inline.
 */
export const dynamic = "force-dynamic";

const rawEvents: { at: string; campus: string; body: unknown }[] = [];

function secretOk(campus: string, secret: string) {
  const expected = process.env[`MPESA_CALLBACK_SECRET_${campus.toUpperCase()}`] ?? `demo-${campus.toLowerCase()}`;
  return secret.length === expected.length && timingSafeEqual(Buffer.from(secret), Buffer.from(expected));
}

export async function POST(req: Request, { params }: { params: Promise<{ campus: string; secret: string; kind: string }> }) {
  const { campus, secret, kind } = await params;
  if (!secretOk(campus, secret)) return new NextResponse(null, { status: 404 });
  const allow = process.env.SAFARICOM_CALLBACK_IPS?.split(",").map((s) => s.trim()).filter(Boolean);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (allow?.length && (!ip || !allow.includes(ip))) return new NextResponse(null, { status: 403 });

  if (kind === "validation") return NextResponse.json(C2B_VALIDATION_RESPONSE);
  if (kind !== "confirmation") return new NextResponse(null, { status: 404 });

  let body: DarajaC2B;
  try {
    body = (await req.json()) as DarajaC2B;
  } catch {
    return NextResponse.json(C2B_CONFIRMATION_RESPONSE); // acknowledge; nothing to process
  }
  rawEvents.push({ at: new Date().toISOString(), campus, body }); // raw_mpesa_events, immutable
  try {
    const n = parseDarajaC2B(body);
    const s = getSchool();
    const c = s.campuses.find((x) => x.code === campus.toUpperCase()) ?? s.campuses[0];
    const term = s.terms.find((t) => t.status === "open")!;
    const hasPhone = n.msisdn && /^\d{9,12}$/.test(n.msisdn);
    const p: Payment = { id: `w${Date.now()}${Math.floor(Math.random() * 1000)}`, providerRef: n.providerRef, campusId: c.id, amount: n.amount, billRef: n.billRef, phoneLast3: hasPhone ? last3(n.msisdn!) : null, phoneHash: hasPhone ? hashMsisdn(n.msisdn!, SALT) : n.msisdn, payerName: n.payerName, paidAt: n.paidAt, channel: "c2b", matchStatus: "unmatched", matchKind: "—", confidence: null, familyId: null, learnerId: null, rule: null, split: [], credit: 0, receiptNo: null, verifyCode: null, termId: term.id, suggestions: [] };
    const result = ingest(s, p);
    return NextResponse.json({ ...C2B_CONFIRMATION_RESPONSE, shulife: { result, receipt: p.receiptNo } });
  } catch (e) {
    // Dead-letter: keep the raw event for replay, still acknowledge Safaricom.
    console.error("mpesa confirmation failed", e);
    return NextResponse.json(C2B_CONFIRMATION_RESPONSE);
  }
}
