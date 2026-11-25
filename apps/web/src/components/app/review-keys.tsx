"use client";

import { useEffect } from "react";

/** Keyboard shortcuts for the Match Card (§8.6): 1/2/3 assign, N not ours, F find, S skip. */
export function ReviewKeys({ count }: { count: number }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || e.metaKey || e.ctrlKey) return;
      const k = e.key.toLowerCase();
      if (/^[1-3]$/.test(k) && Number(k) <= count) document.querySelector<HTMLButtonElement>(`button[data-key="${k}"]`)?.click();
      if (k === "n") document.querySelector<HTMLButtonElement>('button[data-key="n"]')?.click();
      if (k === "f") document.querySelector<HTMLAnchorElement>('a[href*="/app/families/?q="]')?.click();
      if (k === "s") window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count]);
  return <p className="mb-3 text-xs text-ink-600">Shortcuts: 1, 2, 3 to assign · N not ours · F find another family</p>;
}
