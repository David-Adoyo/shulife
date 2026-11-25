import { Header } from "@/components/header";
import { Hero, Ring } from "@/components/hero";
import { SiblingDemo } from "@/components/sibling-demo";
import { ConnectTabs } from "@/components/connect-tabs";
import { Calculator } from "@/components/calculator";
import { DemoForm } from "@/components/demo-form";
import { Footer } from "@/components/footer";
import { Reveal } from "@/components/reveal";
import { Ripple, Mark } from "@/components/brand";
import { Icon } from "@/components/icons";
import { Button, Container, Eyebrow, Money } from "@/components/ui";

export default function Home() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-navy-900 focus:px-5 focus:py-3 focus:text-cream-50">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Hero />
        <TrustStrip />
        <TermStory />
        <HowItWorks />
        <Collect />
        <Pillars />
        <Connect />
        <Plans />
        <Grow />
        <SchoolLife />
        <Security />
        <Pricing />
        <NoApp />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}

/* ---------- Trust strip ---------- */
function TrustStrip() {
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

/* ---------- Every term starts the same way ---------- */
function TermStory() {
  const stories = [
    {
      who: "The bursar",
      before: "A lost week at the start of every term, matching hundreds of M-Pesa messages to admission numbers.",
      after: "Payments match themselves. Only the odd one waits in a one-tap review queue — and it learns.",
      icon: Icon.Match,
    },
    {
      who: "The front office",
      before: "“Whose fees is this?” A payment with a child's name, a grandparent's phone, or no reference at all.",
      after: "Admission number, guardian phone, learned phone and name signals find the right family.",
      icon: Icon.Users,
    },
    {
      who: "The parent",
      before: "“But I paid!” A lost M-Pesa message, an anxious child, an awkward conversation at the gate.",
      after: "An instant receipt, a live balance and a statement any time — on the phone they already have.",
      icon: Icon.Heart,
    },
  ];
  return (
    <section className="py-24 sm:py-32">
      <Container>
        <Reveal className="max-w-3xl">
          <Eyebrow>The start-of-term rush</Eyebrow>
          <h2 className="font-display text-4xl leading-[1.08] text-navy-900 sm:text-[3.4rem]">Every term starts the same way. It doesn’t have to.</h2>
        </Reveal>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {stories.map((s, i) => (
            <Reveal key={s.who} delay={i * 120} className="group flex flex-col overflow-hidden rounded-3xl bg-cream-100 ring-1 ring-navy-900/5">
              <div className="p-7 sm:p-8">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold uppercase tracking-[0.14em] text-ink-600">{s.who}</p>
                  <s.icon className="size-6 text-gold-600" />
                </div>
                <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-due">Before</p>
                <p className="mt-2 text-lg leading-relaxed text-ink-600">{s.before}</p>
              </div>
              <div className="mt-auto bg-navy-900 p-7 text-cream-50 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-300">With Shulife</p>
                <p className="mt-2 text-lg leading-relaxed">{s.after}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------- How it works ---------- */
function HowItWorks() {
  const steps = [
    { n: "01", t: "Bill", d: "Build your fee structure once — grades, terms, optional items like lunch, transport and boarding — and invoice the whole school in one click.", icon: Icon.Receipt },
    { n: "02", t: "Collect", d: "Parents pay into your own Paybill or bank with the admission number. Shulife matches every payment and splits it between siblings by your rule.", icon: Icon.Phone },
    { n: "03", t: "Confirm", d: "Receipts go out in seconds. Parents see their balance, you see collection by class in real time, and the ledger stays clean.", icon: Icon.Check },
  ];
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-cream-100 py-24 sm:py-32">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <Reveal>
            <Eyebrow>How it works</Eyebrow>
            <h2 className="font-display text-4xl leading-[1.08] text-navy-900 sm:text-[3.4rem]">Three steps to a calmer term.</h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-600">Shulife works alongside the school system you already use. Import your learners from Excel, connect your Paybill, and you are live in an afternoon.</p>
            <div className="mt-10 overflow-hidden rounded-3xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/bursar-800.webp" alt="A smiling bursar working calmly at a laptop in a bright, tidy office" loading="lazy" className="aspect-[4/3] w-full object-cover object-[50%_30%]" />
            </div>
          </Reveal>
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
        </div>
      </Container>
    </section>
  );
}

/* ---------- Big kinetic words ---------- */
function BigWord({ word, tone = "light" }: { word: string; tone?: "light" | "dark" }) {
  return (
    <p aria-hidden className={`select-none font-display text-[19vw] font-semibold leading-[0.82] tracking-[-0.05em] sm:text-[11rem] lg:text-[11.5rem] xl:text-[12.5rem] ${tone === "light" ? "text-navy-900" : "text-cream-50"}`}>
      {word}
      <br />
      <span className="italic text-transparent [-webkit-text-stroke:2px_var(--color-gold-500)]">smarter</span>
    </p>
  );
}

/* ---------- Collect smarter ---------- */
function Collect() {
  const signals = [
    ["Admission number", "ADM 2041, 2041 grade 8, adm-2041"],
    ["Family code", "One payment for every child"],
    ["Guardian phone", "The number on record"],
    ["Learned phone", "A grandparent who always pays"],
    ["Name in reference", "“OTIENO GRADE 8”"],
  ];
  return (
    <section id="collect" className="scroll-mt-20 overflow-hidden py-24 sm:py-32">
      <Container>
        <div className="grid items-end gap-10 lg:grid-cols-[1.2fr_1fr]">
          <Reveal>
            <BigWord word="collect" />
          </Reveal>
          <Reveal delay={150} className="pb-4">
            <h2 className="font-display text-3xl leading-tight text-navy-900 sm:text-4xl">Every payment matched. Every parent receipted. Instantly.</h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-600">Parents type the wrong account number, a child’s name, or nothing at all. Shulife reads it all — and sends anything uncertain to a review queue with ranked suggestions.</p>
          </Reveal>
        </div>

        <Reveal className="no-scrollbar -mx-5 mt-14 flex gap-3 overflow-x-auto px-5 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-5">
          {signals.map(([t, d], i) => (
            <div key={t} className="min-w-[220px] flex-1 rounded-2xl sm:min-w-0 bg-cream-100 p-5 ring-1 ring-navy-900/5">
              <p className="text-xs font-bold tracking-[0.16em] text-gold-700">SIGNAL {i + 1}</p>
              <p className="mt-2 font-semibold text-navy-900">{t}</p>
              <p className="mt-1 text-sm text-ink-600">{d}</p>
            </div>
          ))}
        </Reveal>

        <div id="siblings" className="mt-24 scroll-mt-24">
          <Reveal className="mb-12 max-w-2xl">
            <Eyebrow>The sibling moment</Eyebrow>
            <h3 className="font-display text-4xl leading-tight text-navy-900 sm:text-5xl">One payment. Three children. Sorted automatically.</h3>
            <p className="mt-5 text-lg leading-relaxed text-ink-600">Drop a payment onto the family and watch it split by your school’s rule. Switch rules to compare.</p>
          </Reveal>
          <Reveal>
            <SiblingDemo />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Feature pillars ---------- */
function Pillars() {
  const pillars = [
    { t: "Automatic matching", d: "Admission number, phone and name signals — with a review queue that learns.", icon: Icon.Match },
    { t: "Sibling splits", d: "One payment shared between children by your rule, confirmed to the parent.", icon: Icon.Split },
    { t: "Itemised statements", d: "Every child, every fee item, every term — with balance brought forward.", icon: Icon.Receipt },
    { t: "Balance on WhatsApp", d: "Parents send BALANCE or SALIO and get an answer in seconds.", icon: Icon.Chat },
    { t: "Payment plans + Ratiba", d: "Agreed instalments with reminders and optional M-PESA Ratiba auto-pay.", icon: Icon.Calendar },
    { t: "Kinder clearance", d: "Parents hear first, privately and politely. Teachers see status, never amounts.", icon: Icon.Heart },
    { t: "Director’s dashboard", d: "Collection by grade and stream, live — and cash projected for 30 days.", icon: Icon.Chart },
    { t: "Notices with read receipts", d: "The right parents, the right language, and proof it was read.", icon: Icon.Bell },
  ];
  return (
    <section id="features" className="scroll-mt-20 bg-cream-100 py-24 sm:py-32">
      <Container>
        <Reveal className="mx-auto max-w-3xl text-center">
          <Eyebrow>Everything for fees and parents</Eyebrow>
          <h2 className="font-display text-4xl leading-[1.08] text-navy-900 sm:text-[3.4rem]">Eight things your school will never do by hand again.</h2>
        </Reveal>
        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p, i) => (
            <Reveal key={p.t} delay={(i % 4) * 80} className="group rounded-3xl bg-cream-50 p-7 shadow-soft ring-1 ring-navy-900/5 transition duration-300 hover:-translate-y-1 hover:bg-navy-900 hover:shadow-lift">
              <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-gold-200 text-navy-900 transition group-hover:bg-gold-400">
                <p.icon className="size-6" />
              </span>
              <h3 className="mt-6 text-lg font-bold text-navy-900 transition group-hover:text-cream-50">{p.t}</h3>
              <p className="mt-2 leading-relaxed text-ink-600 transition group-hover:text-cream-100/80">{p.d}</p>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Connect smarter ---------- */
function Connect() {
  return (
    <section id="connect" className="relative scroll-mt-20 overflow-hidden bg-navy-900 py-24 text-cream-50 sm:py-32">
      <div aria-hidden className="absolute -right-40 top-20 size-[36rem] rounded-full border-[48px] border-cream-50/[0.03]" />
      <Container className="relative">
        <div className="grid items-end gap-10 lg:grid-cols-[1.2fr_1fr]">
          <Reveal>
            <BigWord word="connect" tone="dark" />
          </Reveal>
          <Reveal delay={150} className="pb-4">
            <h2 className="font-display text-3xl leading-tight sm:text-4xl">Parents love it too.</h2>
            <p className="mt-5 text-lg leading-relaxed text-cream-100/80">Receipts, balances and notices on the phone parents already have — in English or Kiswahili. Their goodwill brings fees in faster.</p>
          </Reveal>
        </div>
        <div className="mt-16">
          <ConnectTabs />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Plans carousel ---------- */
function Plans() {
  const cards = [
    { k: "Payment plans", t: "Pay over the term, agreed with the school", d: "Instalments accepted by OTP, with a reminder two days before each one — and on the day.", cls: "bg-navy-900 text-cream-50", accent: "text-gold-300" },
    { k: "M-PESA Ratiba", t: "Set it once. Pay on time, every time.", d: "Optional standing orders so instalments go through automatically.", cls: "bg-gold-300 text-navy-950", accent: "text-navy-700" },
    { k: "Family code", t: "One payment for every child", d: "Use the family code and Shulife shares the payment between siblings.", cls: "bg-cream-50 text-navy-900 ring-1 ring-navy-900/10", accent: "text-gold-700" },
    { k: "Kinder clearance", t: "Kinder than sending children home", d: "Parents get a private, polite message a week before exams or trips, with options to pay or agree a plan.", cls: "bg-navy-800 text-cream-50", accent: "text-gold-300" },
    { k: "Cash, cheque and bank", t: "Every way parents pay, in one ledger", d: "Manual receipts with a slip photo, bank statement import and a daily cash-up report.", cls: "bg-cream-200 text-navy-900", accent: "text-gold-700" },
  ];
  return (
    <section id="plans" className="scroll-mt-20 overflow-hidden py-24 sm:py-32">
      <Container>
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <Eyebrow>Flexible for families</Eyebrow>
            <h2 className="font-display text-4xl leading-[1.08] text-navy-900 sm:text-[3.4rem]">
              Pay in full or pay over time. <span className="italic text-gold-600">It’s their choice.</span>
            </h2>
          </div>
          <p className="max-w-sm text-lg text-ink-600">No late fees by default. No shaming. Just clear options that help families pay.</p>
        </Reveal>
      </Container>
      <div className="no-scrollbar mt-14 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-6 sm:px-8 lg:px-[max(3rem,calc((100vw-1240px)/2+3rem))]">
        {cards.map((c, i) => (
          <Reveal key={c.k} delay={i * 80} className={`flex min-h-[360px] w-[300px] shrink-0 snap-start flex-col rounded-[2rem] p-8 sm:w-[340px] ${c.cls}`}>
            <p className={`text-xs font-bold uppercase tracking-[0.16em] ${c.accent}`}>{c.k}</p>
            <h3 className="mt-6 font-display text-[2rem] leading-[1.1]">{c.t}</h3>
            <p className="mt-auto pt-8 leading-relaxed opacity-80">{c.d}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- Grow smarter: director's view ---------- */
function Grow() {
  const grades = ["PP1", "PP2", "G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9"];
  const east = [92, 88, 100, 81, 76, 100, 69, 84, 58, 73, 90];
  const west = [85, 94, 79, 100, 88, 71, 92, 63, 81, 66, 77];
  const tone = (v: number) => (v === 100 ? "bg-paid text-white" : v >= 85 ? "bg-paid/70 text-white" : v >= 75 ? "bg-partial/60 text-navy-950" : v >= 65 ? "bg-partial/35 text-navy-950" : "bg-due/60 text-white");
  const projection = [12, 18, 15, 24, 30, 22, 28, 35, 31, 40, 38, 46];
  return (
    <section id="grow" className="scroll-mt-20 bg-cream-100 py-24 sm:py-32">
      <Container>
        <div className="grid items-end gap-10 lg:grid-cols-[1.2fr_1fr]">
          <Reveal>
            <BigWord word="grow" />
          </Reveal>
          <Reveal delay={150} className="pb-4">
            <h2 className="font-display text-3xl leading-tight text-navy-900 sm:text-4xl">See the whole school at once.</h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-600">Collection by grade and stream in real time, cash projected for the next 30 days, and every manual entry audited. No more asking the bursar.</p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <Reveal className="min-w-0 rounded-[2rem] bg-navy-900 p-6 text-cream-50 shadow-lift sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Mark tone="cream" className="h-8 w-auto" />
                <div>
                  <p className="text-sm text-cream-100/70">Mlima Academy · Ruiru</p>
                  <p className="font-semibold">Term 1 · 2027</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-cream-50/10 px-3 py-1.5 text-xs font-semibold">
                <span className="relative size-2 rounded-full bg-paid">
                  <span className="absolute inset-0 animate-ping rounded-full bg-paid" />
                </span>
                Live
              </span>
            </div>

            <div className="mt-8 grid gap-8 sm:grid-cols-[auto_1fr] sm:items-center">
              <div className="flex min-w-0 items-center gap-5">
                <Ring pct={78} size={120} />
                <div>
                  <p className="font-display text-5xl">78%</p>
                  <p className="text-sm text-cream-100/70">
                    <Money amount={5_850_000} /> of 7.5m
                  </p>
                </div>
              </div>
              <div className="min-w-0">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-gold-300">Class heatmap · % collected</p>
                <div className="no-scrollbar overflow-x-auto">
                  <table className="w-full border-separate border-spacing-1 text-center text-[0.7rem] tabular">
                    <thead>
                      <tr>
                        <th className="w-10" />
                        {grades.map((g) => (
                          <th key={g} className="font-medium text-cream-100/60">{g}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[["East", east], ["West", west]].map(([name, row]) => (
                        <tr key={name as string}>
                          <th className="pr-1 text-left font-medium text-cream-100/60">{name as string}</th>
                          {(row as number[]).map((v, i) => (
                            <td key={i} className={`h-9 min-w-8 rounded-md font-semibold ${tone(v)}`}>
                              {v}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-2xl bg-navy-800 p-5">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <p className="text-sm font-semibold">Cash projected · next 30 days</p>
                <p className="text-sm text-gold-300">From plans and payment history</p>
              </div>
              <div className="mt-4 flex h-24 items-end gap-1.5">
                {projection.map((v, i) => (
                  <span key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-gold-500 to-gold-300" style={{ height: `${(v / 46) * 100}%` }} />
                ))}
              </div>
            </div>
            <p className="mt-4 text-xs text-cream-100/50">Illustrative dashboard with fictional demo data.</p>
          </Reveal>

          <Reveal delay={150} className="flex min-w-0 flex-col gap-6">
            <div className="relative overflow-hidden rounded-[2rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/sports-800.webp" srcSet="/images/sports-800.webp 800w, /images/sports-1536.webp 1536w" sizes="(min-width:1024px) 460px, 92vw" alt="Diverse, happy students in navy and gold kit celebrating a relay race with their PE teacher" loading="lazy" className="aspect-[4/3] w-full object-cover" />
            </div>
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
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ---------- School life mosaic ---------- */
function SchoolLife() {
  const tiles = [
    { src: "science", w: 1024, alt: "A teacher and two delighted students watching a colourful experiment in the science lab", cls: "row-span-2 md:col-start-1 md:row-start-1", label: "Learning" },
    { src: "music", w: 1536, alt: "Students playing drums, violin and singing on stage with their music teacher", cls: "md:col-start-2 md:row-start-1", label: "Creativity" },
    { src: "garden", w: 1536, alt: "A teacher and children planting seedlings together in the school garden", cls: "md:col-start-3 md:row-start-1", label: "Growth" },
    { src: "classroom", w: 1536, alt: "A teacher helping smiling pupils with their work in a sunlit classroom", cls: "col-span-2 md:col-span-1 md:col-start-2 md:row-start-2", label: "Belonging" },
    { src: "library", w: 1024, alt: "A teacher reading a picture book to a laughing group of children in the library", cls: "row-span-2 md:col-start-3 md:row-start-2", label: "Curiosity" },
    { src: "sports", w: 1536, alt: "Students celebrating together on sports day", cls: "row-span-2 md:row-span-1 md:col-span-2 md:col-start-1 md:row-start-3", label: "Sport" },
  ];
  return (
    <section className="py-24 sm:py-32">
      <Container>
        <Reveal className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-end">
          <div>
            <Eyebrow>Shule + life</Eyebrow>
            <h2 className="font-display text-4xl leading-[1.08] text-navy-900 sm:text-[3.4rem]">
              Fees sorted. <span className="italic text-gold-600">Back to school life.</span>
            </h2>
          </div>
          <p className="text-lg leading-relaxed text-ink-600">Shulife comes from <i>shule</i>, Kiswahili for school. When the fees run themselves, teachers teach, children play, and nobody is sent home.</p>
        </Reveal>
        <div className="mt-14 grid auto-rows-[200px] grid-cols-2 gap-4 sm:auto-rows-[240px] md:grid-cols-3">
          {tiles.map((t, i) => (
            <Reveal key={t.src} delay={i * 70} className={`group relative overflow-hidden rounded-3xl ${t.cls}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/images/${t.src}-800.webp`} srcSet={`/images/${t.src}-800.webp 800w, /images/${t.src}-${t.w}.webp ${t.w}w`} sizes="(min-width:768px) 33vw, 50vw" alt={t.alt} loading="lazy" className="size-full object-cover transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 via-transparent to-transparent" />
              <span className="absolute bottom-4 left-4 rounded-full bg-cream-50/90 px-3 py-1 text-sm font-semibold text-navy-900 backdrop-blur">{t.label}</span>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------- Security ---------- */
function Security() {
  const promises = [
    { t: "Your money never touches us", d: "Fees go straight to the school’s own M-Pesa Paybill or bank. Shulife only reads the confirmation.", icon: Icon.Bank },
    { t: "Children’s data is precious", d: "We collect the minimum, never message learners, and keep learner data out of analytics.", icon: Icon.Shield },
    { t: "Teachers see status, not amounts", d: "Class teachers see cleared or not cleared — never what a family owes.", icon: Icon.Eye },
    { t: "Every entry audited", d: "Payments are never edited or deleted. Corrections are new, approved entries with a full trail.", icon: Icon.Lock },
  ];
  return (
    <section id="security" className="scroll-mt-20 bg-navy-950 py-24 text-cream-50 sm:py-32">
      <Container>
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <Eyebrow tone="cream">Safety and privacy</Eyebrow>
            <h2 className="font-display text-4xl leading-[1.08] sm:text-[3.4rem]">Trust is built into every term.</h2>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-cream-100/75">Shulife never holds school fees. Here is how money moves:</p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              {[
                ["Parent", Icon.Users],
                ["School’s Paybill or bank", Icon.Bank],
                ["Shulife matches and receipts", Icon.Receipt],
              ].map(([label, I], i) => {
                const C = I as typeof Icon.Bank;
                return (
                  <div key={label as string} className="relative flex items-center gap-3 sm:flex-1 sm:flex-col sm:text-center">
                    <span className={`inline-flex size-14 items-center justify-center rounded-2xl ${i === 1 ? "bg-gold-400 text-navy-950" : "bg-navy-800 text-gold-300"}`}>
                      <C className="size-6" />
                    </span>
                    <p className="text-sm font-semibold">{label as string}</p>
                    {i < 2 && <Icon.Arrow className="ml-auto size-5 text-gold-400 sm:absolute sm:-right-3 sm:top-4 sm:ml-0" />}
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-sm text-cream-100/60">The money goes to the school. Only the confirmation comes to Shulife.</p>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2">
            {promises.map((p, i) => (
              <Reveal key={p.t} delay={i * 90} className="rounded-3xl bg-navy-900 p-7 ring-1 ring-cream-50/5">
                <p.icon className="size-7 text-gold-300" />
                <h3 className="mt-5 text-lg font-bold">{p.t}</h3>
                <p className="mt-2 leading-relaxed text-cream-100/70">{p.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Pricing / calculator ---------- */
function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 py-24 sm:py-32">
      <Container>
        <Reveal className="mx-auto mb-14 max-w-3xl text-center">
          <Eyebrow>What late fees cost you</Eyebrow>
          <h2 className="font-display text-4xl leading-[1.08] text-navy-900 sm:text-[3.4rem]">Late payments are expensive. Find out how much.</h2>
          <p className="mt-5 text-lg text-ink-600">Simple pricing, per enrolled learner per term. Free until your first payment is matched automatically.</p>
        </Reveal>
        <Reveal>
          <Calculator />
        </Reveal>
      </Container>
    </section>
  );
}

/* ---------- No app needed ---------- */
function NoApp() {
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

/* ---------- FAQ ---------- */
function Faq() {
  const faqs = [
    ["Do we need a new Paybill?", "No. Shulife works with your school’s existing M-Pesa Paybill or Till and your bank account. Parents keep paying exactly where they pay today."],
    ["Does it replace our school system?", "No. Shulife does fees and parents only, and works alongside Zeraki, spreadsheets or any other system through simple import and export."],
    ["What about cash and bank payments?", "Record cash, cheques and bank slips with a photo, import bank statements, and reconcile everything with a daily cash-up report."],
    ["Can teachers see fees?", "No. Class teachers only see whether a learner is cleared or not cleared for an exam or trip — never any amounts."],
    ["What if a parent pays the wrong number?", "Shulife checks the guardian’s phone, phones it has learned, and names in the reference. Anything uncertain goes to a review queue with ranked suggestions."],
    ["Is our data safe?", "Yes. Every school’s data is isolated, staff use two-factor sign-in, every manual entry is audited, and we collect the minimum about children."],
    ["Do parents need an app?", "No. Parents use M-Pesa, SMS and WhatsApp, plus a light web portal opened by a link or SMS code — no password to remember."],
    ["How long does setup take?", "Shulife is built to go live in an afternoon: import learners from Excel, set your fee structure, connect your Paybill and send the first statements."],
    ["What happens to receipts if we stop using Shulife?", "Your receipts and statements remain yours. You can export your learners, families, balances and payment history at any time."],
  ];
  return (
    <section id="faq" className="scroll-mt-20 bg-cream-100 py-24 sm:py-32">
      <Container className="grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
        <Reveal>
          <Eyebrow>Questions</Eyebrow>
          <h2 className="font-display text-4xl leading-[1.08] text-navy-900 sm:text-[3.4rem]">Good questions, plain answers.</h2>
          <p className="mt-6 text-lg text-ink-600">Something else on your mind? Book a demo and ask us anything.</p>
          <div className="mt-8">
            <Button href="#demo" variant="navy" arrow>
              Book a free demo
            </Button>
          </div>
        </Reveal>
        <Reveal className="divide-y divide-navy-900/10 border-y border-navy-900/10">
          {faqs.map(([q, a]) => (
            <details key={q} className="group py-2">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 text-lg font-semibold text-navy-900 [&::-webkit-details-marker]:hidden">
                {q}
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-cream-50 text-navy-900 ring-1 ring-navy-900/10 transition group-open:rotate-45 group-open:bg-navy-900 group-open:text-gold-300">
                  <Icon.Plus className="size-5" />
                </span>
              </summary>
              <p className="pb-5 pr-14 text-lg leading-relaxed text-ink-600">{a}</p>
            </details>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}

/* ---------- Final CTA + demo booking ---------- */
function FinalCta() {
  return (
    <section id="demo" className="relative scroll-mt-20 overflow-hidden bg-navy-900 py-24 text-cream-50 sm:py-32">
      <div aria-hidden className="absolute left-[12%] top-1/3 size-40">
        <Ripple className="rounded-full" color="border-gold-400/40" />
      </div>
      <Container className="relative grid items-center gap-14 lg:grid-cols-[1fr_1.1fr]">
        <Reveal>
          <Mark tone="cream" className="h-16 w-auto" />
          <h2 className="mt-8 font-display text-5xl leading-[1.02] sm:text-7xl">
            Begin a <span className="italic text-gold-300">calmer</span> term.
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-cream-100/80">See Shulife with your own fee structure in a free demo. No obligation, no hard sell.</p>
          <ul className="mt-8 space-y-3 text-cream-50">
            {["Live in an afternoon", "Free until your first payment is matched", "Kiswahili and English from day one"].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <Icon.Check className="size-5 text-gold-300" strokeWidth={2.2} />
                {t}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={150}>
          <DemoForm />
        </Reveal>
      </Container>
    </section>
  );
}
