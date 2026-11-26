import type { Metadata } from "next";
import { capabilities, formatKesShort } from "@shulife/core";
import { dashboard, getSchool, reviewQueue } from "@shulife/demo";
import { Card, Kpi, PageTitle } from "@/components/app/ui";
import { Wordmark } from "@/components/brand";
import { redirect } from "next/navigation";
import { supabaseConfigured, supabaseServer } from "@/lib/supabase";
import { isShulifeAdmin, supabaseAdmin } from "@/lib/supabase-admin";
import { formatDate, formatTime } from "@shulife/core";

/**
 * Shulife admin console (§10.4). Internal staff only (Supabase role check in production).
 * Shows school health; never payment credentials. Impersonation needs the school's consent.
 */
export const metadata: Metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Admin() {
  // With Supabase on, only Shulife admins (shulife_admins table) may open the console.
  let leads: { id: string; school_name: string; role: string; learners_band: string | null; county: string | null; phone: string; best_time: string | null; status: string; created_at: string }[] = [];
  if (supabaseConfigured()) {
    const { data } = await (await supabaseServer()).auth.getUser();
    if (!data.user || !(await isShulifeAdmin(data.user.id))) redirect("/login/");
    leads = (await supabaseAdmin()!.from("demo_requests").select("*").order("created_at", { ascending: false }).limit(100)).data ?? [];
  }
  const s = getSchool();
  const d = dashboard(s);
  const caps = capabilities("active");
  const schools = [{ name: s.org.name, campuses: s.campuses.length, learners: s.learners.length, auto: d.autoMatchRate, queue: reviewQueue(s).length, sub: "trial", webhookFailures: 0, messageFailures: 14, consent: false }];
  return (
    <div className="min-h-screen bg-cream-50">
      <header className="flex items-center justify-between bg-navy-950 px-6 py-4 text-cream-50">
        <div className="flex items-center gap-3">
          <Wordmark tone="cream" size="sm" />
          <span className="rounded-full bg-gold-400 px-2 py-0.5 text-xs font-bold text-navy-950">Admin</span>
        </div>
        <span className="text-xs text-cream-100/60">Internal · every action audited</span>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <PageTitle title="Schools" sub="Health at a glance" />
        <div className="mb-6 grid gap-3 sm:grid-cols-4">
          <Kpi label="Schools" value={schools.length} />
          <Kpi label="Learners" value={s.learners.length} />
          <Kpi label="Collected this term" value={`KSh ${formatKesShort(d.collected)}`} />
          <Kpi label="Auto-match (north star)" value={`${d.autoMatchRate}%`} hint="Target ≥ 90% by second term" />
        </div>
        <Card className="!p-0 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream-100 text-xs uppercase tracking-wider text-ink-600">
              <tr>
                {["School", "Learners", "Auto-match", "Review queue", "Webhook failures", "Message failures", "Subscription", "Support access"].map((h) => (
                  <th key={h} className="px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schools.map((x) => (
                <tr key={x.name} className="border-t border-cream-200">
                  <td className="px-4 py-3 font-semibold text-navy-900">{x.name} <span className="font-normal text-ink-600">· {x.campuses} campuses</span></td>
                  <td className="px-4 py-3">{x.learners}</td>
                  <td className="px-4 py-3">{x.auto}%</td>
                  <td className="px-4 py-3">{x.queue}</td>
                  <td className="px-4 py-3">{x.webhookFailures}</td>
                  <td className="px-4 py-3">{x.messageFailures}</td>
                  <td className="px-4 py-3 capitalize">{x.sub}</td>
                  <td className="px-4 py-3 text-ink-600">{x.consent ? "Granted (expires in 2h)" : "Not granted by school"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Card title={`Demo bookings (${leads.length})`}>
            {leads.length === 0 ? (
              <p className="text-sm text-ink-600">{supabaseConfigured() ? "No bookings yet. Requests from /book-demo appear here." : "Connect Supabase to collect bookings from /book-demo."}</p>
            ) : (
              <ul className="divide-y divide-cream-200 text-sm">
                {leads.map((l) => (
                  <li key={l.id} className="py-2.5">
                    <div className="flex justify-between gap-2">
                      <span className="font-semibold text-navy-900">{l.school_name}</span>
                      <span className="rounded-full bg-cream-100 px-2 text-xs font-semibold capitalize text-navy-900">{l.status.replace("_", " ")}</span>
                    </div>
                    <p className="text-ink-600">
                      {l.role} · {l.learners_band ?? "?"} learners · {l.county ?? "—"} · 0{l.phone.slice(3)} · {l.best_time ?? ""} · {formatDate(new Date(l.created_at))} {formatTime(new Date(l.created_at))}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Always on">
            <p className="text-sm text-ink-600">Whatever a school’s subscription state, these keep running: payment matching ({String(caps.paymentIngestion)}), receipts ({String(caps.receipts)}) and parent balances ({String(caps.parentBalances)}).</p>
          </Card>
        </div>
      </main>
    </div>
  );
}
