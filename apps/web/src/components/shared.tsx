import type { ReactNode } from "react";
import { Mark } from "./brand";
import { Ring } from "./hero";
import { Icon } from "./icons";
import { Reveal } from "./reveal";
import { Button, Container, Eyebrow, Money } from "./ui";

/* ---------- Photography ---------- */

const photoWidths = {
  classroom: 1536,
  sports: 1536,
  science: 1024,
  parent: 1024,
  garden: 1536,
  bursar: 1024,
  library: 1024,
  music: 1536,
  director: 1536,
  football: 1536,
  art: 1536,
  graduation: 1024,
} as const;
export type PhotoName = keyof typeof photoWidths;

export function Photo({
  name,
  alt,
  className = "",
  sizes = "(min-width: 1024px) 50vw, 92vw",
  priority,
}: {
  name: PhotoName;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const w = photoWidths[name];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/images/${name}-800.webp`}
      srcSet={`/images/${name}-800.webp 800w, /images/${name}-${w}.webp ${w}w`}
      sizes={sizes}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      className={`object-cover ${className}`}
    />
  );
}

/* ---------- Page hero ---------- */

export function PageHero({
  eyebrow,
  title,
  intro,
  actions,
  photo,
  aside,
  tone = "cream",
}: {
  eyebrow: string;
  title: ReactNode;
  intro: ReactNode;
  actions?: ReactNode;
  photo?: { name: PhotoName; alt: string; position?: string };
  aside?: ReactNode;
  tone?: "cream" | "navy";
}) {
  const dark = tone === "navy";
  return (
    <section className={`relative overflow-hidden ${dark ? "bg-navy-900 text-cream-50" : ""}`}>
      <Container className={`relative grid items-center gap-12 pb-20 pt-12 sm:pb-24 lg:gap-16 lg:pt-16 ${photo || aside ? "lg:grid-cols-[1.05fr_1fr]" : ""}`}>
        <div className={photo || aside ? "" : "max-w-3xl"}>
          <Eyebrow tone={dark ? "cream" : "gold"}>{eyebrow}</Eyebrow>
          <h1 className={`font-display text-[2.6rem] font-medium leading-[1.04] sm:text-6xl lg:text-[4.2rem] ${dark ? "text-cream-50" : "text-navy-900"}`}>{title}</h1>
          <div className={`mt-7 max-w-[36rem] text-lg leading-relaxed sm:text-xl ${dark ? "text-cream-100/80" : "text-ink-600"}`}>{intro}</div>
          {actions && <div className="mt-10 flex flex-wrap items-center gap-4">{actions}</div>}
        </div>
        {photo && (
          <div className="relative mx-auto w-full max-w-[560px] lg:max-w-none">
            <div className="relative aspect-[4/3.6] overflow-hidden rounded-2xl bg-navy-100">
              <Photo name={photo.name} alt={photo.alt} priority sizes="(min-width: 1024px) 560px, 92vw" className={`size-full ${photo.position ?? ""}`} />
            </div>
          </div>
        )}
        {aside && !photo && <div className="relative">{aside}</div>}
      </Container>
    </section>
  );
}

/* ---------- Section heading ---------- */

export function SectionHeading({
  eyebrow,
  title,
  intro,
  center,
  tone = "light",
  className = "",
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  center?: boolean;
  tone?: "light" | "dark";
  className?: string;
}) {
  const dark = tone === "dark";
  return (
    <Reveal className={`${center ? "mx-auto text-center" : ""} max-w-3xl ${className}`}>
      {eyebrow && <Eyebrow tone={dark ? "cream" : "gold"}>{eyebrow}</Eyebrow>}
      <h2 className={`font-display text-4xl leading-[1.08] sm:text-[3.2rem] ${dark ? "text-cream-50" : "text-navy-900"}`}>{title}</h2>
      {intro && <p className={`mt-5 text-lg leading-relaxed ${center ? "mx-auto max-w-2xl" : "max-w-2xl"} ${dark ? "text-cream-100/80" : "text-ink-600"}`}>{intro}</p>}
    </Reveal>
  );
}

/* ---------- Feature card grid ---------- */

export type Feature = { t: string; d: string; icon: (p: React.SVGProps<SVGSVGElement>) => React.JSX.Element };

export function FeatureGrid({ items, cols = 4, tone = "light" }: { items: Feature[]; cols?: 2 | 3 | 4; tone?: "light" | "dark" }) {
  const grid = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[cols];
  const dark = tone === "dark";
  return (
    <div className={`grid gap-x-10 gap-y-10 ${grid}`}>
      {items.map((p) => (
        <div key={p.t} className={`border-t pt-6 ${dark ? "border-cream-50/15" : "border-navy-900/15"}`}>
          <p.icon className={`size-6 ${dark ? "text-gold-300" : "text-gold-600"}`} />
          <h3 className={`mt-4 text-lg font-bold ${dark ? "text-cream-50" : "text-navy-900"}`}>{p.t}</h3>
          <p className={`mt-2 leading-relaxed ${dark ? "text-cream-100/70" : "text-ink-600"}`}>{p.d}</p>
        </div>
      ))}
    </div>
  );
}

/* ---------- Split feature row (text + visual) ---------- */

export function FeatureRow({
  eyebrow,
  title,
  body,
  points,
  visual,
  reverse,
  id,
  action,
}: {
  eyebrow: string;
  title: ReactNode;
  body: ReactNode;
  points?: string[];
  visual: ReactNode;
  reverse?: boolean;
  id?: string;
  action?: ReactNode;
}) {
  return (
    <div id={id} className="grid scroll-mt-28 items-center gap-12 lg:grid-cols-2 lg:gap-20">
      <Reveal className={reverse ? "lg:order-2" : ""}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h3 className="font-display text-3xl leading-tight text-navy-900 sm:text-[2.6rem]">{title}</h3>
        <div className="mt-5 text-lg leading-relaxed text-ink-600">{body}</div>
        {points && <Checklist items={points} className="mt-7" />}
        {action && <div className="mt-8">{action}</div>}
      </Reveal>
      <Reveal delay={120} className={`min-w-0 ${reverse ? "lg:order-1" : ""}`}>
        {visual}
      </Reveal>
    </div>
  );
}

export function Checklist({ items, className = "", tone = "light" }: { items: string[]; className?: string; tone?: "light" | "dark" }) {
  return (
    <ul className={`space-y-3 ${className}`}>
      {items.map((p) => (
        <li key={p} className={`flex items-start gap-3 ${tone === "dark" ? "text-cream-50" : "text-navy-900"}`}>
          <Icon.Check className={`mt-1 size-4 shrink-0 ${tone === "dark" ? "text-gold-300" : "text-gold-600"}`} strokeWidth={2.4} />
          {p}
        </li>
      ))}
    </ul>
  );
}

/* ---------- Photo card ---------- */

export function PhotoCard({ name, alt, label, className = "aspect-[4/3]" }: { name: PhotoName; alt: string; label?: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      <Photo name={name} alt={alt} className="size-full" />
      {label && (
        <span className="absolute bottom-4 left-4 rounded-full bg-cream-50/90 px-3 py-1 text-sm font-semibold text-navy-900 backdrop-blur">{label}</span>
      )}
    </div>
  );
}

/* ---------- Director dashboard mock ---------- */

export function DashboardMock() {
  const grades = ["PP1", "PP2", "G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9"];
  const east = [92, 88, 100, 81, 76, 100, 69, 84, 58, 73, 90];
  const west = [85, 94, 79, 100, 88, 71, 92, 63, 81, 66, 77];
  const tone = (v: number) => (v === 100 ? "bg-paid text-white" : v >= 85 ? "bg-paid/70 text-white" : v >= 75 ? "bg-partial/60 text-navy-950" : v >= 65 ? "bg-partial/35 text-navy-950" : "bg-due/60 text-white");
  const projection = [12, 18, 15, 24, 30, 22, 28, 35, 31, 40, 38, 46];
  return (
    <div className="min-w-0 rounded-2xl bg-navy-900 p-6 text-cream-50 shadow-lift sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Mark tone="cream" className="h-8 w-auto" />
          <div>
            <p className="text-sm text-cream-100/70">Mlima Academy · Ruiru</p>
            <p className="font-semibold">Term 1 · 2027</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-cream-50/10 px-3 py-1.5 text-xs font-semibold">
          <span className="size-2 rounded-full bg-paid" />
          Live
        </span>
      </div>

      <div className="mt-8 grid gap-8 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="flex min-w-0 items-center gap-5">
          <Ring pct={78} size={120} />
          <div>
            <p className="font-display text-5xl">78%</p>
            <p className="text-sm text-cream-100/70">
              <Money amount={5_850_000} /> of 7.5m
            </p>
          </div>
        </div>
        <div className="min-w-0">
          <p className="mb-3 text-sm font-semibold text-gold-300">Class heatmap · % collected</p>
          <div className="no-scrollbar overflow-x-auto">
            <table className="w-full border-separate border-spacing-1 text-center text-[0.7rem] tabular">
              <thead>
                <tr>
                  <th className="w-10" />
                  {grades.map((g) => (
                    <th key={g} className="font-medium text-cream-100/60">
                      {g}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    ["East", east],
                    ["West", west],
                  ] as const
                ).map(([name, row]) => (
                  <tr key={name}>
                    <th className="pr-1 text-left font-medium text-cream-100/60">{name}</th>
                    {row.map((v, i) => (
                      <td key={i} className={`h-9 min-w-8 rounded-md font-semibold ${tone(v)}`}>
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-navy-800 p-5">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <p className="text-sm font-semibold">Cash projected · next 30 days</p>
          <p className="text-sm text-gold-300">From plans and payment history</p>
        </div>
        <div className="mt-4 flex h-24 items-end gap-1.5">
          {projection.map((v, i) => (
            <span key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-gold-500 to-gold-300" style={{ height: `${(v / 46) * 100}%` }} />
          ))}
        </div>
      </div>
      <p className="mt-4 text-xs text-cream-100/50">Illustrative dashboard with fictional demo data.</p>
    </div>
  );
}

/* ---------- Money flow ---------- */

export function MoneyFlow() {
  const steps = [
    ["Parent pays with M-Pesa or bank", Icon.Users],
    ["Money lands in the school’s own Paybill or bank", Icon.Bank],
    ["Shulife reads the confirmation, matches and receipts", Icon.Receipt],
  ] as const;
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        {steps.map(([label, I], i) => (
          <div key={label} className="relative flex items-center gap-3 sm:flex-1 sm:flex-col sm:text-center">
            <span className={`inline-flex size-14 shrink-0 items-center justify-center rounded-2xl ${i === 1 ? "bg-gold-400 text-navy-950" : "bg-navy-800 text-gold-300"}`}>
              <I className="size-6" />
            </span>
            <p className="text-sm font-semibold sm:px-2">{label}</p>
            {i < 2 && <Icon.Arrow className="ml-auto size-5 shrink-0 text-gold-400 sm:absolute sm:-right-3 sm:top-4 sm:ml-0" />}
          </div>
        ))}
      </div>
      <p className="mt-5 text-sm text-cream-100/60">The money goes to the school. Only the confirmation comes to Shulife.</p>
    </div>
  );
}

/* ---------- FAQ list ---------- */

export function FaqList({ items, tone = "cream" }: { items: readonly (readonly [string, string])[]; tone?: "cream" | "white" }) {
  return (
    <div className="divide-y divide-navy-900/10 border-y border-navy-900/10">
      {items.map(([q, a]) => (
        <details key={q} className="group py-2">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 text-lg font-semibold text-navy-900 [&::-webkit-details-marker]:hidden">
            {q}
            <span
              className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full text-navy-900 ring-1 ring-navy-900/10 transition group-open:rotate-45 group-open:bg-navy-900 group-open:text-gold-300 ${
                tone === "cream" ? "bg-cream-50" : "bg-cream-100"
              }`}
            >
              <Icon.Plus className="size-5" />
            </span>
          </summary>
          <p className="pb-5 pr-14 text-lg leading-relaxed text-ink-600">{a}</p>
        </details>
      ))}
    </div>
  );
}

export function FaqJsonLd({ items }: { items: readonly (readonly [string, string])[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

/* ---------- Final CTA band ---------- */

export function CtaBand({
  title = "See it with your own fee structure",
  body = "Send us last term’s fee structure and a sample of your M-Pesa statement. In a 30-minute call we’ll show you how Shulife would have matched it.",
}: {
  title?: ReactNode;
  body?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-navy-900 py-24 text-cream-50 sm:py-28">
      <Container className="relative">
        <Reveal className="max-w-2xl">
          <h2 className="font-display text-4xl leading-[1.08] sm:text-5xl">{title}</h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-cream-100/80">{body}</p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button href="/book-demo/" arrow>
              Book a demo
            </Button>
            <Button href="/how-it-works/" variant="outline-cream">
              How it works
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

/* ---------- Placeholder note (for unconfirmed content) ---------- */

export function PlaceholderNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-dashed border-gold-500/60 bg-gold-200/30 p-5 text-navy-900">
      <Icon.Clock className="mt-0.5 size-5 shrink-0 text-gold-700" />
      <div className="text-[0.95rem] leading-relaxed">{children}</div>
    </div>
  );
}
