import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { CtaBand, Photo } from "@/components/shared";
import { Container, Eyebrow } from "@/components/ui";
import { articles } from "@/lib/articles";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = articles.find((x) => x.slug === slug);
  return a ? { title: a.title, description: a.summary } : {};
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const a = articles.find((x) => x.slug === slug);
  if (!a) notFound();
  const others = articles.filter((x) => x.slug !== a.slug);

  return (
    <>
      <article>
        <header className="pb-12 pt-12 lg:pt-16">
          <Container className="max-w-[900px]">
            <a href="/resources/" className="inline-flex items-center gap-2 text-sm font-semibold text-navy-900 hover:text-gold-700">
              <Icon.Arrow className="size-4 rotate-180" /> All resources
            </a>
            <div className="mt-8">
              <Eyebrow>
                For {a.audience.toLowerCase()} · {a.readMins} min read
              </Eyebrow>
            </div>
            <h1 className="font-display text-4xl font-medium leading-[1.08] text-navy-900 sm:text-[3.4rem]">{a.title}</h1>
            <p className="mt-6 text-xl leading-relaxed text-ink-600">{a.summary}</p>
          </Container>
        </header>
        <Container className="max-w-[1100px]">
          <div className="aspect-[16/8] overflow-hidden rounded-2xl">
            <Photo name={a.photo} alt={a.alt} priority className="size-full" sizes="(min-width:1100px) 1100px, 92vw" />
          </div>
        </Container>
        <Container className="max-w-[760px] py-16 sm:py-20">
          {a.sections.map((s) => (
            <section key={s.h} className="mb-12">
              <h2 className="font-display text-3xl text-navy-900">{s.h}</h2>
              {s.p?.map((p) => (
                <p key={p} className="mt-5 text-lg leading-[1.8] text-ink-900/85">
                  {p}
                </p>
              ))}
              {s.list && (
                <ul className="mt-6 space-y-3">
                  {s.list.map((l) => (
                    <li key={l} className="flex gap-3 text-lg leading-relaxed text-ink-900/85">
                      <span className="mt-2.5 size-2 shrink-0 rounded-full bg-gold-500" />
                      {l}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </Container>
      </article>

      <section className="bg-cream-100 py-20">
        <Container>
          <h2 className="font-display text-3xl text-navy-900">More guides</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {others.map((o) => (
              <a key={o.slug} href={`/resources/${o.slug}/`} className="group rounded-2xl bg-cream-50 p-7 ring-1 ring-navy-900/5">
                <p className="text-sm font-semibold text-gold-700">{o.audience}</p>
                <p className="mt-2 font-display text-2xl leading-snug text-navy-900">{o.title}</p>
                <span className="mt-5 inline-flex items-center gap-2 font-semibold text-navy-900">
                  Read <Icon.Arrow className="size-4 transition group-hover:translate-x-1" />
                </span>
              </a>
            ))}
          </div>
        </Container>
      </section>
      <CtaBand />
    </>
  );
}
