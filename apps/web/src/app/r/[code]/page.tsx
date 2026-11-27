import type { Metadata } from "next";
import { schoolForReceipt } from "@/lib/db";
import { formatDate, formatKes } from "@shulife/core";
import { verifyReceipt } from "@shulife/demo";
import { Wordmark } from "@/components/brand";
import { Icon } from "@/components/icons";

/** Public receipt check behind the QR code (§7.5): school, number, amount, date and status only. */
export const metadata: Metadata = { title: "Verify a receipt", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function VerifyReceipt({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const sch = await schoolForReceipt(code);
  const r = sch ? verifyReceipt(sch, code) : null;
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream-50 p-5">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-lift">
        {r ? (
          <>
            <span className={`mx-auto inline-flex size-16 items-center justify-center rounded-full ${r.status === "Valid" ? "bg-paid/10 text-paid" : "bg-due/10 text-due"}`}>
              <Icon.Check className="size-8" strokeWidth={2.4} />
            </span>
            <p className="mt-4 text-sm font-bold uppercase tracking-widest text-paid">{r.status}</p>
            <p className="mt-2 font-display text-4xl text-navy-900">{formatKes(r.amount)}</p>
            <dl className="mt-6 space-y-2 text-left text-sm">
              <div className="flex justify-between"><dt className="text-ink-600">School</dt><dd className="font-semibold text-navy-900">{r.school}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-600">Receipt</dt><dd className="font-mono text-navy-900">{r.receipt}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-600">Date</dt><dd className="text-navy-900">{formatDate(new Date(r.date))}</dd></div>
            </dl>
          </>
        ) : (
          <>
            <p className="font-display text-3xl text-navy-900">Receipt not found</p>
            <p className="mt-2 text-ink-600">Check the code, or contact the school that issued it.</p>
          </>
        )}
        <div className="mt-8 flex justify-center"><Wordmark size="sm" /></div>
      </div>
    </main>
  );
}
