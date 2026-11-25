import type { Metadata } from "next";
import { ThreeSteps, matchSignals } from "@/components/blocks";
import { Icon } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { CtaBand, PageHero, PhotoCard, SectionHeading } from "@/components/shared";
import { SplitBar } from "@/components/hero";
import { Button, Container, Eyebrow, Money } from "@/components/ui";

export const metadata: Metadata = {
  title: "How it works",
  description: "From fee structure to receipt: how Shulife bills, collects, matches, splits and confirms school fees — and how your school goes live in an afternoon.",
};

const onboarding = [
  ["School details", "Name, campuses, crest, county and phone."],
  ["Academic set-up", "Grades pre-filled for Kenya. Add streams and this term’s dates."],
  ["Learners and families", "Upload Excel or CSV, a photo of a class register, or another system’s export. Families are grouped by shared guardian phone."],
  ["Fees", "Build the fee structure, set optional items and routes, and choose your sibling rule."],
  ["Opening balances", "Import balances brought forward so statements are right from day one."],
  ["Connect payments", "Connect your M-Pesa Paybill or Till with a guided test, and choose your bank statement format."],
  ["Parents", "Preview the welcome message in English and Kiswahili, and print the “How to pay school fees” notice."],
  ["Reminders", "Pick a tone — gentle, standard or firm-but-polite — and review the term timeline."],
  ["Go live", "Your first automatically matched payment starts your free period."],
];

const lifecycle = [
  { t: "Before the term", d: "Promote learners, approve the fee structure, run invoicing and publish statements to parents.", icon: Icon.Calendar },
  { t: "During the term", d: "Payments, matching, receipts, plans, reminders, clearance and notices — all running on their own.", icon: Icon.Phone },
  { t: "Term close", d: "Lock the term, carry every balance forward automatically and download the closing report pack.", icon: Icon.Book },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        eyebrow="How it works"
        title={
          <>
            Bill. Collect. Confirm. <span className="italic text-gold-600">Relax.</span>
          </>
        }
        intro="Shulife sits beside the school system you already use and takes care of fees and parents — from the first invoice to the last receipt of the term."
        actions={
          <>
            <Button href="/book-demo/" arrow>
              Book a free demo
            </Button>
            <Button href="#onboarding" variant="outline">
              Live in an afternoon
            </Button>
          </>
        }
        photo={{ name: "art", alt: "Happy children painting colourful pictures with their art teacher" }}
      />

      <section className="bg-cream-100 py-24 sm:py-32">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <SectionHeading eyebrow="The three steps" title="One calm loop, every term." intro="Every step is designed so that the people who run your school spend their time on learners, not on spreadsheets." />
          <ThreeSteps />
        </Container>
      </section>

      {/* Payment journey */}
      <section className="py-24 sm:py-32">
        <Container>
          <SectionHeading center eyebrow="Follow one payment" title="From a parent’s phone to a receipt, in seconds." />
          <ol className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                n: "1",
                t: "The parent pays",
                body: (
                  <div className="rounded-2xl bg-navy-900 p-4 text-cream-50">
                    <p className="text-xs text-cream-100/60">M-Pesa · Paybill</p>
                    <p className="mt-1 font-display text-2xl">
                      <Money amount={45000} />
                    </p>
                    <p className="text-xs text-cream-100/70">Account: 2041 grade 8</p>
                  </div>
                ),
              },
              {
                n: "2",
                t: "Shulife matches it",
                body: (
                  <div className="space-y-2 rounded-2xl bg-cream-100 p-4 text-sm">
                    {matchSignals.slice(0, 3).map(([s], i) => (
                      <p key={s} className="flex items-center gap-2 text-navy-900">
                        <Icon.Check className={`size-4 ${i < 2 ? "text-paid" : "text-ink-400"}`} strokeWidth={2.4} />
                        {s}
                      </p>
                    ))}
                  </div>
                ),
              },
              {
                n: "3",
                t: "It splits between siblings",
                body: (
                  <div className="rounded-2xl bg-cream-100 p-4">
                    <SplitBar />
                  </div>
                ),
              },
              {
                n: "4",
                t: "Everyone is receipted",
                body: (
                  <div className="rounded-2xl bg-[#e7f6ea] p-4 text-sm text-ink-900">
                    Received <b>KSh 45,000</b> for Amani, Zawadi and Baraka. Receipt RCT-RUI-2027-000456.
                  </div>
                ),
              },
            ].map((s, i) => (
              <Reveal as="li" key={s.n} delay={i * 90} className="flex flex-col gap-5 rounded-3xl bg-cream-50 p-6 shadow-soft ring-1 ring-navy-900/5">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-9 items-center justify-center rounded-full bg-gold-400 font-display text-lg text-navy-950">{s.n}</span>
                  <h3 className="font-semibold text-navy-900">{s.t}</h3>
                </div>
                {s.body}
              </Reveal>
            ))}
          </ol>
          <p className="mt-6 text-center text-sm text-ink-600">Anything Shulife isn’t sure about waits in a review queue for the bursar, with the three most likely families and the reasons.</p>
        </Container>
      </section>

      {/* Onboarding */}
      <section id="onboarding" className="scroll-mt-20 bg-navy-900 py-24 text-cream-50 sm:py-32">
        <Container className="grid gap-14 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
          <Reveal>
            <Eyebrow tone="cream">Onboarding</Eyebrow>
            <h2 className="font-display text-4xl leading-[1.08] sm:text-[3.2rem]">
              Live in an <span className="italic text-gold-300">afternoon.</span>
            </h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-cream-100/80">A step-by-step set-up that saves as you go, so you can stop and pick up again at any time.</p>
            <div className="mt-8 rounded-3xl bg-navy-800 p-6">
              <p className="font-semibold text-gold-300">Prefer us to do it?</p>
              <p className="mt-2 text-cream-100/80">Our team can import your learners, fees, balances and payment settings for you — every step recorded in your audit log.</p>
            </div>
            <PhotoCard name="graduation" alt="A beaming graduate hugging her proud teacher as classmates celebrate" className="mt-8 aspect-[4/3.4]" />
          </Reveal>
          <ol className="space-y-3">
            {onboarding.map(([t, d], i) => (
              <Reveal as="li" key={t} delay={i * 50} className="flex gap-5 rounded-2xl bg-navy-800/70 p-5 ring-1 ring-cream-50/5">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-gold-400/50 font-display text-gold-300">{i + 1}</span>
                <div>
                  <h3 className="font-semibold">{t}</h3>
                  <p className="mt-1 text-cream-100/70">{d}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      {/* Term lifecycle */}
      <section className="py-24 sm:py-32">
        <Container>
          <SectionHeading eyebrow="The whole term" title="Before, during and after — handled." intro="Shulife follows the rhythm of the Kenyan school year: three terms, with a clean close and a fresh start each time." />
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {lifecycle.map((l, i) => (
              <Reveal key={l.t} delay={i * 100} className="rounded-3xl bg-cream-100 p-8">
                <l.icon className="size-8 text-gold-600" />
                <h3 className="mt-6 font-display text-2xl text-navy-900">{l.t}</h3>
                <p className="mt-3 text-lg leading-relaxed text-ink-600">{l.d}</p>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-10 flex flex-wrap items-center justify-between gap-6 rounded-3xl border border-navy-900/10 p-8">
            <p className="max-w-xl text-lg text-navy-900">
              <b>Works alongside your school system.</b> Import and export learners, classes and balances as Excel or CSV — whatever you use today.
            </p>
            <Button href="/features/" variant="navy" arrow>
              See every feature
            </Button>
          </Reveal>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
