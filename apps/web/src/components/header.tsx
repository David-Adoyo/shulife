"use client";

import { useEffect, useRef, useState } from "react";
import { Wordmark } from "./brand";
import { Icon } from "./icons";

type Link = { label: string; href: string; note?: string };
type Menu = { id: string; label: string; heading: string; intro: string; columns: { title: string; links: Link[] }[]; footer: Link[] };

const menus: Menu[] = [
  {
    id: "schools",
    label: "Schools",
    heading: "Shulife for schools",
    intro: "Fees collected, matched and receipted, so your team can get back to running a great school.",
    columns: [
      {
        title: "Collect fees",
        links: [
          { label: "Automatic M-Pesa matching", href: "/for-bursars/#matching", note: "Including wrong account numbers" },
          { label: "Sibling splits", href: "/for-bursars/#siblings", note: "One payment, several children" },
          { label: "Instant receipts", href: "/features/#collection", note: "Numbered, QR-verifiable" },
          { label: "Bank, cash and cheque", href: "/for-bursars/#cash" },
        ],
      },
      {
        title: "Run the term",
        links: [
          { label: "Fee structures and invoices", href: "/features/#billing" },
          { label: "Payment plans and Ratiba", href: "/features/#parents" },
          { label: "Kinder clearance", href: "/for-directors/#clearance" },
          { label: "Director's dashboard", href: "/for-directors/" },
        ],
      },
      {
        title: "Who it's for",
        links: [
          { label: "Directors and owners", href: "/for-directors/" },
          { label: "Bursars and accounts", href: "/for-bursars/" },
          { label: "Front office and teachers", href: "/features/#staff" },
        ],
      },
    ],
    footer: [
      { label: "How it works", href: "/how-it-works/" },
      { label: "All features", href: "/features/" },
      { label: "Security", href: "/security/" },
    ],
  },
  {
    id: "parents",
    label: "Parents",
    heading: "Shulife for parents",
    intro: "No app, no password. Pay with M-Pesa, get a receipt in seconds and check your balance on WhatsApp.",
    columns: [
      {
        title: "Pay and track",
        links: [
          { label: "How to pay school fees", href: "/for-parents/#pay", note: "Paybill + admission number" },
          { label: "Check your balance", href: "/for-parents/#whatsapp", note: "Send BALANCE or SALIO" },
          { label: "Read your statement", href: "/for-parents/#statement" },
        ],
      },
      {
        title: "Stay in the loop",
        links: [
          { label: "Payment plans", href: "/for-parents/#plans" },
          { label: "Auto-pay with Ratiba", href: "/for-parents/#plans" },
          { label: "Your privacy", href: "/for-parents/#privacy" },
        ],
      },
      {
        title: "Msaada kwa Kiswahili",
        links: [
          { label: "Jinsi ya kulipa karo", href: "/for-parents/?lang=sw#pay" },
          { label: "Angalia salio lako", href: "/for-parents/?lang=sw#whatsapp" },
        ],
      },
    ],
    footer: [
      { label: "Parent help", href: "/for-parents/" },
      { label: "Questions", href: "/help/#parents" },
    ],
  },
];

const simpleLinks: Link[] = [
  { label: "Pricing", href: "/pricing/" },
  { label: "Resources", href: "/resources/" },
  { label: "Help", href: "/help/" },
];

export function Header() {
  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(null);
        setMobile(false);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobile ? "hidden" : "";
  }, [mobile]);

  const enter = (id: string) => {
    window.clearTimeout(closeTimer.current);
    setOpen(id);
  };
  const leave = () => {
    closeTimer.current = window.setTimeout(() => setOpen(null), 140);
  };

  const active = menus.find((m) => m.id === open);

  return (
    <header
      className={`sticky top-0 z-50 transition-[background,box-shadow] duration-300 ${
        scrolled || open ? "bg-cream-50/95 shadow-[0_1px_0_rgb(20_32_74/0.08)] backdrop-blur-md" : "bg-cream-50"
      }`}
      onMouseLeave={leave}
    >
      <div className="mx-auto flex h-[72px] w-full max-w-[1240px] items-center gap-8 px-5 sm:px-8 lg:px-12">
        <a href="/" className="shrink-0" aria-label="Shulife home">
          <Wordmark size="md" className="max-sm:h-6" />
        </a>

        <nav aria-label="Main" className="hidden flex-1 items-center gap-1 lg:flex">
          {menus.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-expanded={open === m.id}
              aria-controls={`menu-${m.id}`}
              onMouseEnter={() => enter(m.id)}
              onClick={() => setOpen(open === m.id ? null : m.id)}
              className={`inline-flex h-11 items-center gap-1 rounded-full px-4 text-[0.95rem] font-semibold transition-colors ${
                open === m.id ? "bg-navy-900 text-cream-50" : "text-navy-900 hover:bg-navy-50"
              }`}
            >
              {m.label}
              <Icon.Chevron className={`size-4 transition-transform ${open === m.id ? "rotate-180" : ""}`} />
            </button>
          ))}
          {simpleLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onMouseEnter={() => setOpen(null)}
              className="inline-flex h-11 items-center rounded-full px-4 text-[0.95rem] font-semibold text-navy-900 transition-colors hover:bg-navy-50"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          <a
            href="/login/"
            className="inline-flex h-11 items-center rounded-full border-2 border-navy-900 px-5 text-[0.95rem] font-semibold text-navy-900 transition hover:bg-navy-900 hover:text-cream-50"
          >
            Log in
          </a>
          <a
            href="/book-demo/"
            className="inline-flex h-11 items-center rounded-full bg-navy-900 px-5 text-[0.95rem] font-semibold text-cream-50 transition hover:bg-navy-700"
          >
            Book a demo
          </a>
        </div>

        <button
          type="button"
          className="ml-auto inline-flex size-11 items-center justify-center rounded-full text-navy-900 hover:bg-navy-50 lg:hidden"
          aria-label={mobile ? "Close menu" : "Open menu"}
          aria-expanded={mobile}
          onClick={() => setMobile(!mobile)}
        >
          {mobile ? <Icon.Close className="size-6" /> : <Icon.Menu className="size-6" />}
        </button>
      </div>

      {/* Desktop mega menu */}
      {active && (
        <div
          id={`menu-${active.id}`}
          className="absolute inset-x-0 top-full hidden border-t border-navy-900/5 bg-cream-50 shadow-[0_30px_60px_-20px_rgb(9_15_36/0.25)] lg:block"
          onMouseEnter={() => enter(active.id)}
        >
          <div className="mx-auto grid max-w-[1240px] grid-cols-[1.1fr_2.4fr] gap-12 px-12 py-10">
            <div className="rounded-3xl bg-navy-900 p-8 text-cream-50">
              <p className="font-display text-3xl">{active.heading}</p>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-cream-100/80">{active.intro}</p>
              <div className="mt-6 flex flex-col gap-2">
                {active.footer.map((l) => (
                  <a key={l.label} href={l.href} onClick={() => setOpen(null)} className="group inline-flex items-center gap-2 font-semibold text-gold-300 hover:text-gold-200">
                    {l.label}
                    <Icon.Arrow className="size-4 transition-transform group-hover:translate-x-1" />
                  </a>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-8">
              {active.columns.map((c) => (
                <div key={c.title}>
                  <p className="mb-4 text-sm font-semibold text-gold-700">{c.title}</p>
                  <ul className="space-y-1">
                    {c.links.map((l) => (
                      <li key={l.label}>
                        <a href={l.href} onClick={() => setOpen(null)} className="block rounded-xl px-3 py-2.5 -mx-3 transition-colors hover:bg-cream-100">
                          <span className="block font-semibold text-navy-900">{l.label}</span>
                          {l.note && <span className="block text-sm text-ink-600">{l.note}</span>}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {mobile && (
        <div className="fixed inset-x-0 bottom-0 top-[72px] overflow-y-auto bg-cream-50 px-5 pb-10 pt-2 sm:px-8 lg:hidden">
          {menus.map((m) => (
            <details key={m.id} className="group border-b border-navy-900/10">
              <summary className="flex h-16 cursor-pointer list-none items-center justify-between text-lg font-semibold text-navy-900">
                {m.label}
                <Icon.Chevron className="size-5 transition-transform group-open:rotate-180" />
              </summary>
              <div className="space-y-6 pb-6">
                {m.columns.map((c) => (
                  <div key={c.title}>
                    <p className="mb-2 text-sm font-semibold text-gold-700">{c.title}</p>
                    {c.links.map((l) => (
                      <a key={l.label} href={l.href} onClick={() => setMobile(false)} className="block py-2 text-navy-900">
                        {l.label}
                      </a>
                    ))}
                  </div>
                ))}
              </div>
            </details>
          ))}
          {simpleLinks.map((l) => (
            <a key={l.label} href={l.href} onClick={() => setMobile(false)} className="flex h-16 items-center border-b border-navy-900/10 text-lg font-semibold text-navy-900">
              {l.label}
            </a>
          ))}
          <div className="mt-8 grid gap-3">
            <a href="/book-demo/" onClick={() => setMobile(false)} className="inline-flex h-12 items-center justify-center rounded-full bg-navy-900 font-semibold text-cream-50">
              Book a demo
            </a>
            <a href="/login/" onClick={() => setMobile(false)} className="inline-flex h-12 items-center justify-center rounded-full border-2 border-navy-900 font-semibold text-navy-900">
              Log in
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
