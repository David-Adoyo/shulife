"use client";

import { useState } from "react";
import { Icon } from "./icons";
import { Button, Container, Money } from "./ui";

const audiences = {
  schools: {
    label: "For schools",
    title: <>Fee payments, matched to the right child automatically</>,
    body: "Parents keep paying into your Paybill the way they do now. Shulife reads each payment, finds the family, splits it between siblings and sends the receipt. Your bursar only sees the few it can’t place.",
    primary: { label: "Book a demo", href: "/book-demo/" },
    secondary: { label: "How it works", href: "/how-it-works/" },
    image: "/images/classroom",
    alt: "A teacher helping pupils with their exercise books",
  },
  parents: {
    label: "For parents",
    title: <>Your fee receipt, by SMS or WhatsApp</>,
    body: "Pay into your school’s Paybill with your child’s admission number as the account. You get a receipt straight away, and you can ask for your balance on WhatsApp whenever you need it. There’s nothing to download.",
    primary: { label: "How to pay", href: "/for-parents/#pay" },
    secondary: { label: "Check your balance", href: "/for-parents/#whatsapp" },
    image: "/images/parent",
    alt: "A mother checking her phone at the school gate while her two children hug her",
  },
} as const;

type Key = keyof typeof audiences;

export function Hero() {
  const [who, setWho] = useState<Key>("schools");
  const a = audiences[who];

  return (
    <section id="top" className="relative overflow-hidden pb-16 pt-6 sm:pb-24 lg:pt-10">
      <Container className="relative">
        <div role="tablist" aria-label="Choose your view" className="mb-10 inline-flex rounded-full bg-cream-100 p-1 ring-1 ring-navy-900/5">
          {(Object.keys(audiences) as Key[]).map((k) => (
            <button
              key={k}
              role="tab"
              aria-selected={who === k}
              onClick={() => setWho(k)}
              className={`h-10 rounded-full px-5 text-sm font-semibold transition-colors ${
                who === k ? "bg-navy-900 text-cream-50" : "text-navy-900 hover:text-navy-700"
              }`}
            >
              {audiences[k].label}
            </button>
          ))}
        </div>

        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div key={who}>
            <h1 className="font-display text-[2.4rem] font-medium leading-[1.06] text-navy-900 sm:text-5xl lg:text-[3.6rem]">{a.title}</h1>
            <p className="mt-8 max-w-[34rem] text-lg leading-relaxed text-ink-600 sm:text-xl">{a.body}</p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button href={a.primary.href} arrow>
                {a.primary.label}
              </Button>
              <Button href={a.secondary.href} variant="outline">
                {a.secondary.label}
              </Button>
            </div>
            <p className="mt-8 max-w-[34rem] text-sm text-ink-600">
              {who === "schools"
                ? "Fees go straight to your school’s own Paybill or bank. Shulife never holds the money."
                : "Shulife works for your child’s school. Questions about your account go to the school office."}
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-[560px] lg:max-w-none">
            <div className="relative aspect-[4/4.4] overflow-hidden rounded-2xl bg-navy-100 sm:aspect-[4/3.9]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={a.image}
                src={`${a.image}-800.webp`}
                srcSet={`${a.image}-800.webp 800w, ${a.image}-${who === "schools" ? 1536 : 1024}.webp ${who === "schools" ? 1536 : 1024}w`}
                sizes="(min-width: 1024px) 560px, 92vw"
                alt={a.alt}
                className={`size-full object-cover ${who === "parents" ? "object-[50%_30%]" : "object-[40%_50%]"}`}
                fetchPriority="high"
              />
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
      <div className="absolute -left-4 top-8 w-[min(300px,78%)] rounded-xl bg-cream-50 p-4 shadow-lift ring-1 ring-navy-900/10 sm:-left-10">
        <div className="flex items-start gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-paid">Matched to the Otieno family · 07:42</p>
            <p className="mt-0.5 font-display text-2xl text-navy-900">
              <Money amount={45000} />
            </p>
            <p className="text-sm text-ink-600">Split across 3 children, receipt sent</p>
          </div>
        </div>
        <SplitBar className="mt-3" />
      </div>

      <div className="absolute -bottom-8 -right-3 w-[min(250px,64%)] rounded-xl bg-navy-900 p-5 text-cream-50 shadow-lift sm:-right-8">
        <div className="flex items-center gap-4">
          <Ring pct={86} />
          <div>
            <p className="text-xs text-cream-100/70">Term 1, week 3</p>
            <p className="font-display text-2xl">86% collected</p>
          </div>
        </div>
      </div>
    </>
  );
}

function ParentCards() {
  return (
    <>
      <div className="absolute -left-4 top-10 w-[min(290px,78%)] rounded-xl bg-[#e7f6ea] p-4 shadow-lift ring-1 ring-navy-900/10 sm:-left-10">
        <p className="text-xs font-semibold text-paid">WhatsApp · just now</p>
        <p className="mt-1 text-sm leading-snug text-ink-900">
          Mlima Academy: we have received <b>KSh 45,000</b> for Amani, Zawadi and Baraka. Receipt no. 2027-01845.
        </p>
      </div>
      <div className="absolute -bottom-8 -right-3 w-[min(240px,62%)] rounded-xl bg-navy-900 p-5 text-cream-50 shadow-lift sm:-right-8">
        <p className="text-xs text-cream-100/70">Family balance</p>
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
