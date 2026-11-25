import type { Metadata } from "next";
import { Calculator } from "@/components/calculator";
import { faqBilling } from "@/components/content";
import { Icon } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { Checklist, CtaBand, FaqJsonLd, FaqList, PageHero, SectionHeading } from "@/components/shared";
import { Button, Container, Money } from "@/components/ui";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple pricing per enrolled learner per term. Free until your first payment is matched automatically. Payment matching and receipts never stop.",
};

const included = [
  "Automatic M-Pesa and bank matching",
  "Sibling splits and instant receipts",
  "Fee structures, invoices and statements",
  "Payment plans, Ratiba and reminders",
  "WhatsApp balance, notices and consent",
  "Director’s dashboard and reports",
  "English and Kiswahili for parents",
  "Help with set-up and import",
];

const steps = [
  { t: "Free to start", d: "Set up, import your learners and connect your Paybill. Nothing to pay.", icon: Icon.Sparkle },
  { t: "First match", d: "Your free period begins the moment your first payment is matched automatically.", icon: Icon.Match },
  { t: "Per learner, per term", d: "Then a simple fee for each enrolled learner each term, with a minimum per school.", icon: Icon.Users },
];

export default function PricingPage() {
  const price = site.pricePerLearnerTerm;
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title={
          <>
            Simple, fair, <span className="italic text-gold-600">per learner.</span>
          </>
        }
        intro="One price per enrolled learner per term, with everything included. Free until your first payment is matched automatically."
        actions={
          <>
            <Button href="/book-demo/" arrow>
              Get a quote
            </Button>
            <Button href="#calculator" variant="outline">
              Cost of late fees
            </Button>
          </>
        }
        aside={
          <Reveal className="relative overflow-hidden rounded-[2rem] bg-navy-900 p-8 text-cream-50 shadow-lift sm:p-10">
            <div aria-hidden className="absolute -right-20 -top-20 size-64 rounded-full border-[32px] border-gold-400/10" />
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-300">Shulife</p>
            <p className="mt-4 font-display text-5xl">{price != null ? <Money amount={price} /> : "Per learner"}</p>
            <p className="mt-1 text-cream-100/70">{price != null ? "per enrolled learner, per term" : "per term — your quote is based on enrolment"}</p>
            <div className="my-8 h-px bg-cream-50/10" />
            <Checklist items={included} tone="dark" />
            <div className="mt-8">
              <Button href="/book-demo/" className="w-full" arrow>
                Book a free demo
              </Button>
            </div>
          </Reveal>
        }
      />

      <section className="bg-cream-100 py-24 sm:py-28">
        <Container>
          <SectionHeading center eyebrow="How billing works" title="You only pay once Shulife is working for you." />
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {steps.map((s, i) => (
              <Reveal key={s.t} delay={i * 100} className="relative rounded-3xl bg-cream-50 p-8 shadow-soft">
                <span className="absolute right-6 top-6 font-display text-5xl text-gold-300">{i + 1}</span>
                <s.icon className="size-8 text-navy-900" />
                <h3 className="mt-6 font-display text-2xl text-navy-900">{s.t}</h3>
                <p className="mt-3 text-lg leading-relaxed text-ink-600">{s.d}</p>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-10 grid gap-6 rounded-3xl bg-navy-900 p-8 text-cream-50 sm:grid-cols-[auto_1fr] sm:items-center sm:p-10">
            <Icon.Shield className="size-12 text-gold-300" />
            <div>
              <h3 className="font-display text-2xl">Parents are never affected by your subscription.</h3>
              <p className="mt-2 text-cream-100/80">If an invoice is overdue, your account becomes read-only after a grace period — but payment matching, receipts and parent balances keep running. Always.</p>
            </div>
          </Reveal>
        </Container>
      </section>

      <section className="py-24 sm:py-28">
        <Container className="grid gap-6 md:grid-cols-2">
          <Reveal className="rounded-3xl bg-cream-100 p-8 sm:p-10">
            <Icon.Gate className="size-8 text-gold-600" />
            <h3 className="mt-6 font-display text-3xl text-navy-900">School groups</h3>
            <p className="mt-3 text-lg text-ink-600">Several campuses? One organisation, a group dashboard and one invoice. Talk to us about group pricing.</p>
            <div className="mt-6">
              <Button href="/book-demo/" variant="link" arrow>
                Talk to us
              </Button>
            </div>
          </Reveal>
          <Reveal delay={100} className="rounded-3xl bg-cream-100 p-8 sm:p-10">
            <Icon.Phone className="size-8 text-gold-600" />
            <h3 className="mt-6 font-display text-3xl text-navy-900">Pay your way</h3>
            <p className="mt-3 text-lg text-ink-600">Pay for Shulife by M-Pesa or card, each term. Your school fees never pass through us.</p>
            <div className="mt-6">
              <Button href="/security/" variant="link" arrow>
                How money moves
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>

      <section id="calculator" className="scroll-mt-20 bg-cream-100 py-24 sm:py-28">
        <Container>
          <SectionHeading center eyebrow="What late fees cost you" title="Late payments are expensive. Find out how much." className="mb-14" />
          <Reveal>
            <Calculator />
          </Reveal>
        </Container>
      </section>

      <section className="py-24 sm:py-28">
        <FaqJsonLd items={faqBilling} />
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
          <SectionHeading eyebrow="Billing questions" title="Straight answers." />
          <Reveal>
            <FaqList items={faqBilling} tone="white" />
          </Reveal>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
