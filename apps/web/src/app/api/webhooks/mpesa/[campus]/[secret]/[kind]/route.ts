import { NextResponse } from "next/server";
import { C2B_CONFIRMATION_RESPONSE, C2B_VALIDATION_RESPONSE, hashMsisdn, last3, parseDarajaC2B, type DarajaC2B } from "@shulife/core";
import { ingest, SALT, type Payment } from "@shulife/demo";
import { timingSafeEqual } from "node:crypto";
import { persistIngest, saveRawEvent } from "@shulife/db";
import { campusForCallback, demoOrgId, getPool, reloadFromDb, serial, UUID_RE, withDb, writeStep } from "@/lib/db";

/**
 * Safaricom Daraja C2B callbacks (§7.2): /api/webhooks/mpesa/{campus}/{secret}/{validation|confirmation}
 * - The secret path is per campus (stored in payment_integrations.callback_secret).
 * - Validation accepts all payments; never reject a parent's money.
 * - Confirmation stores the raw event first, dedupes on TransID and always returns 200 fast.
 *   Production enqueues to pgmq; the demo processes inline.
 */
export const dynamic = "force-dynamic";

const rawEvents: { at: string; campus: string; body: unknown }[] = [];

/** The demo school's campuses use a code and a secret from the environment. */
function demoSecretOk(campus: string, secret: string) {
  const expected = process.env[`MPESA_CALLBACK_SECRET_${campus.toUpperCase()}`] ?? `demo-${campus.toLowerCase()}`;
  return secret.length === expected.length && timingSafeEqual(Buffer.from(secret), Buffer.from(expected));
}

/** Which school and campus this callback is for: a real school's campus id and secret, or the demo. */
async function target(campus: string, secret: string): Promise<{ org: string | null; campusId: string | null; code: string } | null> {
  if (UUID_RE.test(campus)) {
    const hit = await campusForCallback(campus, secret);
    return hit ? { org: hit.org, campusId: hit.campusId, code: "" } : null;
  }
  if (!demoSecretOk(campus, secret)) return null;
  return { org: getPool() ? await demoOrgId() : null, campusId: null, code: campus.toUpperCase() };
}

export async function POST(req: Request, { params }: { params: Promise<{ campus: string; secret: string; kind: string }> }) {
  const { campus, secret, kind } = await params;
  const t = await target(campus, secret);
  if (!t || (getPool() && !t.org)) return new NextResponse(null, { status: 404 });
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
  // raw_mpesa_events first (immutable), so nothing is lost even if processing fails.
  const org = t.org;
  if (org) await withDb((c) => saveRawEvent(c, org, "c2b_confirmation", body, { campus }));
  else rawEvents.push({ at: new Date().toISOString(), campus, body });
  try {
    const n = parseDarajaC2B(body);
    let p!: Payment;
    const result = await writeStep(async (s) => {
      const c = s.campuses.find((x) => x.id === t.campusId || x.code === t.code) ?? s.campuses[0];
      const term = s.terms.find((t) => t.status === "open")!;
      const hasPhone = n.msisdn && /^\d{9,12}$/.test(n.msisdn);
      p = { id: crypto.randomUUID(), providerRef: n.providerRef, campusId: c.id, amount: n.amount, billRef: n.billRef, phoneLast3: hasPhone ? last3(n.msisdn!) : null, phoneHash: hasPhone ? hashMsisdn(n.msisdn!, SALT) : n.msisdn, payerName: n.payerName, paidAt: n.paidAt, channel: "c2b", matchStatus: "unmatched", matchKind: "—", confidence: null, familyId: null, learnerId: null, rule: null, split: [], credit: 0, receiptNo: null, verifyCode: null, termId: term.id, suggestions: [] };
      const before = s.ledger.length;
      let r: string = ingest(s, p);
      const entries = s.ledger.slice(before); // capture now, before any await
      if (r !== "duplicate") {
        const saved = await withDb((db) => persistIngest(db, s, p, entries));
        if (saved === "duplicate") r = "duplicate"; // another server already took it
      }
      return r;
    }, org);
    return NextResponse.json({ ...C2B_CONFIRMATION_RESPONSE, shulife: { result, receipt: p.receiptNo } });
  } catch (e) {
    // Dead-letter: keep the raw event for replay, still acknowledge Safaricom.
    console.error("mpesa confirmation failed", e);
    if (org) await serial(() => reloadFromDb(org)).catch((err) => console.error("reload failed", err));
    return NextResponse.json(C2B_CONFIRMATION_RESPONSE);
  }
}
