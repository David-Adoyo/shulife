import type { Metadata } from "next";
import { FullyCollected } from "@/components/blocks";
import { Icon } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { CtaBand, DashboardMock, FeatureRow, PageHero, SectionHeading } from "@/components/shared";
import { Button, Container, Money } from "@/components/ui";

export const metadata: Metadata = {
  title: "For directors and owners",
  description: "See collection by grade in real time, plan cash for the next 30 days, run several campuses from one view and protect your school’s reputation with kinder clearance.",
};

const pains = [
  ["I can’t see collections without asking the bursar.", "A live dashboard: collected today and this term, % by grade and stream, top balances and plans on track."],
  ["Cash-flow gaps when salaries and suppliers are due.", "A 30-day cash projection from instalment plans, Ratiba and your own payment history."],
  ["I worry about leakage and errors.", "Money flows straight to the school account. Every manual entry is audited, with daily cash-up variance alerts."],
  ["Several campuses, no single view.", "A multi-campus organisation with a group dashboard and a campus switcher."],
  ["Sending children home damages our reputation.", "Private, polite parent outreach and payment plans replace the conversation at the gate."],
  ["Parents feel overcharged and complain.", "Itemised, transparent invoices and a published fee structure in the parent portal."],
];

function Projection() {
  const base = [8, 14, 22, 27, 31, 36, 40, 44, 47, 50, 53, 55];
  const w = 520;
  const h = 200;
  const pts = base.map((v, i) => [(i / (base.length - 1)) * w, h - (v / 60) * h] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const upper = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${(y - 6 - i * 1.6).toFixed(1)}`).join(" ");
  const lower = [...pts].reverse().map(([x, y], i) => `L${x.toFixed(1)} ${(y + 6 + (base.length - 1 - i) * 1.6).toFixed(1)}`).join(" ");
  return (
    <div className="rounded-[2rem] bg-cream-50 p-6 shadow-soft ring-1 ring-navy-900/5 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-700">Cash projected · next 30 days</p>
          <p className="mt-1 font-display text-4xl text-navy-900">
            <Money amount={2_740_000} />
          </p>
        </div>
        <div className="flex gap-1 rounded-full bg-cream-100 p-1 text-sm font-semibold">
          {["30", "60", "90"].map((d, i) => (
            <span key={d} className={`rounded-full px-3 py-1 ${i === 0 ? "bg-navy-900 text-cream-50" : "text-navy-900"}`}>
              {d} days
            </span>
          ))}
        </div>
      </div>
      <svg viewBox={`0 -20 ${w} ${h + 40}`} className="mt-6 w-full" role="img" aria-label="Projected cash rising over the next 30 days, with a confidence band">
        {[0, 1, 2, 3].map((i) => (
          <line key={i} x1="0" x2={w} y1={(h / 3) * i} y2={(h / 3) * i} stroke="var(--color-cream-200)" />
        ))}
        <path d={`${upper} ${lower} Z`} fill="var(--color-gold-200)" opacity="0.7" />
        <path d={line} fill="none" stroke="var(--color-navy-900)" strokeWidth="3" strokeLinecap="round" />
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="6" fill="var(--color-gold-500)" stroke="white" strokeWidth="2" />
      </svg>
      <p className="mt-4 rounded-xl bg-cream-100 p-3 text-sm text-ink-600">
        <b className="text-navy-900">Note:</b> 14 plan instalments and 22 Ratiba payments are due before salaries on the 28th.
      </p>
      <p className="mt-3 text-xs text-ink-400">Illustrative example with fictional data. Projections need at least one term of history.</p>
    </div>
  );
}

function ClearanceBoard() {
  const cols = [
    { t: "Cleared", cls: "bg-paid/10 text-paid", names: ["Amani O.", "Wanjiru K.", "Priya S.", "Liam M.", "Neema A."] },
    { t: "On plan", cls: "bg-partial/10 text-partial", names: ["Baraka O.", "Chen L."] },
    { t: "Not cleared", cls: "bg-due/10 text-due", names: ["Kioko M."] },
    { t: "Overridden", cls: "bg-navy-100 text-navy-700", names: ["Fatma H."] },
  ];
  return (
    <div className="rounded-[2rem] bg-navy-900 p-6 text-cream-50 shadow-lift sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-cream-100/70">Grade 6 East · Science trip</p>
          <p className="font-display text-2xl">Clearance board</p>
        </div>
        <span className="rounded-full bg-cream-50/10 px-3 py-1 text-xs font-semibold">No amounts shown</span>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cols.map((c) => (
          <div key={c.t} className="rounded-2xl bg-navy-800 p-3">
            <p className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${c.cls}`}>{c.t}</p>
            <ul className="mt-3 space-y-1.5">
              {c.names.map((n) => (
                <li key={n} className="rounded-lg bg-cream-50/10 px-2 py-1.5 text-xs">
                  {n}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-5 text-xs text-cream-100/50">Fictional learners. Teachers see exactly this — status only.</p>
    </div>
  );
}

export default function ForDirectorsPage() {
  return (
    <>
      <PageHero
        eyebrow="For directors and owners"
        title={
          <>
            Your whole school, <span className="italic text-gold-600">at a glance.</span>
          </>
        }
        intro="Know what’s collected today, what’s coming in next month and which classes need attention — without asking anyone for a report."
        actions={
          <>
            <Button href="/book-demo/" arrow>
              Book a free demo
            </Button>
            <Button href="/pricing/" variant="outline">
              How pricing works
            </Button>
          </>
        }
        photo={{ name: "director", alt: "A confident school director walking along a sunlit corridor with smiling students", position: "object-[35%_50%]" }}
      />

      <section className="bg-cream-100 py-24 sm:py-32">
        <Container>
          <SectionHeading eyebrow="Sound familiar?" title="What keeps directors up at night — solved." />
          <div className="mt-14 grid gap-4 md:grid-cols-2">
            {pains.map(([p, s], i) => (
              <Reveal key={p} delay={(i % 2) * 80} className="grid gap-4 rounded-3xl bg-cream-50 p-6 shadow-soft ring-1 ring-navy-900/5 sm:grid-cols-[1fr_auto_1.2fr] sm:items-center sm:p-7">
                <p className="font-display text-xl leading-snug text-navy-900">“{p}”</p>
                <Icon.Arrow className="size-5 text-gold-500 max-sm:rotate-90" />
                <p className="text-ink-600">{s}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-24 sm:py-32">
        <Container className="space-y-28">
          <FeatureRow
            eyebrow="Live dashboard"
            title="See the whole school at once."
            body="The term collection ring, a heatmap of every grade and stream, today’s payments as they arrive and a short list of what needs your attention."
            points={["Collected today and this term", "Share of payments matched automatically", "Review queue, unbanked cash and parent messages in one place"]}
            visual={<DashboardMock />}
          />
          <FeatureRow
            reverse
            eyebrow="Cash projection"
            title="Plan for salaries with confidence."
            body="Shulife projects what will arrive in the next 30, 60 and 90 days from plan instalments, Ratiba mandates and how your own families paid in past terms — with plain-English notes."
            visual={<Projection />}
          />
          <FeatureRow
            id="clearance"
            eyebrow="Kinder clearance"
            title="Kinder than sending children home."
            body="A week before exams or trips, families who haven’t cleared get a private, polite message with options to pay or agree a plan. The day before, teachers get a list showing status only."
            points={["Clear if paid above your threshold, or on a plan with no missed instalment", "Overrides by the head or bursar, with a reason", "Nothing ever shown to learners or other parents"]}
            visual={<ClearanceBoard />}
          />
        </Container>
      </section>

      <section className="bg-navy-950 py-24 text-cream-50 sm:py-32">
        <Container className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <SectionHeading tone="dark" eyebrow="Peace of mind" title="Your money, your school, your control." intro="Shulife never holds fees. Every payment goes straight to the school’s own account, and every manual change leaves a trail you can read." />
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Multi-campus groups", "One login, every campus, a group dashboard.", Icon.Gate],
              ["Daily cash-up alerts", "Variances between receipts and banking flagged to you.", Icon.Bell],
              ["Approved waivers", "Waivers above a limit need your approval.", Icon.Check],
              ["Activity log", "Every money, permission and export action, visible to you.", Icon.Lock],
            ].map(([t, d, I]) => {
              const C = I as typeof Icon.Bell;
              return (
                <Reveal key={t as string} className="rounded-3xl bg-navy-900 p-7 ring-1 ring-cream-50/5">
                  <C className="size-7 text-gold-300" />
                  <h3 className="mt-5 text-lg font-bold">{t as string}</h3>
                  <p className="mt-2 text-cream-100/70">{d as string}</p>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </section>

      <section className="py-24 sm:py-28">
        <Container className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <FullyCollected />
          </Reveal>
          <Reveal delay={100}>
            <h2 className="font-display text-4xl leading-tight text-navy-900">Pricing that grows with your school.</h2>
            <p className="mt-4 text-lg text-ink-600">Per enrolled learner, per term — and free until your first payment is matched automatically.</p>
            <div className="mt-8">
              <Button href="/pricing/" variant="navy" arrow>
                See pricing
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
