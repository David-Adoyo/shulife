import type { Metadata } from "next";
import { Mark } from "@/components/brand";
import { Icon } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { CtaBand, PageHero, Photo, SectionHeading } from "@/components/shared";
import { Container, Eyebrow } from "@/components/ui";

export const metadata: Metadata = {
  title: "About",
  description: "Shulife — from shule, Kiswahili for school — keeps school life running smoothly: every fee in on time, every parent in the loop.",
};

const promises = [
  ["Every payment matched, every parent receipted, instantly.", Icon.Receipt],
  ["Siblings sorted automatically.", Icon.Split],
  ["Kinder than sending children home.", Icon.Heart],
  ["Your money never touches us.", Icon.Bank],
  ["Live in an afternoon.", Icon.Clock],
] as const;

const values = [
  ["Dignified", "Parents are partners. We never shame, scold or share a family’s situation."],
  ["Warm", "Plain words, short sentences and a kind tone — in English and Kiswahili."],
  ["Orderly", "A clean ledger, a clear trail and one clear answer on every screen."],
  ["Quietly modern", "Powerful where it matters, invisible everywhere else. No app for parents."],
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Shulife"
        title={
          <>
            <i className="text-gold-600">Shule</i> + life.
          </>
        }
        intro={
          <>
            <p>
              Shulife comes from <i>shule</i>, Kiswahili for school. We keep school life running smoothly: every fee in on time, every parent in the loop — so teachers can teach and children can learn.
            </p>
          </>
        }
        photo={{ name: "garden", alt: "A teacher and diverse children planting seedlings together in the school garden" }}
      />

      <section className="bg-navy-900 py-24 text-cream-50 sm:py-32">
        <Container className="grid gap-14 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
          <Reveal>
            <Mark tone="cream" className="h-16 w-auto" />
            <h2 className="mt-8 font-display text-4xl leading-[1.08] sm:text-[3.2rem]">
              Built for the <span className="italic text-gold-300">front office</span> of the best school in Nairobi.
            </h2>
          </Reveal>
          <Reveal delay={100} className="space-y-6 text-lg leading-relaxed text-cream-100/85">
            <p>Every term in a Kenyan private school starts the same way: hundreds of M-Pesa messages, payments with the wrong reference, one payment for three children, and parents asking for their balance at the gate.</p>
            <p>Shulife does one job and does it beautifully: fees and parents. It works alongside whatever system your school already uses, sends every parent an instant receipt, and gives directors a calm, clear view of the term.</p>
            <p>And because a child should never be embarrassed at the gate, Shulife helps schools talk to parents first — privately, politely, with options.</p>
          </Reveal>
        </Container>
      </section>

      <section className="py-24 sm:py-32">
        <Container>
          <SectionHeading eyebrow="Our five promises" title="What every school can count on." />
          <ol className="mt-14 grid gap-4 md:grid-cols-5">
            {promises.map(([p, I], i) => (
              <Reveal as="li" key={p} delay={i * 70} className="flex flex-col rounded-3xl bg-cream-100 p-6">
                <span className="font-display text-4xl text-gold-500">0{i + 1}</span>
                <I className="mt-6 size-7 text-navy-900" />
                <p className="mt-4 font-display text-xl leading-snug text-navy-900">{p}</p>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      <section className="bg-cream-100 py-24 sm:py-32">
        <Container className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal className="grid grid-cols-2 gap-4">
            <div className="aspect-[3/4] overflow-hidden rounded-3xl">
              <Photo name="graduation" alt="A graduate hugging her proud teacher" className="size-full" sizes="(min-width:1024px) 280px, 45vw" />
            </div>
            <div className="mt-12 aspect-[3/4] overflow-hidden rounded-3xl">
              <Photo name="art" alt="Children painting with their art teacher" className="size-full object-[60%_50%]" sizes="(min-width:1024px) 280px, 45vw" />
            </div>
          </Reveal>
          <div>
            <Eyebrow>How we work</Eyebrow>
            <h2 className="font-display text-4xl leading-[1.08] text-navy-900 sm:text-[3.2rem]">Calm, warm and quietly confident.</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {values.map(([t, d], i) => (
                <Reveal key={t} delay={i * 80}>
                  <h3 className="font-display text-2xl text-navy-900">{t}</h3>
                  <p className="mt-2 leading-relaxed text-ink-600">{d}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="py-24 sm:py-28">
        <Container className="grid gap-6 md:grid-cols-3">
          {[
            ["Proudly Kenyan", "Built for Kenyan schools: KES, M-Pesa, Kenyan terms and grades, English and Kiswahili.", Icon.Globe],
            ["Fees and parents only", "No timetables or report cards. We sit beside your existing system and do our part brilliantly.", Icon.Check],
            ["Children come first", "We collect the minimum, never message learners and never expose a family’s balance.", Icon.Heart],
          ].map(([t, d, I], i) => {
            const C = I as typeof Icon.Globe;
            return (
              <Reveal key={t as string} delay={i * 80} className="rounded-3xl bg-navy-900 p-8 text-cream-50">
                <C className="size-8 text-gold-300" />
                <h3 className="mt-6 font-display text-2xl">{t as string}</h3>
                <p className="mt-3 text-cream-100/75">{d as string}</p>
              </Reveal>
            );
          })}
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
