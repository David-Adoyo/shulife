import { familyBalance } from "@shulife/demo";
import { school } from "@/lib/db";
import { receiptPdf } from "@/lib/pdf";

export const dynamic = "force-dynamic";

/** Receipt PDF, reached from the parent's message or portal by its unguessable verify code. */
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const s = await school();
  const p = s.payments.find((x) => x.verifyCode === code && x.receiptNo);
  if (!p) return new Response("Not found", { status: 404 });
  const fam = s.families.find((f) => f.id === p.familyId)!;
  const campus = s.campuses.find((c) => c.id === p.campusId)!;
  const origin = new URL(req.url).origin;
  const pdf = await receiptPdf({
    school: s.org.name,
    campus: campus.name,
    number: p.receiptNo!,
    paidAt: p.paidAt,
    amount: p.amount,
    channel: p.channel === "c2b" ? "M-Pesa Paybill" : p.channel === "bank_import" ? "Bank transfer" : p.channel.replace("_", " "),
    payer: p.payerName ?? "the family",
    family: fam.displayName,
    split: p.split,
    credit: p.credit,
    balanceAfter: familyBalance(s, fam.id),
    verifyUrl: `${origin}/r/${code}/`,
    reversed: p.matchStatus === "reversed",
  });
  return new Response(new Uint8Array(pdf), { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="${p.receiptNo}.pdf"` } });
}
