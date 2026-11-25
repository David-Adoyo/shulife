import type { Metadata } from "next";
import { DemoForm } from "@/components/demo-form";
import { Mark, Ripple } from "@/components/brand";
import { Icon } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { Photo } from "@/components/shared";
import { Button, Container } from "@/components/ui";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Book a free demo",
  description: "See Shulife with your own fee structure. Tell us about your school and we’ll arrange a free demo.",
};

const expect = [
  ["A short call", "We learn how your school collects fees today.", Icon.Phone],
  ["Your own demo", "We show Shulife with your grades, fee items and sibling rule.", Icon.Chart],
  ["A clear next step", "If it’s a fit, we can set everything up for you.", Icon.Check],
] as const;

export default function BookDemoPage() {
  return (
    <section className="relative overflow-hidden bg-navy-900 text-cream-50">
      <div aria-hidden className="absolute -left-10 top-40 size-48 max-lg:hidden">
        <Ripple className="rounded-full" color="border-gold-400/30" />
      </div>
      <Container className="relative grid gap-14 py-16 lg:grid-cols-[1fr_1.1fr] lg:gap-20 lg:py-24">
        <Reveal>
          <Mark tone="cream" className="h-14 w-auto" />
          <h1 className="mt-8 font-display text-5xl leading-[1.02] sm:text-6xl">
            Book a <span className="italic text-gold-300">free</span> demo.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-cream-100/80">See Shulife with your own fee structure. No obligation, no hard sell.</p>
          <ol className="mt-10 space-y-5">
            {expect.map(([t, d, I], i) => (
              <li key={t} className="flex gap-4">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-navy-800 text-gold-300">
                  <I className="size-5" />
                </span>
                <div>
                  <p className="font-semibold">
                    {i + 1}. {t}
                  </p>
                  <p className="text-cream-100/70">{d}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-10 hidden aspect-[16/10] overflow-hidden rounded-3xl lg:block">
            <Photo name="classroom" alt="A teacher with happy pupils in a sunlit classroom" className="size-full" sizes="480px" />
          </div>
        </Reveal>
        <Reveal delay={100}>
          <DemoForm />
          {site.bookingUrl && (
            <div className="mt-6 text-center">
              <Button href={site.bookingUrl} variant="outline-cream" arrow>
                Or pick a time in our calendar
              </Button>
            </div>
          )}
        </Reveal>
      </Container>
    </section>
  );
}
