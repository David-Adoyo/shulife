"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "./icons";
import { Button } from "./ui";

type Tab = { id: string; label: string; title: string; body: string; points: string[]; chat: ReactNode };

const Bubble = ({ from, children, time }: { from: "me" | "them"; children: ReactNode; time: string }) => (
  <div className={`flex ${from === "me" ? "justify-end" : "justify-start"}`}>
    <div
      className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 text-[0.82rem] leading-snug shadow-sm ${
        from === "me" ? "rounded-br-md bg-[#d9fdd3] text-ink-900" : "rounded-bl-md bg-white text-ink-900"
      }`}
    >
      {children}
      <span className="mt-1 block text-right text-[0.62rem] text-ink-400">{time}</span>
    </div>
  </div>
);

const tabs: Tab[] = [
  {
    id: "receipts",
    label: "Receipts",
    title: "“But I paid!” — never again.",
    body: "Every payment gets an instant, numbered receipt by WhatsApp or SMS, with a PDF and a QR code anyone can verify. Parents always have proof.",
    points: ["Sent within seconds of payment", "Itemised by child and fee item", "QR-verifiable for employers and sponsors"],
    chat: (
      <>
        <Bubble from="them" time="08:14">
          <b>Mlima Academy</b> 🧾
          <br />
          Receipt RCT-RUI-2027-000456
          <br />
          We have received <b>KSh 45,000</b>. Thank you!
          <br />• Amani: KSh 21,000
          <br />• Zawadi: KSh 13,500
          <br />• Baraka: KSh 10,500
          <br />
          <span className="text-navy-700 underline">View receipt (PDF)</span>
        </Bubble>
        <Bubble from="me" time="08:15">
          Asante sana 🙏
        </Bubble>
      </>
    ),
  },
  {
    id: "balance",
    label: "Balance on WhatsApp",
    title: "Balance? Just send SALIO.",
    body: "Parents send BALANCE or SALIO and get every child's balance with a one-tap pay link. Only registered numbers get an answer, so family details stay private.",
    points: ["English or Kiswahili, the parent's choice", "Works on any phone, no app needed", "Fewer calls to the front office"],
    chat: (
      <>
        <Bubble from="me" time="19:02">
          SALIO
        </Bubble>
        <Bubble from="them" time="19:02">
          Habari Bi. Otieno 👋
          <br />
          Salio la familia, Muhula 1 2027:
          <br />• Amani: KSh 7,000
          <br />• Zawadi: KSh 4,500
          <br />• Baraka: KSh 3,500
          <br />
          <b>Jumla: KSh 15,000</b>
          <br />
          <span className="text-navy-700 underline">Lipa sasa kwa M-Pesa</span>
        </Bubble>
      </>
    ),
  },
  {
    id: "notices",
    label: "Notices",
    title: "The right notice, to exactly the right parents.",
    body: "Send to Grade 4 East, a bus route or the boarders in seconds — with read receipts. Trip consent and payment come together in one link.",
    points: ["Audience chips: class, route, boarders", "Delivered and read, per notice", "Unread? Resend by SMS in one tap"],
    chat: (
      <>
        <Bubble from="them" time="10:30">
          📣 <b>Grade 4 East · Science trip</b>
          <br />
          Our class visits the Nairobi National Museum on Friday 12 Feb. Please give consent and pay the trip fee by Monday.
          <br />
          <span className="text-navy-700 underline">Give consent and pay</span>
        </Bubble>
        <Bubble from="me" time="10:41">
          Done ✅ Thank you, teacher!
        </Bubble>
      </>
    ),
  },
];

export function ConnectTabs() {
  const [active, setActive] = useState(tabs[0].id);
  const t = tabs.find((x) => x.id === active)!;

  return (
    <div>
      <div role="tablist" aria-label="Parent features" className="no-scrollbar -mx-5 mb-12 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:px-0">
        {tabs.map((x) => (
          <button
            key={x.id}
            role="tab"
            aria-selected={x.id === active}
            onClick={() => setActive(x.id)}
            className={`h-12 shrink-0 rounded-full px-6 font-semibold transition ${
              x.id === active ? "bg-gold-400 text-navy-950" : "bg-navy-800 text-cream-100 hover:bg-navy-700"
            }`}
          >
            {x.label}
          </button>
        ))}
      </div>

      <div key={t.id} role="tabpanel" className="grid items-center gap-12 lg:grid-cols-2 animate-[fadeUp_.5s_ease-out]">
        <div>
          <h3 className="font-display text-4xl leading-tight text-cream-50 sm:text-5xl">{t.title}</h3>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-cream-100/80">{t.body}</p>
          <ul className="mt-8 space-y-3">
            {t.points.map((p) => (
              <li key={p} className="flex items-center gap-3 text-cream-50">
                <span className="inline-flex size-6 items-center justify-center rounded-full bg-gold-400/15 text-gold-300">
                  <Icon.Check className="size-4" strokeWidth={2.2} />
                </span>
                {p}
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <Button href="#faq" variant="outline-cream" arrow>
              Parent help
            </Button>
          </div>
        </div>

        <div className="relative mx-auto">
          <div aria-hidden className="absolute -inset-10 rounded-full bg-gold-400/10 blur-3xl" />
          <div className="relative w-[290px] rounded-[2.6rem] bg-navy-950 p-3 shadow-lift ring-1 ring-cream-50/10 sm:w-[320px]">
            <div className="overflow-hidden rounded-[2rem] bg-[#efe7dc]">
              <div className="flex items-center gap-3 bg-[#0f5b4f] px-4 pb-3 pt-6 text-white">
                <span className="inline-flex size-9 items-center justify-center rounded-full bg-cream-50 font-display text-navy-900">M</span>
                <div>
                  <p className="text-sm font-semibold">Mlima Academy</p>
                  <p className="text-[0.7rem] opacity-80">Business account</p>
                </div>
              </div>
              <div className="flex min-h-[380px] flex-col justify-end gap-3 p-3">{t.chat}</div>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-10 text-xs text-cream-100/50">Example messages from a fictional demo school.</p>
    </div>
  );
}
