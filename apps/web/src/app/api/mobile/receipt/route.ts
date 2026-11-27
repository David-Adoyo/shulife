import { kes } from "@shulife/core";
import { ingest, type Payment } from "@shulife/demo";
import { persistIngest } from "@shulife/db";
import { mobileUser, unauthorised } from "@/lib/mobile-auth";
import { withDb, school, writeStep } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Manual receipt from the bursar's phone. `clientId` makes retries safe: the app queues
 * receipts captured offline and replays them, and the same clientId is never recorded twice.
 */
export async function POST(req: Request) {
  const user = await mobileUser(req);
  if (!user) return unauthorised();
  const b = (await req.json()) as { clientId: string; familyCode: string; amount: string; channel: "cash" | "cheque" | "bank_slip"; bookRef: string; photo?: string; capturedAt?: string };
  if (!b.clientId || !b.bookRef || !b.photo) return Response.json({ error: "Amount, receipt-book number and a photo are required" }, { status: 400 });
  const known = (await school(user.orgId)).families.some((f) => f.code.toUpperCase() === b.familyCode.trim().toUpperCase());
  if (!known) return Response.json({ error: `No family with code ${b.familyCode}` }, { status: 404 });
  const result = await writeStep(async (s) => {
    const fam = s.families.find((f) => f.code.toUpperCase() === b.familyCode.trim().toUpperCase())!;
    const providerRef = `${b.channel.toUpperCase()}-${b.clientId}`;
    if (s.payments.some((p) => p.providerRef === providerRef)) return { duplicate: true, receipt: s.payments.find((p) => p.providerRef === providerRef)!.receiptNo };
    const p: Payment = { id: crypto.randomUUID(), providerRef, campusId: fam.campusId, amount: kes(b.amount), billRef: null, phoneLast3: null, phoneHash: null, payerName: null, paidAt: b.capturedAt ?? (process.env.SHULIFE_TODAY === "now" ? new Date().toISOString() : s.today), channel: b.channel, matchStatus: "unmatched", matchKind: "—", confidence: null, familyId: null, learnerId: null, rule: null, split: [], credit: 0, receiptNo: null, verifyCode: null, termId: s.terms.find((t) => t.status === "open")!.id, suggestions: [], bookRef: b.bookRef, receivedBy: user.name, banked: false };
    const n = s.ledger.length;
    ingest(s, p, { manualFamilyId: fam.id });
    const entries = s.ledger.slice(n);
    await withDb((c) => persistIngest(c, s, p, entries));
    return { duplicate: false, receipt: p.receiptNo, family: fam.displayName, split: p.split };
  });
  return Response.json(result);
}
