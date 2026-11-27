"use client";

import { useState } from "react";
import { site } from "@/lib/site";
import { Money } from "./ui";

function Slider({ label, value, min, max, step, onChange, format }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; format: (v: number) => string }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-4">
        <span className="font-semibold text-navy-900">{label}</span>
        <span className="tabular font-display text-2xl text-navy-900">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full accent-navy-900"
        style={{ background: `linear-gradient(to right, var(--color-navy-900) ${pct}%, var(--color-cream-200) ${pct}%)` }}
      />
    </label>
  );
}

export function Calculator() {
  const [learners, setLearners] = useState(450);
  const [fee, setFee] = useState(35000);
  const [late, setLate] = useState(40);

  const outstanding = learners * fee * (late / 100);
  const weekly = outstanding / 13; // a 13-week term
  const cost = site.pricePerLearnerTerm != null ? learners * site.pricePerLearnerTerm : null;

  return (
    <div className="grid overflow-hidden rounded-2xl bg-cream-50 ring-1 ring-navy-900/10 lg:grid-cols-[1.1fr_1fr]">
      <div className="space-y-8 p-7 sm:p-10">
        <Slider label="Learners" value={learners} min={100} max={1500} step={10} onChange={setLearners} format={(v) => v.toLocaleString("en-KE")} />
        <Slider label="Average fees per term" value={fee} min={10000} max={200000} step={1000} onChange={setFee} format={(v) => `KSh ${v.toLocaleString("en-KE")}`} />
        <Slider label="Families paying late" value={late} min={5} max={80} step={1} onChange={setLate} format={(v) => `${v}%`} />
        <p className="text-sm text-ink-600">Rough estimates. Your own M-Pesa statement will tell you more.</p>
      </div>
      <div className="relative flex flex-col justify-center gap-7 bg-navy-900 p-7 text-cream-50 sm:p-10" aria-live="polite">
        <div>
          <p className="text-sm text-cream-100/70">Unpaid at the start of term</p>
          <p className="mt-1 font-display text-5xl text-gold-300">
            <Money amount={outstanding} />
          </p>
        </div>
        <div>
          <p className="text-sm text-cream-100/70">Spread over a 13-week term, per week</p>
          <p className="mt-1 font-display text-3xl">
            <Money amount={weekly} />
          </p>
        </div>
        <div className="border-t border-cream-50/10 pt-6">
          <p className="text-sm text-cream-100/70">Shulife per term</p>
          {cost != null ? (
            <p className="mt-1 font-display text-3xl">
              <Money amount={cost} />
            </p>
          ) : (
            <p className="mt-1 text-lg text-cream-100/90">Priced per learner per term. Nothing to pay until your first payment has been matched automatically.</p>
          )}
        </div>
      </div>
    </div>
  );
}
