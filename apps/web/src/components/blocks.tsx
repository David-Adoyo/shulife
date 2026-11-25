import { Ripple } from "./brand";
import { Icon } from "./icons";
import { Reveal } from "./reveal";
import { Button, Container } from "./ui";

/* Reusable marketing blocks shared by the home page and inner pages. */

export function TrustStrip() {
  const items = ["Your money never touches us", "Works with your existing Paybill", "Alongside any school system", "No app for parents", "English and Kiswahili", "Live in an afternoon"];
  const row = [...items, ...items];
  return (
    <section aria-label="Our commitments" className="overflow-hidden bg-navy-900 py-5 text-cream-50">
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap motion-reduce:animate-none">
        {row.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-10 text-[0.95rem] font-semibold tracking-wide" aria-hidden={i >= items.length}>
            {t}
            <span className="size-1.5 rounded-full bg-gold-400" />
          </span>
        ))}
      </div>
    </section>
  );
}

export function ThreeSteps() {
  const steps = [
    { n: "01", t: "Bill", d: "Build your fee structure once — grades, terms, optional items like lunch, transport and boarding — and invoice the whole school in one click.", icon: Icon.Receipt },
    { n: "02", t: "Collect", d: "Parents pay into your own Paybill or bank with the admission number. Shulife matches every payment and splits it between siblings by your rule.", icon: Icon.Phone },
    { n: "03", t: "Confirm", d: "Receipts go out in seconds. Parents see their balance, you see collection by class in real time, and the ledger stays clean.", icon: Icon.Check },
  ];
  return (
    <ol className="relative space-y-6">
      <span aria-hidden className="absolute bottom-10 left-[2.15rem] top-10 w-px bg-gradient-to-b from-gold-400 via-navy-900/20 to-gold-400 max-sm:hidden" />
      {steps.map((s, i) => (
        <Reveal as="li" key={s.n} delay={i * 120} className="relative flex gap-6 rounded-3xl bg-cream-50 p-6 shadow-soft sm:p-8">
          <span className="relative z-10 inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-navy-900 text-gold-300 sm:size-[3.2rem]">
            <s.icon className="size-5 sm:size-6" />
          </span>
          <div>
            <p className="text-sm font-bold tracking-[0.16em] text-gold-700">{s.n}</p>
            <h3 className="font-display text-3xl text-navy-900">{s.t}</h3>
            <p className="mt-3 text-lg leading-relaxed text-ink-600">{s.d}</p>
          </div>
        </Reveal>
      ))}
    </ol>
  );
}

export const matchSignals = [
  ["Admission number", "ADM 2041, 2041 grade 8, adm-2041"],
  ["Family code", "One payment for every child"],
  ["Guardian phone", "The number on record"],
  ["Learned phone", "A grandparent who always pays"],
  ["Name in reference", "“OTIENO GRADE 8”"],
] as const;

export function PlansCarousel() {
  const cards = [
    { k: "Payment plans", t: "Pay over the term, agreed with the school", d: "Instalments accepted by OTP, with a reminder two days before each one — and on the day.", cls: "bg-navy-900 text-cream-50", accent: "text-gold-300" },
    { k: "M-PESA Ratiba", t: "Set it once. Pay on time, every time.", d: "Optional standing orders so instalments go through automatically.", cls: "bg-gold-300 text-navy-950", accent: "text-navy-700" },
    { k: "Family code", t: "One payment for every child", d: "Use the family code and Shulife shares the payment between siblings.", cls: "bg-cream-50 text-navy-900 ring-1 ring-navy-900/10", accent: "text-gold-700" },
    { k: "Kinder clearance", t: "Kinder than sending children home", d: "Parents get a private, polite message a week before exams or trips, with options to pay or agree a plan.", cls: "bg-navy-800 text-cream-50", accent: "text-gold-300" },
    { k: "Cash, cheque and bank", t: "Every way parents pay, in one ledger", d: "Manual receipts with a slip photo, bank statement import and a daily cash-up report.", cls: "bg-cream-200 text-navy-900", accent: "text-gold-700" },
  ];
  return (
    <div className="no-scrollbar mt-14 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-6 sm:px-8 lg:px-[max(3rem,calc((100vw-1240px)/2+3rem))]">
      {cards.map((c, i) => (
        <Reveal key={c.k} delay={i * 80} className={`flex min-h-[360px] w-[300px] shrink-0 snap-start flex-col rounded-[2rem] p-8 sm:w-[340px] ${c.cls}`}>
          <p className={`text-xs font-bold uppercase tracking-[0.16em] ${c.accent}`}>{c.k}</p>
          <h3 className="mt-6 font-display text-[2rem] leading-[1.1]">{c.t}</h3>
          <p className="mt-auto pt-8 leading-relaxed opacity-80">{c.d}</p>
        </Reveal>
      ))}
    </div>
  );
}

export function FullyCollected() {
  return (
    <div className="flex-1 rounded-[2rem] bg-cream-50 p-7 shadow-soft ring-1 ring-navy-900/5">
      <div className="flex items-center gap-3">
        <span className="relative inline-flex size-11 items-center justify-center rounded-full bg-gold-200 text-navy-900">
          <Ripple className="rounded-full" />
          <Icon.Sparkle className="size-5" />
        </span>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-700">Fully collected</p>
      </div>
      <p className="mt-4 font-display text-2xl leading-snug text-navy-900">Grade 4 East is fully paid for Term 1.</p>
      <p className="mt-2 text-ink-600">A small celebration when a class reaches 100%. Multi-campus groups see every campus in one view.</p>
    </div>
  );
}

export function NoApp() {
  return (
    <section className="pb-24 sm:pb-32">
      <Container>
        <Reveal className="relative grid items-center gap-10 overflow-hidden rounded-[2.5rem] bg-gold-300 p-8 sm:p-14 lg:grid-cols-2">
          <div aria-hidden className="absolute -right-20 -top-20 size-80 rounded-full border-[40px] border-navy-900/5" />
          <div className="relative">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-navy-800">For parents</p>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] text-navy-950 sm:text-6xl">
              No app.
              <br />
              No password.
              <br />
              <span className="italic">No problem.</span>
            </h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-navy-900/80">M-Pesa, SMS, WhatsApp and a light portal that opens on any phone — even on a slow connection.</p>
            <div className="mt-8">
              <Button href="/for-parents/" variant="navy" arrow>
                Help for parents
              </Button>
            </div>
          </div>
          <div className="relative grid grid-cols-2 gap-4">
            {[
              ["BALANCE", "SALIO", "Your family balance"],
              ["STATEMENT", "TAARIFA", "This term’s statement"],
              ["RECEIPT", "RISITI", "Your latest receipt"],
              ["HELP", "MSAADA", "Talk to the school"],
            ].map(([en, sw, d]) => (
              <div key={en} className="rounded-2xl bg-cream-50 p-5 shadow-soft">
                <p className="font-mono text-sm font-bold text-navy-900">
                  {en} <span className="text-ink-400">/</span> {sw}
                </p>
                <p className="mt-2 text-sm text-ink-600">{d}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
