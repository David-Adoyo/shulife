import { Hero } from "@/components/hero";
import { SiblingDemo } from "@/components/sibling-demo";
import { ConnectTabs } from "@/components/connect-tabs";
import { Calculator } from "@/components/calculator";
import { Button, Container, Eyebrow } from "@/components/ui";
import { CtaBand, DashboardMock, FaqJsonLd, FaqList, FeatureGrid, MoneyFlow, Photo, SectionHeading } from "@/components/shared";
import { faqSchools, pillars, securityPromises } from "@/components/content";
import { NoApp, PlansCarousel, ThreeSteps, matchSignals } from "@/components/blocks";

export default function Home() {
  return (
    <>
      <Hero />
      <TermStory />
      <HowItWorks />
      <Matching />
      <Pillars />
      <Parents />
      <Plans />
      <Directors />
      <Security />
      <Pricing />
      <NoApp />
      <Faq />
      <CtaBand />
    </>
  );
}

/* ---------- The first fortnight of term ---------- */
function TermStory() {
  const people = [
    {
      who: "Bursar",
      now: "Spends the first two weeks of term reading M-Pesa statements line by line and writing admission numbers into Excel.",
      then: "Opens a review queue of the dozen or so payments Shulife couldn’t place and clears them before lunch.",
    },
    {
      who: "Front office",
      now: "Fields “whose fees is this?” when a grandmother pays from her own phone with “FEES” as the account.",
      then: "Shulife remembers that number belongs to the family, so next time the payment goes straight through.",
    },
    {
      who: "Parent",
      now: "Is told “we haven’t seen your payment” and has to dig out the M-Pesa message to prove it.",
      then: "Gets a numbered receipt within seconds and can ask for a statement on WhatsApp at any time.",
    },
  ];
  return (
    <section className="py-24 sm:py-28">
      <Container>
        <SectionHeading eyebrow="Why schools switch" title="The first fortnight of term is mostly paperwork" />
        <div className="mt-14 divide-y divide-navy-900/10 border-y border-navy-900/10">
          {people.map((p) => (
            <div key={p.who} className="grid gap-4 py-8 md:grid-cols-[10rem_1fr_1fr] md:gap-10">
              <p className="font-display text-2xl text-navy-900">{p.who}</p>
              <div>
                <p className="text-sm font-semibold text-ink-400">Today</p>
                <p className="mt-1 text-lg leading-relaxed text-ink-600">{p.now}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gold-700">With Shulife</p>
                <p className="mt-1 text-lg leading-relaxed text-navy-900">{p.then}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------- How it works ---------- */
function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-cream-100 py-24 sm:py-28">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <div>
            <Eyebrow>How it works</Eyebrow>
            <h2 className="font-display text-4xl leading-[1.08] text-navy-900 sm:text-5xl">Setting up takes an afternoon</h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-600">You keep your school system, your Paybill and your bank. Send us your learner list in Excel and last term’s fee structure, and we’ll do the import with you.</p>
            <div className="mt-8">
              <Button href="/how-it-works/" variant="link" arrow>
                Full walkthrough
              </Button>
            </div>
            <div className="mt-8 overflow-hidden rounded-2xl">
              <Photo name="bursar" alt="A bursar at her desk with a laptop and box files" className="aspect-[4/3] w-full object-[50%_30%]" sizes="(min-width:1024px) 440px, 92vw" />
            </div>
          </div>
          <ThreeSteps />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Matching ---------- */
function Matching() {
  return (
    <section id="collect" className="scroll-mt-20 py-24 sm:py-28">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <div>
            <Eyebrow>Matching</Eyebrow>
            <h2 className="font-display text-4xl leading-[1.08] text-navy-900 sm:text-5xl">Parents rarely type the account number right</h2>
            <p className="mt-6 text-lg leading-relaxed text-ink-600">
              You’ll see “2041”, “adm 2041 gr8”, a child’s name, or just “FEES”. Shulife checks each payment against everything it knows about your families. When it’s sure, the payment is applied and receipted. When it isn’t, it goes to the bursar with its best three guesses.
            </p>
          </div>
          <dl className="divide-y divide-navy-900/10 border-y border-navy-900/10">
            {matchSignals.map(([t, d]) => (
              <div key={t} className="grid grid-cols-[11rem_1fr] gap-4 py-4">
                <dt className="font-semibold text-navy-900">{t}</dt>
                <dd className="text-ink-600">{d}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div id="siblings" className="mt-24 scroll-mt-24">
          <SectionHeading
            eyebrow="Siblings"
            title="When one payment covers three children"
            intro="Each school decides how a family payment is shared. Pick a rule below and tap the payment to see where the money goes."
            className="mb-12"
          />
          <SiblingDemo />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Everything else ---------- */
function Pillars() {
  return (
    <section id="features" className="scroll-mt-20 bg-cream-100 py-24 sm:py-28">
      <Container>
        <SectionHeading eyebrow="Also included" title="The rest of the fees office" />
        <div className="mt-14">
          <FeatureGrid items={pillars} />
        </div>
        <div className="mt-12">
          <Button href="/features/" variant="navy" arrow>
            All features
          </Button>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Parents ---------- */
function Parents() {
  return (
    <section id="connect" className="scroll-mt-20 bg-navy-900 py-24 text-cream-50 sm:py-28">
      <Container>
        <div className="max-w-2xl">
          <Eyebrow tone="cream">Parents</Eyebrow>
          <h2 className="font-display text-4xl leading-[1.08] sm:text-5xl">What parents get on their phone</h2>
          <p className="mt-6 text-lg leading-relaxed text-cream-100/80">Receipts, balances and school notices by SMS or WhatsApp, in English or Kiswahili. Fewer phone calls to the office, and fewer arguments about what was paid.</p>
        </div>
        <div className="mt-14">
          <ConnectTabs />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Instalments ---------- */
function Plans() {
  return (
    <section id="plans" className="scroll-mt-20 overflow-hidden py-24 sm:py-28">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <Eyebrow>Paying over the term</Eyebrow>
            <h2 className="font-display text-4xl leading-[1.08] text-navy-900 sm:text-5xl">For families who can’t pay it all on day one</h2>
          </div>
          <p className="max-w-sm text-lg text-ink-600">Late fees are off unless your school turns them on. Reminders go to the parent, never to the child.</p>
        </div>
      </Container>
      <PlansCarousel />
    </section>
  );
}

/* ---------- Directors ---------- */
function Directors() {
  return (
    <section id="grow" className="scroll-mt-20 bg-cream-100 py-24 sm:py-28">
      <Container>
        <div className="max-w-2xl">
          <Eyebrow>Directors</Eyebrow>
          <h2 className="font-display text-4xl leading-[1.08] text-navy-900 sm:text-5xl">Where the term stands, without asking the bursar</h2>
          <p className="mt-6 text-lg leading-relaxed text-ink-600">Collection for every grade and stream, what’s due in over the next 30 days, and a log of every manual change.</p>
          <div className="mt-6">
            <Button href="/for-directors/" variant="link" arrow>
              Shulife for directors
            </Button>
          </div>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="min-w-0">
            <DashboardMock />
          </div>
          <div className="relative min-h-72 min-w-0 overflow-hidden rounded-2xl">
            <Photo priority name="sports" alt="Pupils in navy and gold kit at the finish of a relay race on sports day" className="absolute inset-0 size-full" sizes="(min-width:1024px) 460px, 92vw" />
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Security ---------- */
function Security() {
  return (
    <section id="security" className="scroll-mt-20 bg-navy-950 py-24 text-cream-50 sm:py-28">
      <Container>
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <Eyebrow tone="cream">Money and data</Eyebrow>
            <h2 className="font-display text-4xl leading-[1.08] sm:text-5xl">We never hold your fees</h2>
            <p className="mb-10 mt-6 max-w-lg text-lg leading-relaxed text-cream-100/75">Parents pay the school directly. Safaricom or your bank tells Shulife a payment arrived, and that’s all we see of the money.</p>
            <MoneyFlow />
            <div className="mt-10">
              <Button href="/security/" variant="outline-cream" arrow>
                Security details
              </Button>
            </div>
          </div>
          <FeatureGrid items={securityPromises} cols={2} tone="dark" />
        </div>
      </Container>
    </section>
  );
}

/* ---------- Pricing / calculator ---------- */
function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 py-24 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Cost of late fees"
          title="How much is sitting unpaid at the start of term?"
          intro="Move the sliders to match your school. Shulife is priced per enrolled learner per term, and you don’t pay anything until the first payment has been matched automatically."
          className="mb-14"
        />
        <Calculator />
      </Container>
    </section>
  );
}

/* ---------- FAQ ---------- */
function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 bg-cream-100 py-24 sm:py-28">
      <FaqJsonLd items={faqSchools} />
      <Container className="grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
        <div>
          <Eyebrow>Questions</Eyebrow>
          <h2 className="font-display text-4xl leading-[1.08] text-navy-900 sm:text-5xl">What schools ask us</h2>
          <p className="mt-6 text-lg text-ink-600">More in the help centre, or ask us on a demo call.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/book-demo/" variant="navy" arrow>
              Book a demo
            </Button>
            <Button href="/help/" variant="outline">
              Help centre
            </Button>
          </div>
        </div>
        <FaqList items={faqSchools} />
      </Container>
    </section>
  );
}
