import type { Metadata } from "next";
import { headers } from "next/headers";
import { KENYA_GRADES, gradeName } from "@shulife/core";
import { currentTerm } from "@shulife/demo";
import { paybillCallbacks, SETUP_STEPS, type SetupStep } from "@shulife/db";
import { Wordmark } from "@/components/brand";
import { Icon } from "@/components/icons";
import { withDb } from "@/lib/db";
import { setupContext } from "./context";
import { goLiveAction, invoiceTermAction, saveClassesAction, saveDetailsAction, saveFeesAction } from "./actions";
import { FEE_COLUMNS } from "./fees";
import { LearnerImport } from "./learner-import";

export const metadata: Metadata = { title: "Set up your school", robots: { index: false } };
export const dynamic = "force-dynamic";

const LABELS: Record<SetupStep, [string, string]> = {
  details: ["School and campuses", "Name, contact phone and each campus’s Paybill"],
  classes: ["Classes and term", "Grades, streams and this term’s dates"],
  fees: ["Fees", "What each grade pays, lunch, boarding and transport"],
  learners: ["Learners and families", "Import your class lists from Excel"],
  invoices: ["Invoice the term", "Create every learner’s invoice"],
  payments: ["Connect M-Pesa and go live", "Your Paybill callback and the note for parents"],
};

const input = "mt-1 block h-11 w-full rounded-lg border border-cream-200 bg-white px-3 text-[0.95rem] text-ink-900";
const label = "block text-sm font-semibold text-navy-900";
const kes = (c: number) => (c ? String(Math.round(c / 100)) : "");

function Save({ children = "Save and continue" }: { children?: React.ReactNode }) {
  return <button className="h-11 rounded-full bg-navy-900 px-6 text-sm font-semibold text-cream-50 hover:bg-navy-800">{children}</button>;
}

export default async function Setup({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams;
  const { s, org } = await setupContext();
  const done = s.org.setup ?? {};
  const firstOpen = SETUP_STEPS.find((x) => !done[x]) ?? "payments";
  const step = (q.step && (SETUP_STEPS as string[]).concat("done").includes(q.step) ? q.step : firstOpen) as SetupStep | "done";
  const term = s.terms.find((t) => t.status === "open");

  return (
    <div className="min-h-screen bg-cream-50">
      <header className="flex items-center justify-between border-b border-cream-200 bg-white px-5 py-4 sm:px-8">
        <div className="flex items-center gap-4">
          <Wordmark size="sm" />
          <span className="hidden text-sm text-ink-600 sm:block">Setting up {s.org.name}</span>
        </div>
        {s.org.liveAt && (
          <a href="/app/" className="text-sm font-semibold text-navy-900 underline decoration-gold-500 underline-offset-4">
            Open the school app
          </a>
        )}
      </header>
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[17rem_1fr]">
        <nav aria-label="Setup steps">
          <ol className="space-y-1">
            {SETUP_STEPS.map((x, i) => (
              <li key={x}>
                <a href={`/setup/?step=${x}`} className={`flex gap-3 rounded-xl p-3 ${step === x ? "bg-white ring-1 ring-cream-200" : "hover:bg-white/60"}`}>
                  <span className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${done[x] ? "bg-paid text-white" : "border border-cream-300 text-navy-900"}`}>
                    {done[x] ? <Icon.Check className="size-4" strokeWidth={2.6} /> : i + 1}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-navy-900">{LABELS[x][0]}</span>
                    <span className="block text-xs text-ink-600">{LABELS[x][1]}</span>
                  </span>
                </a>
              </li>
            ))}
          </ol>
          <p className="mt-4 rounded-xl bg-navy-100 p-3 text-xs leading-relaxed text-navy-900">Everything saves as you go. Every change is recorded in your school’s audit log.</p>
        </nav>

        <main className="min-w-0 rounded-2xl bg-white p-6 ring-1 ring-cream-200 sm:p-8">
          {q.error && <p role="alert" className="mb-6 rounded-lg bg-due/10 p-3 text-sm text-due">{q.error}</p>}

          {step === "details" && (
            <form action={saveDetailsAction} className="space-y-6">
              <Heading n={1} title="School and campuses" sub="This is how your school appears on receipts and messages to parents." />
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={label}>School name<input name="name" required defaultValue={s.org.name} className={input} /></label>
                <label className={label}>County<input name="county" defaultValue={s.org.county ?? ""} className={input} placeholder="e.g. Kiambu" /></label>
                <label className={label}>Office phone<input name="phone" defaultValue={s.org.officePhone} className={input} placeholder="07XX XXX XXX" /></label>
                <label className={label}>Family code prefix<input name="prefix" defaultValue={s.org.familyPrefix} className={input} placeholder="FAM" /><span className="mt-1 block text-xs font-normal text-ink-600">Family codes look like FAM-2041. Parents can pay for all their children with one.</span></label>
              </div>
              <fieldset>
                <legend className="text-sm font-semibold text-navy-900">Campuses</legend>
                <p className="text-sm text-ink-600">One row per campus. Most schools have one. The code is 3 or 4 letters and appears on receipt numbers.</p>
                <div className="mt-3 space-y-3">
                  {[0, 1, 2].map((i) => {
                    const c = s.campuses[i];
                    return (
                      <div key={i} className="grid gap-3 sm:grid-cols-[2fr_1fr_1.2fr]">
                        <input name={`campus_name_${i}`} defaultValue={c?.name ?? (i === 0 ? s.org.name : "")} placeholder={i === 0 ? "Campus name" : "Another campus (optional)"} className={input} aria-label={`Campus ${i + 1} name`} />
                        <input name={`campus_code_${i}`} defaultValue={c?.code ?? (i === 0 ? "MAIN" : "")} placeholder="Code" className={`${input} uppercase`} aria-label={`Campus ${i + 1} code`} />
                        <input name={`campus_paybill_${i}`} defaultValue={c?.paybill ?? ""} placeholder="Paybill number" inputMode="numeric" className={input} aria-label={`Campus ${i + 1} Paybill`} />
                      </div>
                    );
                  })}
                </div>
              </fieldset>
              <Save />
            </form>
          )}

          {step === "classes" && (
            <form action={saveClassesAction} className="space-y-6">
              <Heading n={2} title="Classes and term" sub="Tick the grades you teach. You can add streams now or later." />
              <fieldset>
                <legend className="text-sm font-semibold text-navy-900">Grades</legend>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {KENYA_GRADES.map((g) => (
                    <label key={g} className="flex items-center gap-2 rounded-lg border border-cream-200 px-3 py-2 text-sm">
                      <input type="checkbox" name="grade" value={g} defaultChecked={s.grades.length ? s.grades.includes(g) : !g.startsWith("G1") || g === "G1"} /> {gradeName(g)}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className={label}>
                Streams in each grade
                <input name="streams" defaultValue={[...new Set(s.streams.map((x) => x.name))].join(", ")} className={input} placeholder="e.g. East, West (leave blank for one class per grade)" />
              </label>
              <fieldset className="grid gap-4 sm:grid-cols-5">
                <legend className="mb-2 text-sm font-semibold text-navy-900 sm:col-span-5">Current term</legend>
                <label className={label}>Year<input name="year" type="number" defaultValue={term?.year ?? new Date().getFullYear() + (new Date().getMonth() >= 10 ? 1 : 0)} className={input} /></label>
                <label className={label}>Term
                  <select name="number" defaultValue={term?.number ?? 1} className={input}>
                    <option value={1}>Term 1</option><option value={2}>Term 2</option><option value={3}>Term 3</option>
                  </select>
                </label>
                <label className={label}>Opens<input name="opens" type="date" defaultValue={term?.opening} required className={input} /></label>
                <label className={label}>Closes<input name="closes" type="date" defaultValue={term?.closing} required className={input} /></label>
                <label className={label}>Fees due by<input name="due" type="date" defaultValue={term?.due} className={input} /></label>
              </fieldset>
              <Save />
            </form>
          )}

          {step === "fees" && <Fees s={s} />}

          {step === "learners" && (
            <div className="space-y-6">
              <Heading n={4} title="Learners and families" sub="Paste from Excel or upload a CSV. Learners who share a parent’s phone number are grouped into one family." />
              {q.added && <p className="rounded-lg bg-paid/10 p-3 text-sm text-navy-900">Imported <b>{q.added}</b> learners{Number(q.skipped) ? `, skipped ${q.skipped} already on file` : ""}. You now have {s.learners.length} learners in {s.families.length} families.</p>}
              {!s.grades.length ? (
                <p className="text-sm text-ink-600">Set up your classes first.</p>
              ) : (
                <LearnerImport campuses={s.campuses.map((c) => ({ id: c.id, name: c.name }))} />
              )}
              <details className="rounded-lg bg-cream-50 p-4 text-sm text-ink-600">
                <summary className="cursor-pointer font-semibold text-navy-900">Which columns can I use?</summary>
                <p className="mt-2">Required: admission number, name and class. Also read if present: stream, boarding (Day or Boarder), parent name and phone, a second parent, transport route, lunch (Yes/No) and opening balance (what the family owed from your old records; a minus sign means they’re in credit).</p>
              </details>
              {s.learners.length > 0 && (
                <a href="/setup/?step=invoices" className="inline-flex h-11 items-center rounded-full bg-navy-900 px-6 text-sm font-semibold text-cream-50">Continue to invoicing</a>
              )}
            </div>
          )}

          {step === "invoices" && (
            <form action={invoiceTermAction} className="space-y-6">
              <Heading n={5} title="Invoice the term" sub={term ? `Create ${term.name} invoices from your fee structure. Learners who already have one are skipped, so it’s safe to run again after adding more.` : "Set the term dates first."} />
              {q.invoiced && <p className="rounded-lg bg-paid/10 p-3 text-sm text-navy-900">Created <b>{q.invoiced}</b> invoices totalling <b>KSh {Math.round(Number(q.total) / 100).toLocaleString("en-KE")}</b>.</p>}
              <dl className="grid gap-3 sm:grid-cols-3">
                <Stat label="Learners" value={s.learners.filter((l) => l.status === "active").length} />
                <Stat label="Already invoiced" value={term ? s.invoices.filter((i) => i.termId === term.id).length : 0} />
                <Stat label="Fee items" value={s.feeItems.filter((f) => f.code !== "arrears").length} />
              </dl>
              <p className="text-sm text-ink-600">Opening balances from your import are added as “Balance brought forward” and paid off first. Families in credit keep it as credit. After invoicing, this term’s fee structure is locked.</p>
              <Save>Create invoices</Save>
            </form>
          )}

          {step === "payments" && <Payments org={org} name={s.org.name} prefix={s.org.familyPrefix} live={Boolean(s.org.liveAt)} />}

          {step === "done" && (
            <div className="space-y-4">
              <Heading title={`${s.org.name} is live`} sub="Payments into your Paybill will now be matched, split between siblings and receipted automatically." />
              <a href="/app/" className="inline-flex h-11 items-center rounded-full bg-navy-900 px-6 text-sm font-semibold text-cream-50">Open the dashboard</a>
              <p className="text-sm text-ink-600">Next: invite your bursar and head teacher from <a className="font-semibold text-navy-900 underline" href="/app/team/">Team</a>.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );

  async function Payments({ org, name, prefix, live }: { org: string; name: string; prefix: string; live: boolean }) {
    const h = await headers();
    const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
    const rows = (await withDb((c) => paybillCallbacks(c, org))) ?? [];
    return (
      <form action={goLiveAction} className="space-y-6">
        <Heading n={6} title="Connect M-Pesa and go live" sub="Safaricom sends each payment to these addresses. The Shulife team registers them on your Paybill with you." />
        <div className="space-y-4">
          {rows.map((r) => (
            <div key={r.campus_id} className="rounded-lg border border-cream-200 p-4 text-sm">
              <p className="font-semibold text-navy-900">{r.name} · Paybill {r.shortcode ?? "not set"}</p>
              {r.callback_secret ? (
                <dl className="mt-2 space-y-2 break-all font-mono text-xs text-ink-600">
                  <div><dt className="font-sans font-semibold text-navy-900">Confirmation URL</dt><dd>{origin}/api/webhooks/mpesa/{r.campus_id}/{r.callback_secret}/confirmation</dd></div>
                  <div><dt className="font-sans font-semibold text-navy-900">Validation URL</dt><dd>{origin}/api/webhooks/mpesa/{r.campus_id}/{r.callback_secret}/validation</dd></div>
                </dl>
              ) : (
                <p className="mt-1 text-ink-600">Add this campus’s Paybill number in step 1.</p>
              )}
            </div>
          ))}
        </div>
        <div className="rounded-lg bg-cream-50 p-4 text-sm leading-relaxed text-ink-900">
          <p className="font-semibold text-navy-900">Note for parents</p>
          <p className="mt-1">To pay {name} fees with M-Pesa: go to Lipa na M-Pesa, Pay Bill. Business number: {rows[0]?.shortcode ?? "your Paybill"}. Account number: your child’s admission number, or your family code ({prefix}-…) to pay for all your children at once. You’ll get a receipt by SMS or WhatsApp within a minute.</p>
        </div>
        <Save>{live ? "Saved. You’re live" : "Go live"}</Save>
      </form>
    );
  }
}

function Heading({ n, title, sub }: { n?: number; title: string; sub: string }) {
  return (
    <div>
      {n && <p className="text-sm font-semibold text-gold-700">Step {n} of 6</p>}
      <h1 className="mt-1 font-display text-3xl text-navy-900">{title}</h1>
      <p className="mt-2 max-w-2xl text-ink-600">{sub}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-cream-50 p-4">
      <dt className="text-sm text-ink-600">{label}</dt>
      <dd className="font-display text-2xl text-navy-900">{value.toLocaleString("en-KE")}</dd>
    </div>
  );
}

function Fees({ s }: { s: Awaited<ReturnType<typeof setupContext>>["s"] }) {
  const term = s.terms.find((t) => t.status === "open");
  if (!term || !s.grades.length) return <p className="text-sm text-ink-600">Set up your classes and term first.</p>;
  const rows = s.structures[term.id] ?? [];
  const locked = Boolean(s.org.setup?.invoices);
  const amount = (code: string, g: string) => {
    const item = s.feeItems.find((f) => f.code === code);
    return item ? rows.find((r) => r.feeItemId === item.id && r.gradeCode === g)?.day ?? 0 : 0;
  };
  return (
    <form action={saveFeesAction} className="space-y-6">
      <Heading n={3} title="Fees" sub={`Amounts in shillings for ${term.name}. Leave a cell blank if that grade doesn’t pay it.`} />
      {locked && <p className="rounded-lg bg-gold-200/50 p-3 text-sm text-navy-900">This term is already invoiced, so its fees are locked.</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-left text-ink-600">
              <th className="py-2 pr-3 font-semibold">Grade</th>
              {FEE_COLUMNS.map((c) => (
                <th key={c.code} className="px-1 py-2 font-semibold">{c.name}{c.code === "lunch" ? " (if taken)" : c.code === "boarding" ? " (boarders)" : ""}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {s.grades.map((g) => (
              <tr key={g} className="border-t border-cream-200">
                <td className="py-2 pr-3 font-semibold text-navy-900">{gradeName(g)}</td>
                {FEE_COLUMNS.map((c) => (
                  <td key={c.code} className="px-1 py-1.5">
                    <input name={`fee:${c.code}:${g}`} defaultValue={kes(amount(c.code, g))} inputMode="numeric" disabled={locked} className="h-10 w-full min-w-24 rounded-md border border-cream-200 px-2 text-right tabular-nums" aria-label={`${c.name}, ${gradeName(g)}`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <fieldset>
        <legend className="text-sm font-semibold text-navy-900">Transport routes (optional)</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="grid grid-cols-[2fr_1fr] gap-2">
              <input name={`route_name_${i}`} defaultValue={s.routes[i]?.name ?? ""} placeholder={`Route ${i + 1} name`} disabled={locked} className={input} aria-label={`Route ${i + 1} name`} />
              <input name={`route_amount_${i}`} defaultValue={kes(s.routes[i]?.amount ?? 0)} placeholder="KSh per term" inputMode="numeric" disabled={locked} className={input} aria-label={`Route ${i + 1} amount`} />
            </div>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          When one payment covers several children
          <select name="rule" defaultValue={s.org.allocationRule} disabled={locked} className={input}>
            <option value="oldest_balance">Clear the oldest balances first</option>
            <option value="proportional">Share in proportion to what each owes</option>
            <option value="eldest_first">Clear the eldest child first</option>
            <option value="youngest_first">Clear the youngest child first</option>
            <option value="exact_number">Only the child whose number was used</option>
          </select>
        </label>
        <label className={label}>
          Cleared for exams and trips at (% of fees paid)
          <input name="clearance" type="number" min={0} max={100} defaultValue={s.org.clearancePct} disabled={locked} className={input} />
        </label>
      </div>
      {!locked && <Save />}
      {locked && <a href="/setup/?step=learners" className="inline-flex h-11 items-center rounded-full bg-navy-900 px-6 text-sm font-semibold text-cream-50">Continue</a>}
    </form>
  );
}
