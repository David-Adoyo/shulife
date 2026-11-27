"use client";

import { useMemo, useState } from "react";
import { Ripple } from "./brand";
import { Icon } from "./icons";
import { Money } from "./ui";

/* Demo family (fictional). Amounts in whole shillings for display only. */
const children = [
  { name: "Amani", grade: "Grade 8 East", arrears: 6000, current: 22000, tint: "bg-navy-900", text: "text-navy-900" },
  { name: "Zawadi", grade: "Grade 5 West", arrears: 0, current: 18000, tint: "bg-gold-400", text: "text-gold-700" },
  { name: "Baraka", grade: "PP2 Sunflower", arrears: 2000, current: 12000, tint: "bg-navy-600", text: "text-navy-600" },
];
const PAYMENT = 45000;

const rules = [
  { id: "oldest", label: "Oldest balance first", hint: "Last term's balances first, then this term." },
  { id: "proportional", label: "Proportional", hint: "Shared in line with each child's balance." },
  { id: "eldest", label: "Eldest first", hint: "The eldest child is cleared first." },
  { id: "exact", label: "Exact number only", hint: "Paid with Amani's number; the rest becomes credit." },
] as const;
type RuleId = (typeof rules)[number]["id"];

function proportional(amount: number, weights: number[]) {
  const total = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map((w) => Math.floor((amount * w) / total));
  let rest = amount - raw.reduce((a, b) => a + b, 0);
  for (let i = 0; rest > 0; i = (i + 1) % raw.length, rest--) raw[i]++;
  return raw;
}

function allocate(rule: RuleId): { split: number[]; credit: number } {
  const owed = children.map((c) => c.arrears + c.current);
  if (rule === "proportional") return { split: proportional(PAYMENT, owed), credit: 0 };
  if (rule === "oldest") {
    const arrears = children.map((c) => c.arrears);
    const left = PAYMENT - arrears.reduce((a, b) => a + b, 0);
    const current = proportional(left, children.map((c) => c.current));
    return { split: arrears.map((a, i) => a + current[i]), credit: 0 };
  }
  if (rule === "eldest") {
    let left = PAYMENT;
    const split = owed.map((o) => {
      const take = Math.min(o, left);
      left -= take;
      return take;
    });
    return { split, credit: left };
  }
  const take = Math.min(owed[0], PAYMENT);
  return { split: [take, 0, 0], credit: PAYMENT - take };
}

export function SiblingDemo() {
  const [dropped, setDropped] = useState(false);
  const [over, setOver] = useState(false);
  const [rule, setRule] = useState<RuleId>("oldest");
  const { split, credit } = useMemo(() => allocate(rule), [rule]);

  const drop = () => {
    setDropped(true);
    setOver(false);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-10">
      {/* Payment + rules */}
      <div className="flex flex-col gap-6">
        <div className="rounded-2xl bg-navy-900 p-6 text-cream-50 sm:p-8">
          <p className="text-sm font-semibold text-gold-300">Incoming M-Pesa payment</p>
          <button
            type="button"
            draggable={!dropped}
            onDragStart={(e) => e.dataTransfer.setData("text/plain", "payment")}
            onClick={drop}
            disabled={dropped}
            aria-label="Send the KSh 45,000 payment to the Otieno family"
            className={`mt-4 flex w-full items-center gap-4 rounded-2xl border-2 border-dashed p-4 text-left transition ${
              dropped ? "border-cream-100/15 opacity-50" : "cursor-grab border-gold-400/70 bg-navy-800 hover:bg-navy-700 active:cursor-grabbing"
            }`}
          >
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-gold-400 text-navy-950">
              <Icon.Phone className="size-6" />
            </span>
            <span>
              <span className="block font-display text-3xl">
                <Money amount={PAYMENT} />
              </span>
              <span className="block text-sm text-cream-100/70">Ref: ADM 2041 · 0712 •••• 88</span>
            </span>
          </button>
          <p className="mt-3 text-sm text-cream-100/70">
            {dropped ? "Matched to the Otieno family by guardian phone." : "Drag it onto the family, or tap it."}
          </p>
        </div>

        <fieldset className="rounded-2xl bg-cream-100 p-6 sm:p-8">
          <legend className="sr-only">Sibling rule</legend>
          <p className="mb-4 text-sm font-semibold text-gold-700">The school's sibling rule</p>
          <div className="grid gap-2">
            {rules.map((r) => (
              <label
                key={r.id}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl p-3 transition ${
                  rule === r.id ? "bg-cream-50 ring-1 ring-navy-900/10" : "hover:bg-cream-50/60"
                }`}
              >
                <input type="radio" name="rule" value={r.id} checked={rule === r.id} onChange={() => setRule(r.id)} className="mt-1 size-4 accent-navy-900" />
                <span>
                  <span className="block font-semibold text-navy-900">{r.label}</span>
                  <span className="block text-sm text-ink-600">{r.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {/* Family card */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          drop();
        }}
        className={`relative rounded-2xl bg-cream-50 p-6 ring-1 transition sm:p-8 ${over ? "ring-4 ring-gold-400" : "ring-navy-900/10"}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink-400">Family · FAM-2041</p>
            <p className="font-display text-2xl text-navy-900">The Otieno family</p>
          </div>
          <div className="relative inline-flex size-11 items-center justify-center rounded-full bg-navy-50 text-navy-900">
            {dropped && <Ripple className="rounded-full" key={rule} />}
            <Icon.Users className="size-5" />
          </div>
        </div>

        <ul className="mt-6 divide-y divide-navy-900/8">
          {children.map((c, i) => {
            const owed = c.arrears + c.current;
            const paid = dropped ? split[i] : 0;
            const left = owed - paid;
            return (
              <li key={c.name} className="flex items-center gap-4 py-4">
                <span className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full font-display text-lg text-cream-50 ${c.tint}`}>{c.name[0]}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-navy-900">{c.name}</p>
                  <p className="text-sm text-ink-600">{c.grade}</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-navy-100">
                    <div className={`h-full rounded-full ${c.tint} transition-[width] duration-700 ease-out`} style={{ width: `${(paid / owed) * 100}%` }} />
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold transition-opacity ${dropped && paid ? "opacity-100" : "opacity-0"} text-paid`}>
                    + <Money amount={paid} />
                  </p>
                  <p className="text-sm text-ink-600">
                    Balance <Money amount={left} className="font-semibold text-navy-900" />
                  </p>
                  <StatusPill left={left} owed={owed} />
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 rounded-2xl bg-cream-100 p-4">
          <p className="mb-3 text-sm font-semibold text-ink-400">Split bar</p>
          <div className="flex h-4 overflow-hidden rounded-full bg-navy-100">
            {children.map((c, i) => (
              <span key={c.name} className={`${c.tint} transition-[width] duration-700 ease-out`} style={{ width: dropped ? `${(split[i] / PAYMENT) * 100}%` : "0%" }} />
            ))}
            <span className="bg-paid transition-[width] duration-700 ease-out" style={{ width: dropped ? `${(credit / PAYMENT) * 100}%` : "0%" }} />
          </div>
          <p className="mt-3 text-sm text-ink-600" aria-live="polite">
            {dropped ? (
              <>
                <b className="text-navy-900">KSh 45,000 received:</b>{" "}
                {children
                  .map((c, i) => (split[i] ? `${c.name} KSh ${split[i].toLocaleString("en-KE")}` : null))
                  .filter(Boolean)
                  .join(", ")}
                {credit ? `, family credit KSh ${credit.toLocaleString("en-KE")}` : ""}. The parent gets this split by WhatsApp, with a link to request a change.
              </>
            ) : (
              "Waiting for a payment…"
            )}
          </p>
        </div>

        {dropped && (
          <button type="button" onClick={() => setDropped(false)} className="mt-4 text-sm font-semibold text-navy-900 underline decoration-gold-500 decoration-2 underline-offset-4">
            Reset the demo
          </button>
        )}
      </div>
    </div>
  );
}

function StatusPill({ left, owed }: { left: number; owed: number }) {
  const s =
    left === 0
      ? { label: "Paid", cls: "bg-paid/10 text-paid" }
      : left < owed
        ? { label: "Partly paid", cls: "bg-partial/10 text-partial" }
        : { label: "Balance due", cls: "bg-due/10 text-due" };
  return (
    <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ${s.cls}`}>
      {left === 0 ? <Icon.Check className="size-3" strokeWidth={2.6} /> : <Icon.Clock className="size-3" strokeWidth={2.2} />}
      {s.label}
    </span>
  );
}
