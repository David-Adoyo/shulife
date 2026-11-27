import { redirect } from "next/navigation";
import { school } from "@/lib/db";
import { formatDate, formatKesShort, formatTime } from "@shulife/core";
import { dashboard } from "@shulife/demo";
import { Card, CollectionRing, KSh, Kpi, MatchBadge, PageTitle, heatClass } from "@/components/app/ui";
import { Ripple } from "@/components/brand";
import { Icon } from "@/components/icons";
import { can, getSession } from "@/lib/session";

export const metadata = { title: "Dashboard" };

export default async function Dashboard() {
  const session = await getSession();
  if (!can.seeMoney(session.role)) redirect("/app/clearance/");
  const s = await school();
  const d = dashboard(s, session.campusId);
  const maxDay = Math.max(1, ...d.projection.days.map((x) => x.high));

  return (
    <>
      <PageTitle title={`Good morning, ${session.name.split(" ")[0]}`} sub={`${formatDate(new Date(s.today))} · ${d.term.name}`} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.25fr_1fr]">
        <Card className="flex flex-col items-center gap-8 sm:flex-row">
          <CollectionRing pct={d.pct}>
            <span className="font-display text-4xl text-navy-900">{d.pct}%</span>
            <span className="text-xs text-ink-600">collected</span>
          </CollectionRing>
          <div className="w-full">
            <p className="text-sm text-ink-600">Term collection</p>
            <p className="font-display text-3xl text-navy-900">
              KSh {formatKesShort(d.collected)} <span className="text-lg text-ink-600">of {formatKesShort(d.billed)}</span>
            </p>
            <p className="mt-1 text-sm text-ink-600">{d.term.name}</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Kpi label="Collected today" value={<KSh cents={d.collectedToday} />} hint={`${d.paymentsToday} payments`} />
              <Kpi label="Matched automatically" value={`${d.autoMatchRate}%`} hint={`${d.duplicatesIgnored} duplicate callbacks ignored`} />
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Kpi tone="navy" label="Outstanding" value={`KSh ${formatKesShort(d.outstanding)}`} hint="This term and earlier" />
          <Kpi label="On payment plans" value={`KSh ${formatKesShort(d.onPlans)}`} hint={`${d.planCount} families`} />
          <Card className="col-span-2" title="Needs attention">
            <ul className="divide-y divide-cream-200 text-sm">
              {[
                { show: can.review(session.role), label: "Payments to review", n: d.attention.review, href: "/app/review/" },
                { show: true, label: `Unbanked cash and cheques (KSh ${formatKesShort(d.attention.unbankedAmount)})`, n: d.attention.unbanked, href: "/app/payments/?channel=manual" },
                { show: true, label: "Split change requests", n: d.attention.changeRequests, href: "/app/payments/" },
                { show: true, label: "Unread parent messages", n: d.attention.unreadMessages, href: "/app/notices/#inbox" },
              ]
                .filter((x) => x.show)
                .map((x) => (
                  <li key={x.label}>
                    <a href={x.href} className="flex items-center justify-between gap-3 py-2.5 hover:text-navy-700">
                      <span className="text-navy-900">{x.label}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${x.n ? "bg-gold-200 text-navy-900" : "bg-cream-100 text-ink-400"}`}>{x.n}</span>
                    </a>
                  </li>
                ))}
              {d.attention.nextEvent && (
                <li className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-navy-900">Next clearance: {d.attention.nextEvent.name}</span>
                  <span className="text-xs text-ink-600">{formatDate(new Date(d.attention.nextEvent.date))}</span>
                </li>
              )}
            </ul>
          </Card>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.25fr_1fr]">
        <Card title="Class heatmap · % of this term collected" action={<span className="text-xs text-ink-600">Cleared count for the next exam in brackets</span>}>
          <div className="no-scrollbar overflow-x-auto">
            <table className="w-full border-separate border-spacing-1 text-center text-xs tabular">
              <tbody>
                {d.heat.map((h) => (
                  <tr key={h.gradeCode}>
                    <th className="w-20 pr-2 text-left font-semibold text-navy-900">{h.gradeName}</th>
                    {h.streams.map((st) => (
                      <td key={st.streamId} className={`h-12 min-w-20 rounded-lg px-2 ${heatClass(st.pct)}`} title={`${h.gradeName} ${st.name}: ${st.pct}% collected, ${st.learners} learners`}>
                        <span className="block text-[0.65rem] opacity-80">{st.name}</span>
                        <span className="text-sm font-bold">{st.pct}%</span>
                        <span className="block text-[0.6rem] opacity-80">
                          {st.learners} · ({st.cleared})
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid gap-5">
          <Card title="Live payments" action={<span className="relative inline-flex size-2.5 rounded-full bg-paid"><span className="absolute inset-0 animate-ping rounded-full bg-paid" /></span>}>
            <ul className="divide-y divide-cream-200">
              {d.feed.map((p, i) => (
                <li key={p.id} className="flex items-center gap-3 py-2.5">
                  <span className="relative inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-navy-900 text-gold-300">
                    {i === 0 && <Ripple className="rounded-full" />}
                    <Icon.Receipt className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <a href={`/app/families/${p.familyId}/`} className="block truncate text-sm font-semibold text-navy-900 hover:underline">
                      {p.familyName}
                    </a>
                    <p className="truncate text-xs text-ink-600">
                      {formatTime(new Date(p.at))} · {p.payer} · {p.learners.join(", ")}
                      {p.split.length > 1 ? " · split" : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <KSh cents={p.amount} className="text-sm text-navy-900" />
                    <div>
                      <MatchBadge kind={p.badge} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Cash projected · next 30 days" action={<span className="font-display text-xl text-navy-900">KSh {formatKesShort(d.projection.total)}</span>}>
            <div className="flex h-28 items-end gap-[3px]" role="img" aria-label="Projected daily inflows for the next 30 days">
              {d.projection.days.map((x) => (
                <div key={x.date} className="relative flex-1" style={{ height: `${(x.high / maxDay) * 100}%` }} title={`${x.date}: KSh ${formatKesShort(x.expected)}`}>
                  <div className="absolute inset-x-0 bottom-0 rounded-t-sm bg-gold-200" style={{ height: "100%" }} />
                  <div className="absolute inset-x-0 bottom-0 rounded-t-sm bg-gold-500" style={{ height: `${(x.expected / Math.max(1, x.high)) * 100}%` }} />
                </div>
              ))}
            </div>
            {d.projection.notes.map((n) => (
              <p key={n} className="mt-3 text-sm text-ink-600">
                {n}
              </p>
            ))}
          </Card>
        </div>
      </div>

      <Card className="mt-5" title="Largest balances" action={<a href="/app/families/?filter=balance" className="text-sm font-semibold text-navy-900 underline decoration-gold-500 underline-offset-4">All families with a balance</a>}>
        <p className="mb-3 text-xs text-ink-600">Internal only — never shared outside the bursar and director roles.</p>
        <ul className="grid gap-2 sm:grid-cols-5">
          {d.topBalances.map((t) => (
            <li key={t.family.id}>
              <a href={`/app/families/${t.family.id}/`} className="block rounded-xl bg-cream-50 p-3 hover:bg-cream-100">
                <p className="truncate text-sm font-semibold text-navy-900">{t.family.displayName}</p>
                <KSh cents={t.balance} className="text-sm text-due" />
              </a>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
