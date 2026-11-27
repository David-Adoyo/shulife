import type { Metadata } from "next";
import { DemoForm } from "@/components/demo-form";
import { Icon } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { Photo } from "@/components/shared";
import { Button, Container } from "@/components/ui";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Book a demo",
  description: "See Shulife with your own fee structure. Tell us about your school and we’ll arrange a free demo.",
};

const expect = [
  ["First call", "We ask how your school collects fees now and what goes wrong at the start of term.", Icon.Phone],
  ["The demo", "We set Shulife up with your grades, fee items and sibling rule, so you see your own school.", Icon.Chart],
  ["After that", "If you want to go ahead, we can do the set-up for you. If not, that’s the end of it.", Icon.Check],
] as const;

export default function BookDemoPage() {
  return (
    <section className="relative overflow-hidden bg-navy-900 text-cream-50">
      <Container className="relative grid gap-14 py-16 lg:grid-cols-[1fr_1.1fr] lg:gap-20 lg:py-24">
        <Reveal>
          <h1 className="font-display text-5xl leading-[1.04] sm:text-6xl">Book a demo</h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-cream-100/80">It’s a 30-minute call, free. Leave your number and we’ll ring you to find a time.</p>
          <ol className="mt-10 space-y-5">
            {expect.map(([t, d, I]) => (
              <li key={t} className="flex gap-4">
                <I className="mt-0.5 size-5 shrink-0 text-gold-300" />
                <div>
                  <p className="font-semibold">{t}</p>
                  <p className="text-cream-100/70">{d}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-10 hidden aspect-[16/10] overflow-hidden rounded-2xl lg:block">
            <Photo name="classroom" alt="A teacher with pupils in a classroom" className="size-full" sizes="480px" />
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
