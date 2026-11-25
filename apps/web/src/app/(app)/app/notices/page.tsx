import { redirect } from "next/navigation";
import { formatDate, gradeName } from "@shulife/core";
import { getSchool } from "@shulife/demo";
import { Card, PageTitle } from "@/components/app/ui";
import { NoticeComposer } from "@/components/app/notice-composer";
import { can, getSession } from "@/lib/session";

export const metadata = { title: "Notices" };

export default async function Notices() {
  const session = await getSession();
  if (!can.sendNotice(session.role)) redirect("/app/");
  const s = getSchool();
  const teacher = session.role === "class_teacher";
  const streams = s.streams.filter((st) => !teacher || session.streamIds.includes(st.id));

  return (
    <>
      <PageTitle title="Notices" sub="The right notice, to exactly the right parents — with read receipts" />
      <NoticeComposer
        school={s.org.name}
        grades={teacher ? [] : s.grades.map((g) => ({ value: g, label: gradeName(g) }))}
        streams={streams.map((st) => ({ value: st.id, label: `${gradeName(st.gradeCode)} ${st.name} · ${st.campusId === "c-rui" ? "Ruiru" : "Syokimau"}` }))}
        routes={teacher ? [] : s.routes.map((r) => ({ value: r.id, label: r.name }))}
      />

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[1.3fr_1fr]">
        <Card title="Sent notices">
          <ul className="divide-y divide-cream-200">
            {s.notices.map((n) => {
              const unread = n.stats.delivered - n.stats.read;
              return (
                <li key={n.id} className="py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold text-navy-900">{n.title}</p>
                    <p className="text-xs text-ink-600">
                      {formatDate(new Date(n.sentAt))} · {n.audienceLabel}
                    </p>
                  </div>
                  {/* Read-Receipt Meter */}
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-navy-100">
                    <div className="flex h-full">
                      <span className="bg-navy-900" style={{ width: `${(n.stats.read / n.stats.total) * 100}%` }} />
                      <span className="bg-gold-400" style={{ width: `${(unread / n.stats.total) * 100}%` }} />
                      <span className="bg-due/70" style={{ width: `${(n.stats.failed / n.stats.total) * 100}%` }} />
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-600">
                    <span>
                      <b className="text-navy-900">{n.stats.read}</b> read
                    </span>
                    <span>{n.stats.delivered} delivered</span>
                    <span>{n.stats.failed} failed</span>
                    {unread > 0 && (
                      <button className="ml-auto rounded-full px-3 py-1 font-semibold text-navy-900 ring-1 ring-cream-200" disabled title="Switched off in the demo">
                        Resend by SMS to {unread} unread
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
        <div className="space-y-5">
          <Card title="Events and consent">
            {s.events
              .filter((e) => e.kind === "trip")
              .map((e) => (
                <div key={e.id}>
                  <p className="font-semibold text-navy-900">{e.name}</p>
                  <p className="text-sm text-ink-600">
                    {formatDate(new Date(e.date))} · {e.audienceLabel}
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
                    {[
                      ["Invited", e.invited],
                      ["Consented", e.consented],
                      ["Paid", e.paid],
                    ].map(([l, v]) => (
                      <div key={l} className="rounded-xl bg-cream-100 p-3">
                        <p className="font-display text-2xl text-navy-900">{v}</p>
                        <p className="text-xs text-ink-600">{l}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </Card>
          {!teacher && (
            <Card title="Parent inbox">
              <ul id="inbox" className="divide-y divide-cream-200 text-sm">
                {s.inbox.map((t) => (
                  <li key={t.id} className="py-3">
                    <div className="flex items-center justify-between gap-2">
                      <a href={`/app/families/${t.familyId}/`} className="font-semibold text-navy-900 hover:underline">
                        {s.families.find((f) => f.id === t.familyId)?.displayName}
                      </a>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${t.status === "open" ? "bg-gold-200 text-navy-900" : "bg-cream-100 text-ink-600"}`}>{t.tag}</span>
                    </div>
                    <p className="text-ink-600">{t.lastMessage}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
