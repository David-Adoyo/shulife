import { resolveReview, reviewQueue } from "@shulife/demo";
import { persistResolution } from "@shulife/db";
import { mobileUser, unauthorised } from "@/lib/mobile-auth";
import { withDb, school, writeStep } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await mobileUser(req))) return unauthorised();
  const s = await school();
  return Response.json(
    reviewQueue(s).slice(0, 30).map((p) => ({
      id: p.id,
      amount: p.amount,
      at: p.paidAt,
      billRef: p.billRef,
      payer: p.phoneLast3 ? `07•• ••• ${p.phoneLast3}` : "Bank",
      suggestions: p.suggestions.map((sg) => ({ familyId: sg.familyId, family: s.families.find((f) => f.id === sg.familyId)?.displayName, code: s.families.find((f) => f.id === sg.familyId)?.code, score: sg.score, reasons: sg.reasons })),
    })),
  );
}

export async function POST(req: Request) {
  const user = await mobileUser(req);
  if (!user) return unauthorised();
  const { paymentId, familyId, notOurs } = (await req.json()) as { paymentId: string; familyId?: string; notOurs?: boolean };
  try {
    const result = await writeStep(async (s) => {
      const n = s.ledger.length;
      const p = resolveReview(s, paymentId, notOurs ? { notOurs: true } : { familyId: familyId! });
      const entries = s.ledger.slice(n);
      await withDb((c) => persistResolution(c, s, p, entries));
      return { receipt: p.receiptNo, split: p.split };
    });
    return Response.json(result);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 409 });
  }
}
