import { Hero } from "@/components/hero";
import { SiblingDemo } from "@/components/sibling-demo";
import { ConnectTabs } from "@/components/connect-tabs";
import { Calculator } from "@/components/calculator";
import { Reveal } from "@/components/reveal";
import { Ripple } from "@/components/brand";
import { Icon } from "@/components/icons";
import { Button, Container, Eyebrow } from "@/components/ui";
import { BigWord, CtaBand, DashboardMock, FaqJsonLd, FaqList, FeatureGrid, MoneyFlow, Photo, SectionHeading, type PhotoName } from "@/components/shared";
import { faqSchools, pillars, securityPromises } from "@/components/content";
import { FullyCollected, NoApp, PlansCarousel, ThreeSteps, TrustStrip, matchSignals } from "@/components/blocks";

export default function Home() {
  return (
    <>
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
      <CtaBand />
    </>
  );
}

/* ---------- Trust strip ---------- */
/* ---------- Every term starts the same way ---------- */
function TermStory() {
  const stories = [
    { who: "The bursar", before: "A lost week at the start of every term, matching hundreds of M-Pesa messages to admission numbers.", after: "Payments match themselves. Only the odd one waits in a one-tap review queue — and it learns.", icon: Icon.Match },
    { who: "The front office", before: "“Whose fees is this?” A payment with a child's name, a grandparent's phone, or no reference at all.", after: "Admission number, guardian phone, learned phone and name signals find the right family.", icon: Icon.Users },
    { who: "The parent", before: "“But I paid!” A lost M-Pesa message, an anxious child, an awkward conversation at the gate.", after: "An instant receipt, a live balance and a statement any time — on the phone they already have.", icon: Icon.Heart },
  ];
  return (
    <section className="py-24 sm:py-32">
      <Container>
        <SectionHeading eyebrow="The start-of-term rush" title="Every term starts the same way. It doesn’t have to." />
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {stories.map((s, i) => (
            <Reveal key={s.who} delay={i * 120} className="flex flex-col overflow-hidden rounded-3xl bg-cream-100 ring-1 ring-navy-900/5">
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
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-cream-100 py-24 sm:py-32">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <Reveal>
            <Eyebrow>How it works</Eyebrow>
            <h2 className="font-display text-4xl leading-[1.08] text-navy-900 sm:text-[3.4rem]">Three steps to a calmer term.</h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-600">Shulife works alongside the school system you already use. Import your learners from Excel, connect your Paybill, and you are live in an afternoon.</p>
            <div className="mt-8">
              <Button href="/how-it-works/" variant="link" arrow>
                The full walkthrough
              </Button>
            </div>
            <div className="mt-8 overflow-hidden rounded-3xl">
              <Photo name="bursar" alt="A smiling bursar working calmly at a laptop in a bright, tidy office" className="aspect-[4/3] w-full object-[50%_30%]" sizes="(min-width:1024px) 440px, 92vw" />
            </div>
          </Reveal>
          <ThreeSteps />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Collect smarter ---------- */
function Collect() {
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
          {matchSignals.map(([t, d], i) => (
            <div key={t} className="min-w-[220px] flex-1 rounded-2xl bg-cream-100 p-5 ring-1 ring-navy-900/5 sm:min-w-0">
              <p className="text-xs font-bold tracking-[0.16em] text-gold-700">SIGNAL {i + 1}</p>
              <p className="mt-2 font-semibold text-navy-900">{t}</p>
              <p className="mt-1 text-sm text-ink-600">{d}</p>
            </div>
          ))}
        </Reveal>

        <div id="siblings" className="mt-24 scroll-mt-24">
          <SectionHeading
            eyebrow="The sibling moment"
            title="One payment. Three children. Sorted automatically."
            intro="Drop a payment onto the family and watch it split by your school’s rule. Switch rules to compare."
            className="mb-12"
          />
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
  return (
    <section id="features" className="scroll-mt-20 bg-cream-100 py-24 sm:py-32">
      <Container>
        <SectionHeading center eyebrow="Everything for fees and parents" title="Eight things your school will never do by hand again." />
        <div className="mt-16">
          <FeatureGrid items={pillars} />
        </div>
        <div className="mt-12 text-center">
          <Button href="/features/" variant="navy" arrow>
            Explore all features
          </Button>
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
      <PlansCarousel />
    </section>
  );
}

/* ---------- Grow smarter ---------- */
function Grow() {
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
            <div className="mt-6">
              <Button href="/for-directors/" variant="link" arrow>
                Shulife for directors
              </Button>
            </div>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <Reveal className="min-w-0">
            <DashboardMock />
          </Reveal>
          <Reveal delay={150} className="flex min-w-0 flex-col gap-6">
            <div className="overflow-hidden rounded-[2rem]">
              <Photo name="sports" alt="Diverse, happy students in navy and gold kit celebrating a relay race with their PE teacher" className="aspect-[4/3] w-full" sizes="(min-width:1024px) 460px, 92vw" />
            </div>
            <FullyCollected />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ---------- School life mosaic ---------- */
function SchoolLife() {
  const tiles: { src: PhotoName; alt: string; cls: string; label: string }[] = [
    { src: "science", alt: "A teacher and two delighted students watching a colourful experiment in the science lab", cls: "row-span-2 md:col-start-1 md:row-start-1", label: "Learning" },
    { src: "music", alt: "Students playing drums, violin and singing on stage with their music teacher", cls: "md:col-start-2 md:row-start-1", label: "Creativity" },
    { src: "garden", alt: "A teacher and children planting seedlings together in the school garden", cls: "md:col-start-3 md:row-start-1", label: "Growth" },
    { src: "football", alt: "A diverse school football team celebrating a goal with their coach", cls: "col-span-2 md:col-span-1 md:col-start-2 md:row-start-2", label: "Sport" },
    { src: "library", alt: "A teacher reading a picture book to a laughing group of children in the library", cls: "row-span-2 md:col-start-3 md:row-start-2", label: "Curiosity" },
    { src: "art", alt: "Children painting colourful pictures with their art teacher", cls: "row-span-2 md:row-span-1 md:col-span-2 md:col-start-1 md:row-start-3", label: "Imagination" },
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
          <p className="text-lg leading-relaxed text-ink-600">
            Shulife comes from <i>shule</i>, Kiswahili for school. When the fees run themselves, teachers teach, children play, and nobody is sent home.
          </p>
        </Reveal>
        <div className="mt-14 grid auto-rows-[200px] grid-cols-2 gap-4 sm:auto-rows-[240px] md:grid-cols-3">
          {tiles.map((t, i) => (
            <Reveal key={t.src} delay={i * 70} className={`group relative overflow-hidden rounded-3xl ${t.cls}`}>
              <Photo name={t.src} alt={t.alt} sizes="(min-width:768px) 33vw, 50vw" className="size-full transition duration-700 group-hover:scale-105" />
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
  return (
    <section id="security" className="scroll-mt-20 bg-navy-950 py-24 text-cream-50 sm:py-32">
      <Container>
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <Eyebrow tone="cream">Safety and privacy</Eyebrow>
            <h2 className="font-display text-4xl leading-[1.08] sm:text-[3.4rem]">Trust is built into every term.</h2>
            <p className="mb-10 mt-6 max-w-lg text-lg leading-relaxed text-cream-100/75">Shulife never holds school fees. Here is how money moves:</p>
            <MoneyFlow />
            <div className="mt-10">
              <Button href="/security/" variant="outline-cream" arrow>
                How we protect schools
              </Button>
            </div>
          </Reveal>
          <FeatureGrid items={securityPromises} cols={2} tone="dark" />
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
        <SectionHeading
          center
          eyebrow="What late fees cost you"
          title="Late payments are expensive. Find out how much."
          intro="Simple pricing, per enrolled learner per term. Free until your first payment is matched automatically."
          className="mb-14"
        />
        <Reveal>
          <Calculator />
        </Reveal>
      </Container>
    </section>
  );
}

/* ---------- No app needed ---------- */
/* ---------- FAQ ---------- */
function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 bg-cream-100 py-24 sm:py-32">
      <FaqJsonLd items={faqSchools} />
      <Container className="grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
        <Reveal>
          <Eyebrow>Questions</Eyebrow>
          <h2 className="font-display text-4xl leading-[1.08] text-navy-900 sm:text-[3.4rem]">Good questions, plain answers.</h2>
          <p className="mt-6 text-lg text-ink-600">Something else on your mind? Visit the help centre, or book a demo and ask us anything.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/book-demo/" variant="navy" arrow>
              Book a free demo
            </Button>
            <Button href="/help/" variant="outline">
              Help centre
            </Button>
          </div>
        </Reveal>
        <Reveal>
          <FaqList items={faqSchools} />
        </Reveal>
      </Container>
    </section>
  );
}
