import type { Metadata } from "next";
import { SiblingDemo } from "@/components/sibling-demo";
import { Icon } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { Checklist, CtaBand, FeatureGrid, FeatureRow, PageHero, SectionHeading } from "@/components/shared";
import { Button, Container, Eyebrow, Money } from "@/components/ui";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "For bursars",
  description: "Get your week back: automatic M-Pesa matching, a review queue that learns, sibling splits, manual receipts, daily cash-up, banking and one-click reports.",
};

const signals = [
  ["Exact admission number", "After cleaning up “ADM”, spaces, dashes and leading zeros", "Certain"],
  ["Exact family code", "One payment for every child in the family", "Certain"],
  ["Registered guardian phone", "The payer’s number matches a guardian on record", "Very strong"],
  ["Learned phone", "A number Shulife has learned from your past decisions", "Strong"],
  ["Name in the reference", "“KAMAU GRADE 4” — fuzzy matched within the grade", "Good"],
  ["Admission number typo", "One digit off — suggested, never applied on its own", "Suggestion"],
  ["Payer name and amount", "Similar to a guardian’s name, or equal to a balance or instalment", "Supporting"],
];

function MatchCard() {
  const suggestions = [
    { name: "Otieno family", why: "Guardian phone · amount equals balance", pct: 86 },
    { name: "Otieno, Brian (G7)", why: "Name in reference", pct: 54 },
    { name: "Atieno family", why: "Similar payer name", pct: 31 },
  ];
  return (
    <div className="rounded-[2rem] bg-cream-50 p-6 shadow-lift ring-1 ring-navy-900/10 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-700">Review queue · 12 left, about 3 minutes</p>
        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-navy-100">
          <div className="h-full w-3/4 rounded-full bg-navy-900" />
        </div>
      </div>
      <div className="mt-5 rounded-2xl bg-navy-900 p-5 text-cream-50">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-display text-3xl">
            <Money amount={23500} />
          </p>
          <p className="text-sm text-cream-100/70">Today 07:42 · M-Pesa</p>
        </div>
        <p className="mt-2 text-sm text-cream-100/80">
          Ref: <span className="font-mono text-gold-300">“OTIENO FEES”</span> · from 0722 •••• 41 · J. OTIENO
        </p>
      </div>
      <ol className="mt-5 space-y-3">
        {suggestions.map((s, i) => (
          <li key={s.name} className={`flex items-center gap-4 rounded-2xl p-4 ring-1 ${i === 0 ? "bg-gold-200/40 ring-gold-400" : "ring-navy-900/10"}`}>
            <kbd className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-navy-900 font-mono text-sm text-cream-50">{i + 1}</kbd>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-navy-900">{s.name}</p>
              <p className="truncate text-sm text-ink-600">{s.why}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-navy-100">
                <div className="h-full rounded-full bg-gold-500" style={{ width: `${s.pct}%` }} />
              </div>
            </div>
            <span className="tabular text-sm font-semibold text-navy-900">{s.pct}</span>
          </li>
        ))}
      </ol>
      <div className="mt-5 flex flex-wrap gap-2 text-xs text-ink-600">
        {[
          ["F", "Assign to family and split"],
          ["N", "Not ours"],
          ["S", "Skip"],
        ].map(([k, l]) => (
          <span key={k} className="inline-flex items-center gap-1.5 rounded-full bg-cream-100 px-3 py-1.5">
            <kbd className="font-mono font-bold text-navy-900">{k}</kbd> {l}
          </span>
        ))}
      </div>
    </div>
  );
}

function CashUp() {
  const rows = [
    ["Cash", 3, 18500],
    ["Cheques", 2, 64000],
    ["Bank slips", 4, 121000],
  ] as const;
  return (
    <div className="rounded-[2rem] bg-navy-900 p-6 text-cream-50 shadow-lift sm:p-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-cream-100/70">Daily cash-up · Front office</p>
          <p className="font-display text-2xl">Tuesday 12 January</p>
        </div>
        <Icon.Receipt className="size-7 text-gold-300" />
      </div>
      <table className="mt-6 w-full text-sm tabular">
        <tbody>
          {rows.map(([t, n, a]) => (
            <tr key={t} className="border-b border-cream-50/10">
              <td className="py-3">{t}</td>
              <td className="py-3 text-cream-100/60">{n} receipts</td>
              <td className="py-3 text-right font-semibold">
                <Money amount={a} />
              </td>
            </tr>
          ))}
          <tr>
            <td className="pt-4 font-semibold text-gold-300">Total</td>
            <td />
            <td className="pt-4 text-right font-display text-2xl text-gold-300">
              <Money amount={203500} />
            </td>
          </tr>
        </tbody>
      </table>
      <div className="mt-6 flex items-center gap-3 rounded-2xl bg-navy-800 p-4 text-sm">
        <Icon.Bank className="size-5 shrink-0 text-gold-300" />
        Banked and matched to deposit slip · no variance
      </div>
      <p className="mt-4 text-xs text-cream-100/50">Illustrative example with fictional figures.</p>
    </div>
  );
}

export default function ForBursarsPage() {
  return (
    <>
      <PageHero
        eyebrow="For bursars and accounts"
        title={
          <>
            Get your <span className="italic text-gold-600">week</span> back.
          </>
        }
        intro="No more matching hundreds of M-Pesa messages by hand at the start of term. Shulife does the matching, the splitting and the receipting — you handle the few that need a human."
        actions={
          <>
            <Button href="/book-demo/" arrow>
              Book a free demo
            </Button>
            <Button href="#matching" variant="outline">
              How matching works
            </Button>
          </>
        }
        photo={{ name: "bursar", alt: "A smiling bursar working calmly at her laptop", position: "object-[50%_30%]" }}
      />

      {site.demoVideoUrl && (
        <section className="pb-8">
          <Container>
            <div className="aspect-video overflow-hidden rounded-[2rem] bg-navy-900">
              <iframe src={site.demoVideoUrl} title="Shulife for bursars" className="size-full" allow="fullscreen" />
            </div>
          </Container>
        </section>
      )}

      <section id="matching" className="scroll-mt-20 bg-cream-100 py-24 sm:py-32">
        <Container className="grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <div className="min-w-0">
            <SectionHeading eyebrow="Matching, explained" title="Seven signals. One confident match." intro="Shulife scores every possible family or learner and only applies a payment automatically when it is very confident and clearly ahead of the next option. Everything else comes to you." />
            <Reveal className="mt-10 overflow-hidden rounded-3xl bg-cream-50 ring-1 ring-navy-900/10">
              <table className="w-full text-left">
                <thead className="bg-navy-900 text-cream-50">
                  <tr>
                    <th className="px-5 py-3 text-sm font-semibold">Signal</th>
                    <th className="px-5 py-3 text-right text-sm font-semibold">Strength</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-900/10">
                  {signals.map(([t, d, s]) => (
                    <tr key={t}>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-navy-900">{t}</p>
                        <p className="text-sm text-ink-600">{d}</p>
                      </td>
                      <td className="px-5 py-4 text-right text-sm font-semibold text-gold-700">{s}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Reveal>
          </div>
          <div className="min-w-0 lg:pt-24">
            <Reveal>
              <Eyebrow>The review queue</Eyebrow>
              <h3 className="font-display text-3xl text-navy-900 sm:text-4xl">Keyboard-fast. And it learns.</h3>
              <p className="mt-4 text-lg leading-relaxed text-ink-600">Each uncertain payment shows the top three suggestions with the reasons. Press 1, 2 or 3 to assign. Every decision teaches Shulife the payer’s phone for next time.</p>
            </Reveal>
            <Reveal delay={100} className="mt-8">
              <MatchCard />
            </Reveal>
          </div>
        </Container>
      </section>

      <section id="siblings" className="scroll-mt-20 py-24 sm:py-32">
        <Container>
          <SectionHeading eyebrow="Sibling rules" title="One payment for three children? Split by your rule." intro="Choose how your school shares family payments. Parents get a confirmation of the split with a link to request a change, which comes to you as a simple reallocation." className="mb-12" />
          <Reveal>
            <SiblingDemo />
          </Reveal>
        </Container>
      </section>

      <section id="cash" className="scroll-mt-20 bg-cream-100 py-24 sm:py-32">
        <Container className="space-y-28">
          <FeatureRow
            eyebrow="Cash, cheques and banking"
            title="Every way parents pay, in one clean ledger."
            body="Record cash, cheques and bank slips with a photo in seconds. Import bank statements so Paybill payments to your bank go through the same matching. Close each day with a cash-up report and match it to your banking."
            points={["Manual receipts with slip photos, all audited", "Bank statement import (CSV)", "Unbanked cash alerts after the days you choose", "Locked days — changes need an approved adjustment"]}
            visual={<CashUp />}
          />
        </Container>
      </section>

      <section className="py-24 sm:py-32">
        <Container>
          <SectionHeading center eyebrow="The rest of your term" title="Invoices, close and reports — in clicks." />
          <div className="mt-14">
            <FeatureGrid
              cols={3}
              items={[
                { t: "Fee structure matrix", d: "Grades × fee items in a familiar grid. Copy last term, add an uplift and compare before publishing.", icon: Icon.Chart },
                { t: "Invoice the whole school", d: "Preview, then invoice every learner — with optional items, discounts and sponsors applied.", icon: Icon.Receipt },
                { t: "Term close", d: "Lock the term and carry every balance forward with full history.", icon: Icon.Calendar },
                { t: "One-click reports", d: "Collection by grade and stream, fee items, plans, waivers, cash-up and banking.", icon: Icon.Book },
                { t: "Never edit, always adjust", d: "Payments and ledger entries are permanent. Corrections are new, approved entries.", icon: Icon.Lock },
                { t: "Fee items and voteheads", d: "Use the names your school already uses, with your own allocation priority.", icon: Icon.Split },
              ]}
            />
          </div>
          <Reveal className="mx-auto mt-14 max-w-2xl rounded-3xl bg-navy-900 p-8 text-cream-50 sm:p-10">
            <h3 className="font-display text-3xl">What you’ll stop doing</h3>
            <Checklist
              tone="dark"
              className="mt-6"
              items={["Matching M-Pesa messages to admission numbers by hand", "Writing receipt books at the window", "Building invoices from scratch in Excel every term", "Answering “what’s my balance?” calls all day"]}
            />
          </Reveal>
        </Container>
      </section>

      <CtaBand title={<>Give your bursar their <span className="italic text-gold-300">week</span> back.</>} />
    </>
  );
}
