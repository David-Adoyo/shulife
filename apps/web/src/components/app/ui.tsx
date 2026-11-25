import type { ReactNode } from "react";
import { formatKes } from "@shulife/core";
import { Icon } from "../icons";

/* Signature UI pieces for the school app (§8.6). */

export function KSh({ cents, className = "", strong = true }: { cents: number; className?: string; strong?: boolean }) {
  const whole = Math.round(cents / 100) * 100;
  const text = formatKes(whole, { prefix: false });
  return (
    <span className={`tabular whitespace-nowrap ${className}`}>
      <span className="mr-1 text-[0.72em] font-medium text-ink-600">KSh</span>
      <span className={strong ? "font-semibold" : ""}>{text}</span>
    </span>
  );
}

export function Card({ children, className = "", title, action }: { children: ReactNode; className?: string; title?: string; action?: ReactNode }) {
  return (
    <section className={`min-w-0 rounded-[14px] border border-cream-200 bg-white p-5 shadow-soft sm:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-semibold text-navy-900">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({ label, value, hint, tone = "light" }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "light" | "navy" }) {
  return (
    <div className={`rounded-[14px] p-5 ${tone === "navy" ? "bg-navy-900 text-cream-50" : "border border-cream-200 bg-white shadow-soft"}`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${tone === "navy" ? "text-gold-300" : "text-ink-600"}`}>{label}</p>
      <p className={`mt-2 font-display text-[1.9rem] leading-none ${tone === "navy" ? "" : "text-navy-900"}`}>{value}</p>
      {hint && <p className={`mt-2 text-sm ${tone === "navy" ? "text-cream-100/70" : "text-ink-600"}`}>{hint}</p>}
    </div>
  );
}

const pills = {
  paid: { cls: "bg-paid/10 text-paid", icon: Icon.Check, label: "Paid" },
  cleared: { cls: "bg-paid/10 text-paid", icon: Icon.Check, label: "Cleared" },
  partial: { cls: "bg-partial/12 text-partial", icon: Icon.Clock, label: "Partly paid" },
  on_plan: { cls: "bg-partial/12 text-partial", icon: Icon.Calendar, label: "On plan" },
  due: { cls: "bg-due/10 text-due", icon: Icon.Clock, label: "Balance due" },
  not_cleared: { cls: "bg-due/10 text-due", icon: Icon.Clock, label: "Not cleared" },
  overridden: { cls: "bg-navy-100 text-navy-700", icon: Icon.Shield, label: "Overridden" },
  credit: { cls: "bg-paid/10 text-paid", icon: Icon.Sparkle, label: "In credit" },
} as const;
export type PillKind = keyof typeof pills;

/** Status pills always carry an icon and a label — never colour alone (§8.2). */
export function Pill({ kind, label }: { kind: PillKind; label?: string }) {
  const p = pills[kind];
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${p.cls}`}>
      <p.icon className="size-3.5" strokeWidth={2.2} />
      {label ?? p.label}
    </span>
  );
}

export function balancePill(balance: number, billed: number): PillKind {
  if (balance < 0) return "credit";
  if (balance === 0) return "paid";
  return balance < billed ? "partial" : "due";
}

export function MatchBadge({ kind }: { kind: string }) {
  const cls = kind === "Auto" ? "bg-paid/10 text-paid" : kind === "Guardian phone" || kind === "Learned" ? "bg-navy-100 text-navy-700" : kind === "Reviewed" || kind === "Manual" ? "bg-gold-200/60 text-gold-700" : "bg-cream-100 text-ink-600";
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ${cls}`}>{kind}</span>;
}

/** Term Collection Ring: coral arc on a navy-100 track in the masterplan; gold here to match the brand. */
export function CollectionRing({ pct, size = 180, children }: { pct: number; size?: number; children?: ReactNode }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" role="img" aria-label={`${pct}% collected`}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-navy-100)" strokeWidth="9" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-gold-500)" strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(100, pct) / 100)} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

const TINTS = ["bg-navy-900", "bg-gold-400", "bg-navy-600", "bg-gold-600", "bg-navy-400"];
export function SplitBar({ parts, credit = 0 }: { parts: { name: string; amount: number }[]; credit?: number }) {
  const total = parts.reduce((s, p) => s + p.amount, 0) + credit;
  if (!total) return null;
  return (
    <div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-navy-100">
        {parts.map((p, i) => (
          <span key={p.name + i} className={TINTS[i % TINTS.length]} style={{ width: `${(p.amount / total) * 100}%` }} />
        ))}
        {credit > 0 && <span className="bg-paid" style={{ width: `${(credit / total) * 100}%` }} />}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-600">
        {parts.map((p, i) => (
          <span key={p.name + i} className="inline-flex items-center gap-1">
            <span className={`size-2 rounded-full ${TINTS[i % TINTS.length]}`} />
            {p.name} <KSh cents={p.amount} strong={false} />
          </span>
        ))}
        {credit > 0 && (
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-paid" /> Credit <KSh cents={credit} strong={false} />
          </span>
        )}
      </div>
    </div>
  );
}

export function PageTitle({ title, sub, action }: { title: string; sub?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl text-navy-900 sm:text-4xl">{title}</h1>
        {sub && <p className="mt-1 text-ink-600">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Empty({ title, body, icon: I = Icon.Sparkle }: { title: string; body: string; icon?: (p: React.SVGProps<SVGSVGElement>) => React.JSX.Element }) {
  return (
    <div className="flex flex-col items-center rounded-[14px] border border-dashed border-cream-300 bg-cream-50 px-6 py-12 text-center">
      <span className="inline-flex size-14 items-center justify-center rounded-full bg-gold-200 text-navy-900">
        <I className="size-7" />
      </span>
      <p className="mt-4 font-display text-2xl text-navy-900">{title}</p>
      <p className="mt-1 max-w-sm text-ink-600">{body}</p>
    </div>
  );
}

export const heatClass = (pct: number) => (pct >= 100 ? "bg-paid text-white" : pct >= 85 ? "bg-paid/75 text-white" : pct >= 70 ? "bg-partial/55 text-navy-950" : pct >= 55 ? "bg-partial/30 text-navy-950" : "bg-due/70 text-white");
