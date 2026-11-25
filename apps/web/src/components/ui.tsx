import type { ReactNode } from "react";
import { Icon } from "./icons";

type BtnProps = {
  href: string;
  children: ReactNode;
  variant?: "gold" | "navy" | "outline" | "outline-cream" | "link";
  className?: string;
  arrow?: boolean;
};

const variants = {
  gold: "bg-gold-400 text-navy-950 hover:bg-gold-300 shadow-[0_8px_24px_-8px_rgb(201_154_59/0.7)]",
  navy: "bg-navy-900 text-cream-50 hover:bg-navy-800",
  outline: "border-2 border-navy-900 text-navy-900 hover:bg-navy-900 hover:text-cream-50",
  "outline-cream": "border-2 border-cream-100/70 text-cream-50 hover:bg-cream-50 hover:text-navy-900",
  link: "text-navy-900 underline decoration-gold-500 decoration-2 underline-offset-[6px] hover:decoration-navy-900 !px-0",
};

export function Button({ href, children, variant = "gold", className = "", arrow }: BtnProps) {
  return (
    <a
      href={href}
      className={`group inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-7 text-[0.975rem] font-semibold transition duration-200 ${variants[variant]} ${className}`}
    >
      {children}
      {arrow && <Icon.Arrow className="size-[18px] transition-transform duration-200 group-hover:translate-x-1" />}
    </a>
  );
}

export function Eyebrow({ children, tone = "gold" }: { children: ReactNode; tone?: "gold" | "cream" }) {
  return (
    <p
      className={`mb-4 inline-flex items-center gap-2 text-[0.8rem] font-bold uppercase tracking-[0.18em] ${
        tone === "gold" ? "text-gold-700" : "text-gold-300"
      }`}
    >
      <span className="h-px w-6 bg-current" aria-hidden />
      {children}
    </p>
  );
}

export function Money({ amount, className = "" }: { amount: number; className?: string }) {
  return (
    <span className={`tabular whitespace-nowrap ${className}`}>
      <span className="mr-1 text-[0.7em] font-medium opacity-60">KSh</span>
      {Math.round(amount).toLocaleString("en-KE")}
    </span>
  );
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1240px] px-5 sm:px-8 lg:px-12 ${className}`}>{children}</div>;
}
