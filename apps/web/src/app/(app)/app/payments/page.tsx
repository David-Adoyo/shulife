import { redirect } from "next/navigation";
import { school } from "@/lib/db";
import { cashUp, formatDate, formatTime, isoDateNairobi } from "@shulife/core";
import { currentTerm } from "@shulife/demo";
import { Card, KSh, Kpi, MatchBadge, PageTitle, Pill, SplitBar } from "@/components/app/ui";
import { can, getSession } from "@/lib/session";

export const metadata = { title: "Payments" };

const CHANNELS = [
  ["all", "All"],
  ["c2b", "M-Pesa"],
  ["bank_import", "Bank"],
  ["manual", "Cash & cheques"],
] as const;

export default async function Payments({ searchParams }: { searchParams: Promise<{ channel?: string }> }) {
  const session = await getSession();
  if (!can.seeMoney(session.role)) redirect("/app/clearance/");
  const { channel = "all" } = await searchParams;
  const s = await school();
  const term = currentTerm(s);
  const all = s.payments.filter((p) => p.termId === term.id && (!session.campusId || p.campusId === session.campusId));
  const list = all
    .filter((p) => channel === "all" || (channel === "manual" ? ["cash", "cheque", "bank_slip"].includes(p.channel) : p.channel === channel))
    .sort((a, b) => b.paidAt.localeCompare(a.paidAt))
    .slice(0, 80);
  const manual = all.filter((p) => ["cash", "cheque", "bank_slip"].includes(p.channel)).map((p) => ({ id: p.id, receiverId: p.receivedBy ?? "Front office", channel: p.channel as "cash" | "cheque" | "bank_slip", amount: p.amount, receivedOn: isoDateNairobi(new Date(p.paidAt)), bankedDepositId: p.banked ? "D" : null, hasPhoto: true }));
  const today = isoDateNairobi(new Date(s.today));
  const cu = cashUp(manual, today);
  const unbanked = manual.filter((m) => !m.bankedDepositId);

  return (
    <>
      <PageTitle title="Payments" sub={`${term.name} · every payment lands in the school’s own account`} />
      <div className="mb-5 grid gap-3 sm:grid-cols-4">
        <Kpi label="This term" value={all.filter((p) => p.familyId).length} hint="payments matched" />
        <Kpi label="Bank imports" value={all.filter((p) => p.channel === "bank_import").length} hint="same matching as M-Pesa" />
        <Kpi label="Today’s cash-up" value={<KSh cents={cu.total} />} hint={`${cu.count} manual receipts`} />
        <Kpi tone={unbanked.length ? "navy" : "light"} label="Not yet banked" value={unbanked.length} hint="alert after 2 days" />
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {CHANNELS.map(([id, label]) => (
          <a key={id} href={`?channel=${id}`} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${channel === id ? "bg-navy-900 text-cream-50" : "bg-white ring-1 ring-cream-200"}`}>
            {label}
          </a>
        ))}
      </div>
      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream-100 text-xs uppercase tracking-wider text-ink-600">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Payer · reference</th>
                <th className="px-4 py-3">Family and split</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Match</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              {list.map((p) => {
                const fam = s.families.find((f) => f.id === p.familyId);
                return (
                  <tr key={p.id} className="align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-ink-600">
                      {formatDate(new Date(p.paidAt))}
                      <span className="block text-xs">{formatTime(new Date(p.paidAt))}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-navy-900">{p.phoneLast3 ? `07•• ••• ${p.phoneLast3}` : p.channel === "bank_import" ? "Bank transfer" : `${p.channel} · ${p.bookRef}`}</span>
                      <span className="block font-mono text-xs text-ink-600">“{p.billRef ?? ""}”</span>
                    </td>
                    <td className="min-w-56 px-4 py-3">
                      {fam ? (
                        <>
                          <a href={`/app/families/${fam.id}/`} className="font-semibold text-navy-900 hover:underline">
                            {fam.displayName}
                          </a>
                          <div className="mt-1">
                            <SplitBar parts={p.split.map((x) => ({ name: x.name, amount: x.amount }))} credit={p.credit} />
                          </div>
                        </>
                      ) : p.matchStatus === "not_ours" ? (
                        <span className="text-ink-600">Not ours</span>
                      ) : (
                        <a href="/app/review/" className="font-semibold text-due">
                          Waiting for review
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <KSh cents={p.amount} className="text-navy-900" />
                      {p.receiptNo && <span className="block text-xs text-ink-600">{p.receiptNo}</span>}
                    </td>
                    <td className="px-4 py-3">{p.matchStatus === "reversed" ? <Pill kind="not_cleared" label="Reversed" /> : <MatchBadge kind={p.matchKind} />}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="mt-3 text-xs text-ink-600">Payments are never edited or deleted. Corrections are reversals and new allocations, fully audited.</p>
    </>
  );
}
