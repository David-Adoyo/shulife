import { Icon } from "./icons";
import { PlaceholderNote } from "./shared";
import { Container, Eyebrow } from "./ui";

const legalNav = [
  ["Terms of service", "/legal/terms/"],
  ["Privacy notice", "/legal/privacy/"],
  ["Data processing agreement", "/legal/dpa/"],
] as const;

/* Legal text must come from a lawyer ({{LEGAL_TEXT}}, §13 "Do not draft legal text").
 * Until then each page shows what the document will cover, clearly marked as pending. */
export function LegalPage({ title, intro, covers, current }: { title: string; intro: string; covers: string[]; current: string }) {
  return (
    <section className="py-16 lg:py-24">
      <Container className="grid gap-12 lg:grid-cols-[16rem_1fr] lg:gap-20">
        <nav aria-label="Legal" className="lg:sticky lg:top-28 lg:self-start">
          <p className="mb-4 text-sm font-semibold text-gold-700">Legal</p>
          <ul className="space-y-1">
            {legalNav.map(([l, h]) => (
              <li key={h}>
                <a
                  href={h}
                  aria-current={h === current ? "page" : undefined}
                  className={`block rounded-xl px-4 py-3 font-semibold transition ${h === current ? "bg-navy-900 text-cream-50" : "text-navy-900 hover:bg-cream-100"}`}
                >
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="max-w-3xl">
          <Eyebrow>Legal</Eyebrow>
          <h1 className="font-display text-5xl font-medium leading-tight text-navy-900 sm:text-6xl">{title}</h1>
          <p className="mt-6 text-xl leading-relaxed text-ink-600">{intro}</p>
          <div className="mt-10">
            <PlaceholderNote>
              <b>This document is being prepared with our lawyers</b> and will be published here before Shulife launches. If you need it sooner for your board or auditors, please{" "}
              <a href="/book-demo/" className="font-semibold underline decoration-gold-500 decoration-2 underline-offset-4">
                contact us
              </a>
              .
            </PlaceholderNote>
          </div>
          <h2 className="mt-14 font-display text-3xl text-navy-900">What it will cover</h2>
          <ul className="mt-6 divide-y divide-navy-900/10 border-y border-navy-900/10">
            {covers.map((c) => (
              <li key={c} className="flex items-start gap-4 py-4 text-lg text-navy-900">
                <Icon.Check className="mt-1 size-5 shrink-0 text-gold-600" strokeWidth={2.2} />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
