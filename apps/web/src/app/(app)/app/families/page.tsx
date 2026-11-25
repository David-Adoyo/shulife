import { redirect } from "next/navigation";
import { gradeName } from "@shulife/core";
import { families, getSchool, termPosition } from "@shulife/demo";
import { Card, Empty, KSh, PageTitle, Pill, balancePill } from "@/components/app/ui";
import { Icon } from "@/components/icons";
import { can, getSession } from "@/lib/session";

export const metadata = { title: "Families" };

const FILTERS = [
  ["all", "All"],
  ["balance", "With a balance"],
  ["paid", "Fully paid"],
  ["plan", "On a plan"],
] as const;

export default async function Families({ searchParams }: { searchParams: Promise<{ q?: string; filter?: string; page?: string }> }) {
  const session = await getSession();
  if (!can.seeMoney(session.role)) redirect("/app/clearance/");
  const { q = "", filter = "all", page = "1" } = await searchParams;
  const s = getSchool();
  const list = families(s, q, session.campusId, filter as (typeof FILTERS)[number][0]);
  const per = 30;
  const p = Math.max(1, Number(page));
  const rows = list.slice((p - 1) * per, p * per);
  const qs = (extra: Record<string, string>) => "?" + new URLSearchParams({ q, filter, ...extra }).toString();

  return (
    <>
      <PageTitle title="Families" sub={`${list.length} families${q ? ` matching “${q}”` : ""}`} />
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Search by learner, admission number, family code or phone" className="h-11 min-w-0 flex-1 rounded-xl border border-cream-200 bg-white px-4" />
        <input type="hidden" name="filter" value={filter} />
        <button className="h-11 rounded-xl bg-navy-900 px-5 font-semibold text-cream-50">Search</button>
      </form>
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map(([id, label]) => (
          <a key={id} href={qs({ filter: id, page: "1" })} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${filter === id ? "bg-navy-900 text-cream-50" : "bg-white text-navy-900 ring-1 ring-cream-200"}`}>
            {label}
          </a>
        ))}
      </div>

      {rows.length === 0 ? (
        <Empty title="No families found" body="Try a learner’s name, an admission number like 2041, a family code like FAM-2041, or the last digits of a phone number." icon={Icon.Users} />
      ) : (
        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-cream-100 text-xs uppercase tracking-wider text-ink-600">
                <tr>
                  <th className="px-4 py-3">Family</th>
                  <th className="px-4 py-3">Children</th>
                  <th className="px-4 py-3">Guardian</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {rows.map((f) => {
                  const billed = f.kids.reduce((a, k) => a + termPosition(s, k.id).billed, 0);
                  return (
                    <tr key={f.family.id} className="hover:bg-cream-50">
                      <td className="px-4 py-3">
                        <a href={`/app/families/${f.family.id}/`} className="font-semibold text-navy-900 hover:underline">
                          {f.family.displayName}
                        </a>
                        <p className="text-xs text-ink-600">{f.family.code}</p>
                      </td>
                      <td className="px-4 py-3 text-ink-600">
                        {f.kids.map((k) => (
                          <span key={k.id} className="block">
                            {k.firstName} · {gradeName(k.gradeCode)} · {k.admissionNumber}
                          </span>
                        ))}
                      </td>
                      <td className="px-4 py-3 text-ink-600">{f.guardians[0]?.name}</td>
                      <td className="px-4 py-3 text-right">
                        <KSh cents={f.balance} className={f.balance > 0 ? "text-navy-900" : "text-paid"} />
                      </td>
                      <td className="px-4 py-3">{f.plan?.status === "active" ? <Pill kind="on_plan" /> : <Pill kind={balancePill(f.balance, billed)} />}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-cream-200 px-4 py-3 text-sm">
            <span className="text-ink-600">
              Page {p} of {Math.max(1, Math.ceil(list.length / per))}
            </span>
            <div className="flex gap-2">
              {p > 1 && (
                <a className="rounded-lg px-3 py-1 ring-1 ring-cream-200" href={qs({ page: String(p - 1) })}>
                  Previous
                </a>
              )}
              {p * per < list.length && (
                <a className="rounded-lg px-3 py-1 ring-1 ring-cream-200" href={qs({ page: String(p + 1) })}>
                  Next
                </a>
              )}
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
