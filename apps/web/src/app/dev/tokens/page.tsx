import type { Metadata } from "next";
import { Wordmark, Mark } from "@/components/brand";
import { Pill } from "@/components/app/ui";

export const metadata: Metadata = { title: "Design tokens", robots: { index: false } };

const COLOURS = [
  ["navy-950", "#090f24"], ["navy-900", "#14204a"], ["navy-700", "#26386f"], ["navy-100", "#e3e8f4"],
  ["cream-50", "#fdf9f1"], ["cream-100", "#f8f0e0"], ["cream-200", "#eee2c9"],
  ["gold-300", "#ebcb87"], ["gold-400", "#dfb460"], ["gold-500", "#c99a3b"], ["gold-700", "#845f15"],
  ["coral-500", "#ff6a45"], ["ink-900", "#121a30"], ["ink-600", "#535d74"],
  ["paid", "#2e7d5b"], ["partial", "#b9801a"], ["due", "#8e3b5e"],
] as const;

function lum(hex: string) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const contrast = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

export default function Tokens() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center gap-6"><Wordmark size="lg" /><Mark className="h-12 w-auto" /></div>
      <h1 className="mt-8 font-display text-5xl text-navy-900">Design tokens</h1>
      <h2 className="mt-10 font-semibold text-navy-900">Colours, with contrast against cream and navy (WCAG AA needs 4.5 for body text)</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {COLOURS.map(([n, hex]) => (
          <div key={n} className="overflow-hidden rounded-xl border border-cream-200 bg-white">
            <div className="h-16" style={{ background: hex }} />
            <div className="p-3 text-xs">
              <p className="font-semibold text-navy-900">{n}</p>
              <p className="font-mono text-ink-600">{hex}</p>
              <p className="text-ink-600">on cream {contrast(hex, "#fdf9f1").toFixed(1)} · on navy {contrast(hex, "#14204a").toFixed(1)}</p>
            </div>
          </div>
        ))}
      </div>
      <h2 className="mt-10 font-semibold text-navy-900">Type</h2>
      <p className="mt-3 font-display text-6xl text-navy-900">Fraunces display</p>
      <p className="text-lg text-ink-600">Plus Jakarta Sans for interface and body text, with tabular figures: <span className="tabular">KSh 1,234,567</span></p>
      <h2 className="mt-10 font-semibold text-navy-900">Status pills</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {(["paid", "partial", "due", "cleared", "on_plan", "not_cleared", "overridden", "credit"] as const).map((k) => <Pill key={k} kind={k} />)}
      </div>
    </main>
  );
}
