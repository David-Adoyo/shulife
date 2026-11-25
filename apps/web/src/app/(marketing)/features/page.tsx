import type { Metadata } from "next";
import { Icon } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { CtaBand, FeatureGrid, PageHero, PhotoCard, SectionHeading, type Feature, type PhotoName } from "@/components/shared";
import { Button, Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Features",
  description: "Automatic M-Pesa matching, sibling splits, instant receipts, fee structures, payment plans, Ratiba, notices with read receipts, a director’s dashboard and more.",
};

type Group = { id: string; eyebrow: string; title: string; intro: string; photo: PhotoName; alt: string; items: Feature[] };

const groups: Group[] = [
  {
    id: "collection",
    eyebrow: "Collection",
    title: "Every shilling in the right place.",
    intro: "Payments arrive in the school’s own account. Shulife works out whose they are, shares them between siblings and receipts the parent.",
    photo: "bursar",
    alt: "A smiling bursar at her desk with a laptop",
    items: [
      { t: "Automatic matching", d: "Admission number, family code, guardian phone, learned phones and names in the reference — combined into one confident match.", icon: Icon.Match },
      { t: "Review queue that learns", d: "Uncertain payments come with the top three suggestions and the reasons. Every decision teaches Shulife for next time.", icon: Icon.Sparkle },
      { t: "Sibling allocation", d: "Oldest balance first, proportional, eldest or youngest first, or exact number only — your school’s choice.", icon: Icon.Split },
      { t: "Instant receipts", d: "Numbered receipts with your crest, by WhatsApp or SMS plus a PDF, with a QR code anyone can verify.", icon: Icon.Receipt },
      { t: "Cash, cheques and slips", d: "Manual receipts with a photo of the slip, a daily cash-up per receiver and banking reconciliation.", icon: Icon.Bank },
      { t: "Bank statement import", d: "Bank Paybill payments go through the same matching as M-Pesa, straight from your statement file.", icon: Icon.Book },
    ],
  },
  {
    id: "billing",
    eyebrow: "Billing",
    title: "Fee structures in minutes, not days.",
    intro: "Build the fee structure once, copy it next term with an uplift, and invoice the whole school in one click.",
    photo: "classroom",
    alt: "A teacher helping happy pupils with their work in a sunlit classroom",
    items: [
      { t: "Fee structure builder", d: "A spreadsheet-like grid of grades and fee items, with a comparison against last term before you publish.", icon: Icon.Chart },
      { t: "Optional items", d: "Lunch, transport routes, boarding, clubs and trips — only charged to the learners who take them.", icon: Icon.Plus },
      { t: "Discounts and bursaries", d: "Sibling discounts, staff children, bursaries and sponsors applied by rule and shown on the statement.", icon: Icon.Heart },
      { t: "Itemised statements", d: "Per child and per family, with term sections and balance brought forward. Download any time.", icon: Icon.Receipt },
      { t: "Term close", d: "Every balance carried forward automatically with a full history and a closing report pack.", icon: Icon.Calendar },
      { t: "Import and export", d: "Excel and CSV in and out for learners, classes and balances, so Shulife fits beside any system.", icon: Icon.Globe },
    ],
  },
  {
    id: "parents",
    eyebrow: "Parents",
    title: "Respectful, clear and in their language.",
    intro: "Parents are partners. Shulife keeps them informed on the phone they already have, in English or Kiswahili.",
    photo: "parent",
    alt: "A happy mother at the school gate with her two children",
    items: [
      { t: "Balance on WhatsApp", d: "BALANCE / SALIO, STATEMENT / TAARIFA, RECEIPT / RISITI and more — answered only for registered numbers.", icon: Icon.Chat },
      { t: "Polite reminders", d: "A term timeline with gentle, standard or firm-but-polite tone, quiet hours, a weekly cap and a stop the moment fees are paid.", icon: Icon.Bell },
      { t: "Payment plans", d: "Instalments agreed with the school and accepted by a one-time code, with reminders before each one.", icon: Icon.Calendar },
      { t: "M-PESA Ratiba", d: "Optional standing orders so plan instalments are paid automatically.", icon: Icon.Clock },
      { t: "Notices with read receipts", d: "Send to a class, a bus route or the boarders, see who has read it, and resend by SMS to the rest.", icon: Icon.Users },
      { t: "Consent and pay in one link", d: "Trips and events with a consent form and payment together, and a live roster for the organiser.", icon: Icon.Check },
    ],
  },
  {
    id: "leadership",
    eyebrow: "Leadership",
    title: "Know exactly where the term stands.",
    intro: "Directors and heads see collection live, plan for cash, and never have to ask for a report again.",
    photo: "director",
    alt: "A school director walking with a group of smiling students",
    items: [
      { t: "Live dashboard", d: "Collected today and this term, outstanding, on plans and the share matched automatically.", icon: Icon.Chart },
      { t: "Class heatmap", d: "Every grade and stream at a glance, from low to fully collected.", icon: Icon.Sparkle },
      { t: "Cash projection", d: "Expected inflows for the next 30, 60 and 90 days from plans, Ratiba and your own payment history.", icon: Icon.Bank },
      { t: "Multi-campus view", d: "One organisation, several campuses, a group dashboard and a campus switcher.", icon: Icon.Gate },
      { t: "Reports in one click", d: "Collection by grade, fee-item summary, plans, waivers, cash-up and banking — as PDF or CSV.", icon: Icon.Book },
      { t: "Full audit trail", d: "Every money, permission and settings action is recorded. Payments are never edited or deleted.", icon: Icon.Lock },
    ],
  },
  {
    id: "staff",
    eyebrow: "Front office and teachers",
    title: "Less chasing. More teaching.",
    intro: "Everyone sees exactly what they need — and nothing they shouldn’t.",
    photo: "library",
    alt: "A teacher reading to a happy group of children in the library",
    items: [
      { t: "Clearance, not amounts", d: "Teachers see cleared or not cleared for exams and trips. Never what a family owes.", icon: Icon.Eye },
      { t: "One-search family lookup", d: "Find any family by learner, admission number, guardian phone or family code — then resend a statement in a tap.", icon: Icon.Users },
      { t: "Shared parent inbox", d: "Parent replies land in one inbox with tags, assignment and ready-made replies in English and Kiswahili.", icon: Icon.Chat },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        eyebrow="Features"
        title={
          <>
            Fees and parents. <span className="italic text-gold-600">Done beautifully.</span>
          </>
        }
        intro="Everything a Kenyan private school needs to collect fees on time and keep parents in the loop — nothing it doesn’t."
        actions={
          <>
            <Button href="/book-demo/" arrow>
              Book a free demo
            </Button>
            <Button href="/pricing/" variant="outline">
              See pricing
            </Button>
          </>
        }
        aside={
          <nav aria-label="Feature groups" className="grid gap-3 sm:grid-cols-2">
            {groups.map((g, i) => (
              <a
                key={g.id}
                href={`#${g.id}`}
                className={`group flex items-center justify-between gap-4 rounded-2xl p-5 shadow-soft ring-1 ring-navy-900/5 transition hover:-translate-y-0.5 ${
                  i === 0 ? "bg-navy-900 text-cream-50 sm:col-span-2" : "bg-cream-50 text-navy-900"
                }`}
              >
                <span>
                  <span className={`block text-xs font-bold uppercase tracking-[0.16em] ${i === 0 ? "text-gold-300" : "text-gold-700"}`}>{g.eyebrow}</span>
                  <span className="mt-1 block font-display text-xl">{g.title}</span>
                </span>
                <Icon.Arrow className="size-5 shrink-0 transition group-hover:translate-x-1" />
              </a>
            ))}
          </nav>
        }
      />

      {groups.map((g, i) => (
        <section key={g.id} id={g.id} className={`scroll-mt-20 py-24 sm:py-28 ${i % 2 === 0 ? "bg-cream-100" : ""}`}>
          <Container>
            <div className="grid items-end gap-10 lg:grid-cols-[1.3fr_1fr]">
              <SectionHeading eyebrow={g.eyebrow} title={g.title} intro={g.intro} />
              <Reveal delay={100}>
                <PhotoCard name={g.photo} alt={g.alt} className="aspect-[16/10]" />
              </Reveal>
            </div>
            <div className="mt-14">
              <FeatureGrid items={g.items} cols={3} />
            </div>
          </Container>
        </section>
      ))}

      <CtaBand />
    </>
  );
}
