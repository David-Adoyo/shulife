"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const path = usePathname() ?? "";
  const active = href === "/app/" ? path === "/app" || path === "/app/" : path.startsWith(href.replace(/\/$/, ""));
  return (
    <a
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${active ? "bg-cream-50 text-navy-900" : "text-cream-100/80 hover:bg-cream-50/10 hover:text-cream-50"}`}
    >
      {children}
    </a>
  );
}
