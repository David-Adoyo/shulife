import { redirect } from "next/navigation";
import { school } from "@/lib/db";
import { formatKesShort } from "@shulife/core";
import { reports } from "@shulife/demo";
import { Card, KSh, PageTitle } from "@/components/app/ui";
import { can, getSession } from "@/lib/session";

export const metadata = { title: "Reports" };

const CHANNEL: Record<string, string> = { c2b: "M-Pesa Paybill", bank_import: "Bank import", cash: "Cash", cheque: "Cheque", bank_slip: "Bank slip", stk: "M-Pesa prompt" };

export default async function Reports() {
  const session = await getSession();
  if (!can.reports(session.role)) redirect("/app/");
  const s = await school();
  const r = reports(s, session.campusId);
  const max = Math.max(...r.byGrade.map((g) => g.billed));

  return (
    <>
      <PageTitle title="Reports" sub={`${r.dashboard.term.name} · export any report as PDF or CSV`} action={<a href="/api/reports/collection.csv" className="rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-cream-50">Download CSV</a>} />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card title="Collection by grade">
          <ul className="space-y-3">
            {r.byGrade.map((g) => (
              <li key={g.grade}>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-navy-900">
                    {g.grade} <span className="font-normal text-ink-600">· {g.learners} learners</span>
                  </span>
                  <span className="text-ink-600">
                    KSh {formatKesShort(g.paid)} of {formatKesShort(g.billed)} · <b className="text-navy-900">{g.pct}%</b>
                  </span>
                </div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-navy-100" style={{ width: `${(g.billed / max) * 100}%` }}>
                  <div className="h-full rounded-full bg-navy-900" style={{ width: `${g.pct}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <div className="space-y-5">
          <Card title="Fee items (voteheads)">
            <table className="w-full text-sm tabular">
              <thead className="text-xs uppercase text-ink-600">
                <tr>
                  <th className="py-2 text-left">Item</th>
                  <th className="py-2 text-right">Billed</th>
                  <th className="py-2 text-right">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {r.byItem.map((i) => (
                  <tr key={i.name}>
                    <td className="py-2 text-navy-900">{i.name}</td>
                    <td className="py-2 text-right">
                      <KSh cents={i.billed} strong={false} />
                    </td>
                    <td className="py-2 text-right">
                      <KSh cents={i.outstanding} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card title="How parents paid">
            <ul className="divide-y divide-cream-200 text-sm">
              {r.channels.map((c) => (
                <li key={c.channel} className="flex justify-between py-2">
                  <span className="text-navy-900">
                    {CHANNEL[c.channel] ?? c.channel} <span className="text-ink-600">· {c.count}</span>
                  </span>
                  <KSh cents={c.amount} />
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Payment plans">
            <p className="text-sm text-ink-600">
              {r.plans.filter((p) => p.status === "active").length} on track · {r.plans.filter((p) => p.status === "broken").length} behind ·{" "}
              <KSh cents={r.plans.reduce((a, p) => a + p.total, 0)} strong={false} /> agreed
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
