import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatDate, formatKes } from "@shulife/core";
import { getSchool, parentView } from "@shulife/demo";
import { Wordmark } from "@/components/brand";
import { verifyParentToken } from "@/lib/session";

/**
 * Parent portal (§10.2): mobile-first, light, and the balance and payment
 * instructions render on the server, so they work without JavaScript.
 * Access is a signed, expiring link — no password, no app.
 */
export const metadata: Metadata = { title: "Your school fees", robots: { index: false } };
export const dynamic = "force-dynamic";

const T = {
  en: { hello: "Hello", balance: "Family balance", pay: "Pay now", how: "How to pay", paybill: "Paybill", account: "Account", children: "Your children", receipts: "Receipts", statement: "Statement", plan: "Payment plan", notices: "Notices", paid: "Fully paid", due: "due", lang: "Kiswahili", instalment: "Instalment", verify: "Verify", term: "Term", noReceipts: "No receipts yet.", ratiba: "Auto-pay with M-PESA Ratiba is available for plan instalments.", stk: "We’ll send an M-Pesa prompt to your phone.", family: "Or pay for all children with your family code" },
  sw: { hello: "Habari", balance: "Salio la familia", pay: "Lipa sasa", how: "Jinsi ya kulipa", paybill: "Paybill", account: "Akaunti", children: "Watoto wako", receipts: "Risiti", statement: "Taarifa", plan: "Mpango wa malipo", notices: "Matangazo", paid: "Umelipa yote", due: "inatakiwa", lang: "English", instalment: "Awamu", verify: "Thibitisha", term: "Muhula", noReceipts: "Hakuna risiti bado.", ratiba: "Unaweza kulipa awamu kiotomatiki kwa M-PESA Ratiba.", stk: "Tutatuma ombi la M-PESA kwenye simu yako.", family: "Au walipie watoto wote kwa namba ya familia" },
};

export default async function ParentPortal({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ lang?: string; paid?: string }> }) {
  const { token } = await params;
  const { lang: langParam, paid } = await searchParams;
  const familyId = verifyParentToken(token);
  if (!familyId) notFound();
  const s = getSchool();
  const v = parentView(s, familyId);
  if (!v) notFound();
  const lang = langParam === "sw" || (langParam !== "en" && v.family.lang === "sw") ? "sw" : "en";
  const t = T[lang];
  const k = (c: number) => formatKes(Math.round(Math.max(0, c) / 100) * 100);

  return (
    <main lang={lang === "sw" ? "sw" : "en-GB"} className="mx-auto min-h-screen max-w-md bg-cream-50 pb-16">
      <header className="flex items-center justify-between bg-navy-900 px-5 py-4 text-cream-50">
        <div>
          <p className="font-display text-xl">{v.school}</p>
          <p className="text-xs text-cream-100/70">{v.campus.name.replace("Mlima Academy, ", "")} · {v.term.name}</p>
        </div>
        <a href={`?lang=${lang === "en" ? "sw" : "en"}`} className="rounded-full bg-cream-50/10 px-3 py-1.5 text-xs font-semibold">
          {t.lang}
        </a>
      </header>

      <section className="px-5 pt-6">
        <p className="text-ink-600">
          {t.hello}, {v.family.displayName.replace("The ", "").replace(" family", "")} 👋
        </p>
        <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-ink-600">{t.balance}</p>
        <p className="font-display text-5xl text-navy-900">{v.balance > 0 ? k(v.balance) : t.paid}</p>
        {v.nextDue && (
          <p className="mt-1 text-sm text-ink-600">
            {t.instalment} {v.nextDue.n}: {k(v.nextDue.amount - v.nextDue.paid)} {t.due} {formatDate(new Date(v.nextDue.dueDate))}
          </p>
        )}
        {paid ? (
          <p role="status" className="mt-5 rounded-xl bg-paid/10 p-4 text-sm font-semibold text-paid">
            {t.stk}
          </p>
        ) : (
          v.balance > 0 && (
            <form className="mt-5">
              <input type="hidden" name="paid" value="1" />
              <input type="hidden" name="lang" value={lang} />
              <button className="h-14 w-full rounded-2xl bg-gold-400 text-lg font-bold text-navy-950 shadow-soft">
                {t.pay} · {k(v.balance)}
              </button>
            </form>
          )
        )}
      </section>

      <section className="mx-5 mt-6 rounded-2xl bg-white p-5 shadow-soft">
        <p className="font-semibold text-navy-900">{t.how}</p>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-cream-100 p-3">
            <dt className="text-ink-600">{t.paybill}</dt>
            <dd className="font-mono text-lg font-bold text-navy-900">{v.campus.paybill}</dd>
          </div>
          <div className="rounded-xl bg-cream-100 p-3">
            <dt className="text-ink-600">{t.account}</dt>
            <dd className="font-mono text-lg font-bold text-navy-900">{v.children[0].admission}</dd>
          </div>
        </dl>
        <p className="mt-3 text-sm text-ink-600">
          {t.family}: <b className="font-mono text-navy-900">{v.family.code}</b>
        </p>
      </section>

      <section className="mt-6 px-5">
        <h2 className="font-semibold text-navy-900">{t.children}</h2>
        <ul className="mt-3 space-y-3">
          {v.children.map((c) => (
            <li key={c.admission} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-soft">
              <div>
                <p className="font-semibold text-navy-900">{c.fullName}</p>
                <p className="text-sm text-ink-600">
                  {c.grade} · ADM {c.admission}
                </p>
              </div>
              <p className={`font-semibold ${c.balance > 0 ? "text-navy-900" : "text-paid"}`}>{c.balance > 0 ? k(c.balance) : "✓"}</p>
            </li>
          ))}
        </ul>
      </section>

      {v.plan && (
        <section className="mx-5 mt-6 rounded-2xl bg-white p-5 shadow-soft">
          <h2 className="font-semibold text-navy-900">{t.plan}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {v.plan.instalments.map((i) => (
              <li key={i.n} className="flex justify-between">
                <span>
                  {t.instalment} {i.n} · {formatDate(new Date(i.dueDate))}
                </span>
                <span className={i.paid >= i.amount ? "text-paid" : "text-navy-900"}>{i.paid >= i.amount ? "✓" : k(i.amount)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-600">{t.ratiba}</p>
        </section>
      )}

      <section id="statement" className="mx-5 mt-6 rounded-2xl bg-white p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-navy-900">
            {t.statement} · {v.children[0].name}
          </h2>
          <a href={`/api/pdf/statement/${token}/`} className="text-xs font-semibold text-navy-900 underline decoration-gold-500 underline-offset-4">
            PDF
          </a>
        </div>
        {v.children[0].statement.sections.slice(-1).map((sec) => (
          <table key={sec.termKey} className="mt-3 w-full text-sm tabular">
            <tbody className="divide-y divide-cream-200">
              {sec.broughtForward !== 0 && (
                <tr>
                  <td className="py-2 text-ink-600">B/F</td>
                  <td className="py-2 text-right">{k(sec.broughtForward)}</td>
                </tr>
              )}
              {sec.lines.map((l) => (
                <tr key={l.id}>
                  <td className="py-2 text-navy-900">{l.description}</td>
                  <td className={`py-2 text-right ${l.amount < 0 ? "text-paid" : ""}`}>
                    {l.amount < 0 ? "− " : ""}
                    {formatKes(Math.abs(Math.round(l.amount / 100) * 100))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
      </section>

      <section className="mx-5 mt-6 rounded-2xl bg-white p-5 shadow-soft">
        <h2 className="font-semibold text-navy-900">{t.receipts}</h2>
        {v.receipts.length === 0 ? (
          <p className="mt-2 text-sm text-ink-600">{t.noReceipts}</p>
        ) : (
          <ul className="mt-3 divide-y divide-cream-200 text-sm">
            {v.receipts.slice(0, 6).map((r) => (
              <li key={r.number} className="flex items-center justify-between py-2.5">
                <span>
                  <span className="block font-semibold text-navy-900">{k(r.amount)}</span>
                  <span className="text-xs text-ink-600">
                    {r.number} · {formatDate(new Date(r.at))}
                  </span>
                </span>
                <span className="flex gap-3">
                  <a href={`/api/pdf/receipt/${r.verifyCode}/`} className="text-xs font-semibold text-navy-900 underline decoration-gold-500 underline-offset-4">
                    PDF
                  </a>
                  <a href={`/r/${r.verifyCode}/`} className="text-xs font-semibold text-navy-900 underline decoration-gold-500 underline-offset-4">
                    {t.verify}
                  </a>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mx-5 mt-6">
        <h2 className="font-semibold text-navy-900">{t.notices}</h2>
        <ul className="mt-3 space-y-3">
          {v.notices.slice(0, 3).map((n) => (
            <li key={n.id} className="rounded-2xl bg-white p-4 text-sm shadow-soft">
              <p className="font-semibold text-navy-900">{n.title}</p>
              <p className="mt-1 text-ink-600">{lang === "sw" ? n.bodySw : n.bodyEn}</p>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-10 flex flex-col items-center gap-2 text-xs text-ink-400">
        <Wordmark size="sm" />
        Powered by Shulife · Demo data
      </footer>
    </main>
  );
}
