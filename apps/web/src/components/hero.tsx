"use client";

import { useState } from "react";
import { Ripple } from "./brand";
import { Icon } from "./icons";
import { Button, Container, Money } from "./ui";

const audiences = {
  schools: {
    label: "For schools",
    title: (
      <>
        Every fee. Every parent.{" "}
        <em className="relative whitespace-nowrap not-italic text-gold-600">
          On time.
          <svg aria-hidden viewBox="0 0 220 18" className="absolute -bottom-2 left-0 w-full text-gold-400" preserveAspectRatio="none">
            <path d="M3 13C50 5 120 3 217 9" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
          </svg>
        </em>
      </>
    ),
    body: "Shulife matches every M-Pesa payment, splits it between siblings, receipts parents instantly and keeps them informed, so your bursar gets their week back.",
    primary: { label: "Book a free demo", href: "/book-demo/" },
    secondary: { label: "See how it works", href: "/how-it-works/" },
    image: "/images/classroom",
    alt: "A smiling teacher helping a diverse group of happy pupils with their exercise books in a sunlit classroom",
  },
  parents: {
    label: "For parents",
    title: (
      <>
        Pay school fees.{" "}
        <em className="not-italic text-gold-600">Get a receipt in seconds.</em>
      </>
    ),
    body: "Pay into your school's Paybill with your child's admission number. Shulife sends your receipt straight away, and you can check your balance on WhatsApp any time. No app. No password.",
    primary: { label: "How to pay", href: "/for-parents/#pay" },
    secondary: { label: "Check your balance", href: "/for-parents/#whatsapp" },
    image: "/images/parent",
    alt: "A happy mother checking her phone at the school gate as her two children in uniform hug her",
  },
} as const;

type Key = keyof typeof audiences;

export function Hero() {
  const [who, setWho] = useState<Key>("schools");
  const a = audiences[who];

  return (
    <section id="top" className="relative overflow-hidden pb-16 pt-6 sm:pb-24 lg:pt-10">
      <div aria-hidden className="grain absolute inset-0 [mask-image:radial-gradient(70%_60%_at_80%_30%,black,transparent)]" />
      <Container className="relative">
        <div role="tablist" aria-label="Choose your view" className="mb-10 inline-flex rounded-full bg-cream-100 p-1 ring-1 ring-navy-900/5">
          {(Object.keys(audiences) as Key[]).map((k) => (
            <button
              key={k}
              role="tab"
              aria-selected={who === k}
              onClick={() => setWho(k)}
              className={`h-10 rounded-full px-5 text-sm font-semibold transition-all ${
                who === k ? "bg-navy-900 text-cream-50 shadow-soft" : "text-navy-900 hover:text-navy-700"
              }`}
            >
              {audiences[k].label}
            </button>
          ))}
        </div>

        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div key={who} className="animate-[fadeUp_.6s_ease-out]">
            <h1 className="font-display text-[2.75rem] font-medium leading-[1.02] text-navy-900 sm:text-6xl lg:text-[4.6rem]">{a.title}</h1>
            <p className="mt-8 max-w-[34rem] text-lg leading-relaxed text-ink-600 sm:text-xl">{a.body}</p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button href={a.primary.href} arrow>
                {a.primary.label}
              </Button>
              <Button href={a.secondary.href} variant="outline">
                {a.secondary.label}
              </Button>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-ink-600">
              {["Your money never touches us", "Works with your Paybill", "No app for parents"].map((t) => (
                <li key={t} className="inline-flex items-center gap-2">
                  <span className="inline-flex size-5 items-center justify-center rounded-full bg-gold-200 text-navy-900">
                    <Icon.Check className="size-3.5" strokeWidth={2.4} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-[560px] lg:max-w-none">
            <div className="absolute -right-10 -top-10 size-72 rounded-full bg-gold-200/60 blur-3xl" aria-hidden />
            <div className="absolute -bottom-12 -left-12 size-72 rounded-full bg-navy-100 blur-3xl" aria-hidden />
            <div className="relative aspect-[4/4.4] overflow-hidden rounded-[2rem] bg-navy-100 shadow-lift sm:aspect-[4/3.9]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={a.image}
                src={`${a.image}-800.webp`}
                srcSet={`${a.image}-800.webp 800w, ${a.image}-${who === "schools" ? 1536 : 1024}.webp ${who === "schools" ? 1536 : 1024}w`}
                sizes="(min-width: 1024px) 560px, 92vw"
                alt={a.alt}
                className={`size-full animate-[fadeIn_.7s_ease-out] object-cover ${who === "parents" ? "object-[50%_30%]" : "object-[40%_50%]"}`}
                fetchPriority="high"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/35 via-transparent to-transparent" />
            </div>

            {who === "schools" ? <SchoolCards /> : <ParentCards />}
          </div>
        </div>
      </Container>
    </section>
  );
}

function SchoolCards() {
  return (
    <>
      <div className="absolute -left-4 top-8 w-[min(300px,78%)] animate-float rounded-2xl bg-cream-50/95 p-4 shadow-lift ring-1 ring-navy-900/5 backdrop-blur sm:-left-10">
        <div className="flex items-start gap-3">
          <span className="relative mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-navy-900 text-gold-300">
            <Ripple className="rounded-full" />
            <Icon.Receipt className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-paid">Payment matched · Auto</p>
            <p className="mt-0.5 font-display text-2xl text-navy-900">
              <Money amount={45000} />
            </p>
            <p className="text-sm text-ink-600">Split across 3 children · receipted</p>
          </div>
        </div>
        <SplitBar className="mt-3" />
      </div>

      <div className="absolute -bottom-8 -right-3 w-[min(250px,64%)] rounded-2xl bg-navy-900 p-5 text-cream-50 shadow-lift sm:-right-8">
        <div className="flex items-center gap-4">
          <Ring pct={86} />
          <div>
            <p className="text-xs uppercase tracking-wider text-cream-100/70">Term 1 · 2027</p>
            <p className="font-display text-2xl">86% collected</p>
            <p className="text-xs text-cream-100/70">Live, by grade</p>
          </div>
        </div>
      </div>
    </>
  );
}

function ParentCards() {
  return (
    <>
      <div className="absolute -left-4 top-10 w-[min(290px,78%)] animate-float rounded-2xl bg-[#e7f6ea] p-4 shadow-lift ring-1 ring-navy-900/5 sm:-left-10">
        <p className="text-xs font-semibold text-paid">WhatsApp · just now</p>
        <p className="mt-1 text-sm leading-snug text-ink-900">
          Thank you! We have received <b>KSh 45,000</b> for Amani, Zawadi and Baraka. Receipt no. 2027-01845.
        </p>
      </div>
      <div className="absolute -bottom-8 -right-3 w-[min(240px,62%)] rounded-2xl bg-navy-900 p-5 text-cream-50 shadow-lift sm:-right-8">
        <p className="text-xs uppercase tracking-wider text-cream-100/70">Family balance</p>
        <p className="mt-1 font-display text-3xl">
          <Money amount={0} />
        </p>
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-paid/25 px-2.5 py-1 text-xs font-semibold text-[#9fe0bf]">
          <Icon.Check className="size-3.5" strokeWidth={2.4} /> Fully paid
        </p>
      </div>
    </>
  );
}

export function Ring({ pct, size = 64 }: { pct: number; size?: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="shrink-0 -rotate-90" aria-hidden>
      <circle cx="32" cy="32" r={r} fill="none" stroke="rgb(255 255 255 / 0.14)" strokeWidth="7" />
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--color-gold-400)" strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} />
    </svg>
  );
}

export function SplitBar({ className = "" }: { className?: string }) {
  const parts = [
    { name: "Amani", pct: 40, cls: "bg-navy-900" },
    { name: "Zawadi", pct: 35, cls: "bg-gold-400" },
    { name: "Baraka", pct: 25, cls: "bg-navy-600" },
  ];
  return (
    <div className={className}>
      <div className="flex h-2.5 overflow-hidden rounded-full">
        {parts.map((p) => (
          <span key={p.name} className={p.cls} style={{ width: `${p.pct}%` }} />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[0.7rem] font-medium text-ink-600">
        {parts.map((p) => (
          <span key={p.name} className="inline-flex items-center gap-1">
            <span className={`size-2 rounded-full ${p.cls}`} />
            {p.name}
          </span>
        ))}
      </div>
    </div>
  );
}
