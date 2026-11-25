import type { Metadata } from "next";
import { Icon } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { CtaBand, PageHero, Photo } from "@/components/shared";
import { Container } from "@/components/ui";
import { articles } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Resources",
  description: "Practical guides for Kenyan school bursars and directors: M-Pesa reconciliation, fee statements and kinder fee collection.",
};

export default function ResourcesPage() {
  const [first, ...rest] = articles;
  return (
    <>
      <PageHero
        eyebrow="Resources"
        title={
          <>
            Guides for a <span className="italic text-gold-600">calmer</span> term.
          </>
        }
        intro="Practical answers to the questions bursars and directors ask most — whether or not you use Shulife."
      />

      <section className="pb-24 sm:pb-32">
        <Container>
          <Reveal>
            <a href={`/resources/${first.slug}/`} className="group grid overflow-hidden rounded-[2rem] bg-navy-900 text-cream-50 shadow-lift lg:grid-cols-2">
              <div className="aspect-[16/10] overflow-hidden lg:aspect-auto">
                <Photo name={first.photo} alt={first.alt} className="size-full transition duration-700 group-hover:scale-105" />
              </div>
              <div className="flex flex-col justify-center p-8 sm:p-12">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-300">
                  {first.audience} · {first.readMins} min read
                </p>
                <h2 className="mt-4 font-display text-3xl leading-tight sm:text-4xl">{first.title}</h2>
                <p className="mt-4 text-lg text-cream-100/80">{first.summary}</p>
                <span className="mt-8 inline-flex items-center gap-2 font-semibold text-gold-300">
                  Read the guide <Icon.Arrow className="size-5 transition group-hover:translate-x-1" />
                </span>
              </div>
            </a>
          </Reveal>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {rest.map((a, i) => (
              <Reveal key={a.slug} delay={i * 100}>
                <a href={`/resources/${a.slug}/`} className="group flex h-full flex-col overflow-hidden rounded-[2rem] bg-cream-50 shadow-soft ring-1 ring-navy-900/5">
                  <div className="aspect-[16/9] overflow-hidden">
                    <Photo name={a.photo} alt={a.alt} className="size-full transition duration-700 group-hover:scale-105" sizes="(min-width:768px) 50vw, 92vw" />
                  </div>
                  <div className="flex flex-1 flex-col p-8">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-700">
                      {a.audience} · {a.readMins} min read
                    </p>
                    <h2 className="mt-3 font-display text-2xl leading-snug text-navy-900">{a.title}</h2>
                    <p className="mt-3 text-ink-600">{a.summary}</p>
                    <span className="mt-auto inline-flex items-center gap-2 pt-6 font-semibold text-navy-900">
                      Read the guide <Icon.Arrow className="size-5 transition group-hover:translate-x-1" />
                    </span>
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
