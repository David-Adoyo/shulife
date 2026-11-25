import { redirect } from "next/navigation";
import { gradeName, formatKes } from "@shulife/core";
import { feeMatrix, getSchool } from "@shulife/demo";
import { Card, KSh, PageTitle } from "@/components/app/ui";
import { can, getSession } from "@/lib/session";

export const metadata = { title: "Fees" };

export default async function Fees({ searchParams }: { searchParams: Promise<{ term?: string; col?: string }> }) {
  const session = await getSession();
  if (!can.seeMoney(session.role)) redirect("/app/clearance/");
  const { term: termId, col = "day" } = await searchParams;
  const s = getSchool();
  const term = s.terms.find((t) => t.id === termId) ?? s.terms.find((t) => t.status === "open")!;
  const m = feeMatrix(s, term.id);
  const column = col === "boarder" ? "boarder" : "day";

  return (
    <>
      <PageTitle
        title="Fee structure"
        sub={`${term.name} · published · visible to parents in the portal`}
        action={
          <div className="flex gap-2">
            {s.terms.map((t) => (
              <a key={t.id} href={`?term=${t.id}&col=${column}`} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${t.id === term.id ? "bg-navy-900 text-cream-50" : "bg-white ring-1 ring-cream-200"}`}>
                {t.name}
              </a>
            ))}
          </div>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-full bg-white p-1 ring-1 ring-cream-200">
          {(["day", "boarder"] as const).map((c) => (
            <a key={c} href={`?term=${term.id}&col=${c}`} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${column === c ? "bg-navy-900 text-cream-50" : "text-navy-900"}`}>
              {c === "day" ? "Day scholars" : "Boarders"}
            </a>
          ))}
        </div>
        {m.changed.size > 0 && (
          <span className="inline-flex items-center gap-2 text-sm text-ink-600">
            <span className="size-3 rounded bg-gold-200 ring-1 ring-gold-400" /> Changed since last term (+6% uplift, rounded to KSh 50)
          </span>
        )}
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full border-collapse text-sm tabular">
            <thead className="sticky top-0 z-10 bg-navy-900 text-cream-50">
              <tr>
                <th className="sticky left-0 bg-navy-900 px-4 py-3 text-left">Grade</th>
                {m.items.map((i) => (
                  <th key={i.id} className="px-4 py-3 text-right font-semibold">
                    {i.name}
                    <span className="block text-[0.65rem] font-normal text-cream-100/60">{i.kind === "optional" ? "optional" : "mandatory"}</span>
                  </th>
                ))}
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {m.grades.map((g) => {
                const total = m.items.filter((i) => i.kind === "mandatory").reduce((a, i) => a + m.cell(g, i.id, column), 0);
                return (
                  <tr key={g} className="border-b border-cream-200">
                    <th className="sticky left-0 bg-white px-4 py-2.5 text-left font-semibold text-navy-900">{gradeName(g)}</th>
                    {m.items.map((i) => {
                      const v = m.cell(g, i.id, column);
                      return (
                        <td key={i.id} className={`px-4 py-2.5 text-right ${m.changed.has(`${g}|${i.id}`) && v ? "bg-gold-200/50" : ""}`} tabIndex={0}>
                          {v ? formatKes(v, { prefix: false }) : <span className="text-ink-400">—</span>}
                        </td>
                      );
                    })}
                    <td className="px-4 py-2.5 text-right font-semibold text-navy-900">
                      <KSh cents={total} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card title="Transport routes">
          <ul className="divide-y divide-cream-200 text-sm">
            {m.routes.map((r) => (
              <li key={r.id} className="flex justify-between py-2.5">
                <span className="text-navy-900">{r.name}</span>
                <KSh cents={r.amount} className="text-navy-900" />
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Discounts and sponsors">
          <ul className="space-y-2 text-sm text-navy-900">
            <li>Sibling discount: 10% off tuition from the third child</li>
            <li>Staff children: 50% off tuition</li>
            <li>{s.sponsor.name}: 50% of tuition for 4 learners</li>
          </ul>
          <p className="mt-3 text-xs text-ink-600">Applied in order — sponsorship, sibling, staff, then approved waivers — each as its own statement line.</p>
        </Card>
      </div>
      {can.editFees(session.role) && (
        <p className="mt-4 text-sm text-ink-600">To change fees, copy this structure to a new version with an uplift, review the differences, then approve and publish. Published structures can’t be edited.</p>
      )}
    </>
  );
}
