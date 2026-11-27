import type { Metadata } from "next";
import { CtaBand, PageHero, Photo } from "@/components/shared";
import { Container, Eyebrow } from "@/components/ui";

export const metadata: Metadata = {
  title: "About",
  description: "Shulife is fee collection and parent messaging for Kenyan private schools. The name comes from shule, Kiswahili for school.",
};

const decisions = [
  ["We don’t touch the money.", "Fees go into the school’s own Paybill or bank account. We only receive the notification that a payment arrived. If Shulife disappeared tomorrow, not a shilling would be stuck with us."],
  ["We only do fees and parents.", "No timetables, report cards or exam analysis. Most schools already have a system for that, and we work alongside it with Excel and CSV import and export."],
  ["Teachers never see amounts.", "A class teacher sees whether a learner is cleared for an exam or trip. They don’t see what the family owes, and children are never sent messages."],
  ["Payments are never edited.", "If something was recorded wrong, the fix is a new entry that someone has to approve. The original stays in the ledger, and the director can see who did what."],
  ["Parents don’t need an app.", "Most parents already have M-Pesa, SMS and WhatsApp. We use those, in English or Kiswahili, and keep the web pages light enough for a slow connection."],
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="Fee collection for Kenyan private schools"
        intro={
          <p>
            Shulife takes its name from <i>shule</i>, Kiswahili for school. It does two things: works out who each fee payment belongs to, and keeps parents informed about what they’ve paid and what’s left.
          </p>
        }
        photo={{ name: "garden", alt: "A teacher and pupils planting seedlings in the school garden" }}
      />

      <section className="bg-navy-900 py-24 text-cream-50 sm:py-28">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
          <div>
            <Eyebrow tone="cream">Why it exists</Eyebrow>
            <h2 className="font-display text-4xl leading-[1.08] sm:text-5xl">The start of term in a bursar’s office</h2>
          </div>
          <div className="space-y-6 text-lg leading-relaxed text-cream-100/85">
            <p>In the first two weeks of term, a school of 500 learners can receive well over a thousand M-Pesa payments. Many have the wrong account number. Some have none. A parent pays once for three children. A grandmother pays from her own phone.</p>
            <p>Someone has to go through the statement and work out whose money each one is, then write the receipts, then answer calls from parents asking whether it arrived. That someone is usually the bursar, and it takes days.</p>
            <p>Shulife does that matching automatically and sends the receipts. The bursar only looks at the payments it can’t place with confidence.</p>
          </div>
        </Container>
      </section>

      <section className="py-24 sm:py-28">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
          <div>
            <Eyebrow>How we’ve built it</Eyebrow>
            <h2 className="font-display text-4xl leading-[1.08] text-navy-900 sm:text-5xl">Decisions we made early</h2>
            <div className="mt-10 hidden overflow-hidden rounded-2xl lg:block">
              <Photo name="art" alt="Pupils painting in an art lesson" className="aspect-[4/5] w-full object-[60%_50%]" sizes="440px" />
            </div>
          </div>
          <ol className="divide-y divide-navy-900/10 border-y border-navy-900/10">
            {decisions.map(([t, d]) => (
              <li key={t} className="py-7">
                <h3 className="font-display text-2xl text-navy-900">{t}</h3>
                <p className="mt-2 text-lg leading-relaxed text-ink-600">{d}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
