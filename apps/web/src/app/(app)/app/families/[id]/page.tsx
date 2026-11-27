import { notFound, redirect } from "next/navigation";
import { school } from "@/lib/db";
import { formatDate, formatTime, gradeName } from "@shulife/core";
import { familyDetail } from "@shulife/demo";
import { Card, KSh, MatchBadge, PageTitle, Pill, SplitBar, balancePill } from "@/components/app/ui";
import { Icon } from "@/components/icons";
import { can, getSession, signParentToken } from "@/lib/session";
import { recordManualReceipt } from "../../../actions";

export const metadata = { title: "Family" };

const TEMPLATE_LABEL: Record<string, string> = {
  statement_published: "Statement published",
  pre_opening: "Before opening",
  due_today: "Due today",
  due_plus_7: "Gentle follow-up + plan offer",
  due_plus_21: "Firm but polite",
  clearance_notice: "Before an exam or trip",
  plan_instalment: "Plan instalment",
};

export default async function FamilyPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ receipt?: string; tab?: string }> }) {
  const session = await getSession();
  if (!can.seeMoney(session.role)) redirect("/app/clearance/");
  const { id } = await params;
  const { receipt, tab } = await searchParams;
  const s = await school();
  const d = familyDetail(s, id);
  if (!d) notFound();
  const active = d.kids.find((k) => k.learner.id === tab) ?? d.kids[0];
  const parentLink = `/p/${signParentToken(d.family.id)}/`;

  return (
    <>
      <a href="/app/families/" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-navy-900">
        <Icon.Arrow className="size-4 rotate-180" /> Families
      </a>
      <PageTitle title={d.family.displayName} sub={`${d.family.code} · prefers ${d.family.lang === "sw" ? "Kiswahili" : "English"}`} action={<a href={parentLink} className="rounded-full bg-gold-400 px-4 py-2 text-sm font-semibold text-navy-950">Open parent view</a>} />
      {receipt && (
        <p role="status" className="mb-5 rounded-xl bg-paid/10 px-4 py-3 text-sm font-semibold text-paid">
          Receipt {receipt} recorded and sent to the family.
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.4fr]">
        <div className="space-y-5">
          {/* Family Card */}
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-600">Family balance</p>
                <p className="font-display text-4xl text-navy-900">
                  <KSh cents={Math.max(0, d.balance)} />
                </p>
                {d.balance < 0 && (
                  <p className="text-sm text-paid">
                    In credit <KSh cents={-d.balance} />
                  </p>
                )}
              </div>
              {d.plan && <Pill kind={d.plan.status === "active" ? "on_plan" : "not_cleared"} label={d.plan.status === "active" ? "On a plan" : "Plan behind"} />}
            </div>
            <ul className="mt-5 divide-y divide-cream-200">
              {d.kids.map((k) => (
                <li key={k.learner.id} className="flex items-center gap-3 py-3">
                  <span className="inline-flex size-10 items-center justify-center rounded-full bg-navy-900 font-display text-cream-50">{k.learner.firstName[0]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-navy-900">
                      {k.learner.firstName} {k.learner.lastName}
                    </p>
                    <p className="text-xs text-ink-600">
                      {gradeName(k.learner.gradeCode)} {k.stream.name} · ADM {k.learner.admissionNumber} · {k.learner.boarding === "boarder" ? "Boarder" : "Day"}
                      {k.route ? ` · ${k.route.name.split(" — ")[0]}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <KSh cents={k.pos.balance} className="text-sm text-navy-900" />
                    <div className="mt-1">
                      <Pill kind={balancePill(k.pos.balance, k.pos.billed)} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-cream-200 pt-4">
              <a href={parentLink} className="rounded-full bg-navy-900 px-4 py-2 text-sm font-semibold text-cream-50">Request payment</a>
              <a href={`/api/pdf/family/${d.family.id}/`} className="rounded-full px-4 py-2 text-sm font-semibold text-navy-900 ring-1 ring-cream-200">Statement</a>
              <a href="/app/notices/" className="rounded-full px-4 py-2 text-sm font-semibold text-navy-900 ring-1 ring-cream-200">Message</a>
            </div>
          </Card>

          <Card title="Guardians">
            <ul className="space-y-3 text-sm">
              {d.guardians.map((g) => (
                <li key={g.id} className="flex items-center justify-between gap-3">
                  <span>
                    <span className="font-semibold text-navy-900">{g.name}</span> <span className="text-ink-600">· {g.relationship}</span>
                    <span className="block text-ink-600">
                      {g.masked} · {g.whatsapp ? "WhatsApp" : "SMS only"}
                    </span>
                  </span>
                  {g.isPayer && <span className="rounded-full bg-cream-100 px-2 py-0.5 text-xs font-semibold text-navy-900">Pays fees</span>}
                </li>
              ))}
            </ul>
          </Card>

          {d.plan && (
            <Card title="Payment plan">
              <ul className="space-y-2 text-sm">
                {d.plan.instalments.map((i) => (
                  <li key={i.n} className="flex items-center justify-between">
                    <span>
                      Instalment {i.n} · {formatDate(new Date(i.dueDate))}
                    </span>
                    <span className="flex items-center gap-2">
                      <KSh cents={i.amount} className="text-navy-900" />
                      {i.paid >= i.amount ? <Pill kind="paid" /> : <Pill kind="due" label="Due" />}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card title="Upcoming messages">
            {d.reminders.scheduled.length === 0 ? (
              <p className="text-sm text-ink-600">No reminders due — {d.reminders.skipped[0]?.reason ?? "nothing scheduled"}.</p>
            ) : (
              <ol className="space-y-2 text-sm">
                {d.reminders.scheduled.map((r) => (
                  <li key={r.key} className="flex items-center justify-between gap-3">
                    <span className="text-navy-900">{TEMPLATE_LABEL[r.template] ?? r.template}</span>
                    <span className="text-ink-600">
                      {formatDate(r.sendAt)} {formatTime(r.sendAt)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
            <p className="mt-3 text-xs text-ink-600">Never in quiet hours, at most {s.org.maxPerWeek} a week, and they stop the moment the family pays.</p>
          </Card>

          {can.manualReceipt(session.role) && (
            <Card title="Record cash, cheque or bank slip">
              <form action={recordManualReceipt} className="grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="familyId" value={d.family.id} />
                <label className="text-sm">
                  <span className="font-semibold text-navy-900">Amount (KSh)</span>
                  <input name="amount" required inputMode="decimal" pattern="[0-9,]+(\.[0-9]{1,2})?" className="mt-1 h-11 w-full rounded-lg border border-cream-200 px-3" placeholder="10,000" />
                </label>
                <label className="text-sm">
                  <span className="font-semibold text-navy-900">Received as</span>
                  <select name="channel" className="mt-1 h-11 w-full rounded-lg border border-cream-200 px-3">
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                    <option value="bank_slip">Bank slip</option>
                  </select>
                </label>
                <label className="text-sm">
                  <span className="font-semibold text-navy-900">Receipt-book number</span>
                  <input name="bookRef" required className="mt-1 h-11 w-full rounded-lg border border-cream-200 px-3" placeholder="RB-4120" />
                </label>
                <label className="text-sm">
                  <span className="font-semibold text-navy-900">Photo of slip</span>
                  <input name="photo" type="file" accept="image/*" capture="environment" className="mt-1 block w-full text-sm" />
                </label>
                <button className="h-11 rounded-full bg-navy-900 font-semibold text-cream-50 sm:col-span-2">Record and send receipt</button>
                <p className="text-xs text-ink-600 sm:col-span-2">Split between the children by the school’s rule. Every manual entry is audited and appears in today’s cash-up.</p>
              </form>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card>
            <div role="tablist" className="mb-4 flex flex-wrap gap-2">
              {d.kids.map((k) => (
                <a key={k.learner.id} role="tab" aria-selected={k === active} href={`?tab=${k.learner.id}`} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${k === active ? "bg-navy-900 text-cream-50" : "ring-1 ring-cream-200"}`}>
                  {k.learner.firstName}
                </a>
              ))}
            </div>
            <h2 className="font-semibold text-navy-900">Statement — {active.learner.firstName}</h2>
            {active.statement.sections.map((sec) => (
              <div key={sec.termKey} className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-gold-700">{sec.termKey.replace(/(\d+)-(\d)/, "Term $2 $1")}</p>
                <table className="mt-2 w-full text-sm tabular">
                  <tbody className="divide-y divide-cream-200">
                    {sec.broughtForward !== 0 && (
                      <tr>
                        <td className="py-2 text-ink-600">Balance brought forward</td>
                        <td className="py-2 text-right">
                          <KSh cents={sec.broughtForward} strong={false} />
                        </td>
                      </tr>
                    )}
                    {sec.lines.map((l) => (
                      <tr key={l.id}>
                        <td className="py-2 text-navy-900">
                          {l.description}
                          <span className="block text-xs text-ink-400">
                            {formatDate(new Date(l.at))}
                            {l.ref ? ` · ${l.ref}` : ""}
                          </span>
                        </td>
                        <td className={`py-2 text-right ${l.amount < 0 ? "text-paid" : "text-navy-900"}`}>
                          {l.amount < 0 ? "− " : ""}
                          <KSh cents={Math.abs(l.amount)} strong={false} />
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td className="pt-3 font-semibold text-navy-900">Closing balance</td>
                      <td className="pt-3 text-right">
                        <KSh cents={sec.closing} className="text-navy-900" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}
          </Card>

          <Card title="Payments">
            <ul className="divide-y divide-cream-200">
              {d.payments.map((p) => (
                <li key={p.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-navy-900">
                        <KSh cents={p.amount} /> · {p.channel === "c2b" ? "M-Pesa" : p.channel === "bank_import" ? "Bank" : p.channel.replace("_", " ")}
                      </p>
                      <p className="text-xs text-ink-600">
                        {formatDate(new Date(p.paidAt))} {formatTime(new Date(p.paidAt))} ·{" "}
                        {p.receiptNo && p.verifyCode ? (
                          <a href={`/api/pdf/receipt/${p.verifyCode}/`} className="underline decoration-gold-500 underline-offset-2">
                            {p.receiptNo}
                          </a>
                        ) : (
                          "no receipt"
                        )}{" "}
                        · ref “{p.billRef ?? "—"}”
                      </p>
                    </div>
                    {p.matchStatus === "reversed" ? <Pill kind="not_cleared" label="Reversed" /> : <MatchBadge kind={p.matchKind} />}
                  </div>
                  <div className="mt-2">
                    <SplitBar parts={p.split.map((x) => ({ name: x.name, amount: x.amount }))} credit={p.credit} />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
