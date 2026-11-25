import type { Metadata } from "next";
import { securityPromises } from "@/components/content";
import { Icon } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { Checklist, CtaBand, FeatureGrid, MoneyFlow, PageHero, PlaceholderNote, SectionHeading } from "@/components/shared";
import { Button, Container, Eyebrow } from "@/components/ui";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Security and privacy",
  description: "Shulife never holds school fees, collects the minimum about children, shows teachers no amounts and audits every money action. Built for the Kenya Data Protection Act, 2019.",
};

const practices = [
  { t: "Separate for every school", d: "Each school’s data is isolated at the database level, and access is checked on every request.", icon: Icon.Gate },
  { t: "Two-factor sign-in", d: "Directors, heads and bursars sign in with a password and a second factor.", icon: Icon.Lock },
  { t: "Encrypted throughout", d: "Encrypted connections everywhere. M-Pesa credentials are stored in a vault and never shown again after saving.", icon: Icon.Shield },
  { t: "Append-only audit log", d: "Every money, permission, export and settings action is recorded — visible to the director.", icon: Icon.Book },
  { t: "Private files", d: "Receipts, statements and slip photos sit in private storage, shared only through short-lived links.", icon: Icon.Receipt },
  { t: "Backups and recovery", d: "Point-in-time recovery, with regular restore drills.", icon: Icon.Clock },
];

const roles = [
  ["Director / owner", "Everything, across their campuses"],
  ["Bursar", "Fees, payments, receipts and reports — cannot delete payments"],
  ["Front office", "Look up families and resend statements — cannot change charges"],
  ["Class teacher", "Cleared or not cleared only — never amounts"],
  ["Parent", "Their own family only"],
];

export default function SecurityPage() {
  return (
    <>
      <PageHero
        tone="navy"
        eyebrow="Security and privacy"
        title={
          <>
            Trust, built into <span className="italic text-gold-300">every term.</span>
          </>
        }
        intro="Schools trust us with families’ details and the flow of their fees. We protect both with care — starting with never holding the money at all."
        aside={
          <Reveal className="rounded-[2rem] bg-navy-800 p-8 ring-1 ring-cream-50/10">
            <p className="mb-8 text-xs font-bold uppercase tracking-[0.16em] text-gold-300">How money moves</p>
            <MoneyFlow />
          </Reveal>
        }
      />

      <section className="py-24 sm:py-28">
        <Container>
          <SectionHeading eyebrow="Our promises" title="Four things we will always do." />
          <div className="mt-14 rounded-[2rem] bg-navy-950 p-6 sm:p-10">
            <FeatureGrid items={securityPromises} tone="dark" />
          </div>
        </Container>
      </section>

      <section className="bg-cream-100 py-24 sm:py-28">
        <Container className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHeading eyebrow="Children’s data" title="We collect the minimum. On purpose." intro="Under the Kenya Data Protection Act, 2019, your school is the data controller and Shulife is the data processor. We handle children’s data only for the school, in the child’s best interests." />
            <Reveal className="mt-8">
              <Checklist
                items={[
                  "Learners: name, admission number, grade and stream, boarding or route, and family — nothing more",
                  "No photos, health records, national IDs or assessment numbers",
                  "No messages to learners, ever",
                  "No learner or guardian details in our product analytics",
                  "Guardian phone numbers are protected for matching and shown masked in lists",
                  "Consent and WhatsApp opt-ins are recorded with time and channel",
                ]}
              />
            </Reveal>
          </div>
          <Reveal delay={100} className="rounded-[2rem] bg-cream-50 p-8 shadow-soft ring-1 ring-navy-900/5 sm:p-10">
            <Eyebrow>Who sees what</Eyebrow>
            <h3 className="font-display text-3xl text-navy-900">Everyone sees only what they need.</h3>
            <ul className="mt-8 divide-y divide-navy-900/10">
              {roles.map(([r, d]) => (
                <li key={r} className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
                  <span className="font-semibold text-navy-900">{r}</span>
                  <span className="text-ink-600">{d}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-ink-600">Support staff can only view a school’s account with the school’s consent, for a limited time — and every visit is logged.</p>
          </Reveal>
        </Container>
      </section>

      <section className="py-24 sm:py-28">
        <Container>
          <SectionHeading center eyebrow="How we protect your school" title="Security you don’t have to think about." />
          <div className="mt-14">
            <FeatureGrid items={practices} cols={3} />
          </div>
        </Container>
      </section>

      <section className="bg-cream-100 py-24 sm:py-28">
        <Container className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <SectionHeading eyebrow="WhatsApp safety" title="Unknown numbers get nothing." intro="The WhatsApp assistant only answers phone numbers registered as guardians of a family. Anyone else is politely asked to contact the school — and no information is shared." />
          <Reveal className="space-y-4">
            <PlaceholderNote>
              {site.odpcRegNo ? (
                <>Shulife is registered with the Office of the Data Protection Commissioner · {site.odpcRegNo}.</>
              ) : (
                <>Our registration with the Office of the Data Protection Commissioner (ODPC) will be published here before launch.</>
              )}
            </PlaceholderNote>
            <div className="flex flex-wrap gap-3">
              <Button href="/legal/privacy/" variant="outline">
                Privacy notice
              </Button>
              <Button href="/legal/dpa/" variant="outline">
                Data processing agreement
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>

      <CtaBand title={<>Questions about <span className="italic text-gold-300">your data?</span></>} body="We’re happy to walk your board or your accountant through how Shulife protects your school and your families." />
    </>
  );
}
