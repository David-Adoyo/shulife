/**
 * Money is sacred (§0.1 rule 6). All amounts are integer cents. Never floats.
 * KES has 100 cents to the shilling; the UI shows `KSh 25,000`.
 */
export type Cents = number;

export function assertCents(v: number, label = "amount"): Cents {
  if (!Number.isSafeInteger(v)) throw new Error(`${label} must be an integer number of cents, got ${v}`);
  return v;
}

/** Whole shillings (or a decimal string like "1500.50") to cents, exactly. */
export function kes(shillings: number | string): Cents {
  const s = typeof shillings === "number" ? shillings.toString() : shillings.trim().replace(/,/g, "");
  if (!/^-?\d+(\.\d{1,2})?$/.test(s)) throw new Error(`Not a KES amount: ${shillings}`);
  const neg = s.startsWith("-");
  const [whole, frac = ""] = s.replace("-", "").split(".");
  const cents = Number(whole) * 100 + Number((frac + "00").slice(0, 2));
  return assertCents(neg ? -cents : cents);
}

/** `KSh 25,000` or `KSh 1,250.50`. */
export function formatKes(cents: Cents, opts: { prefix?: boolean } = {}): string {
  assertCents(cents);
  const neg = cents < 0;
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const frac = abs % 100;
  const body = whole.toLocaleString("en-KE") + (frac ? "." + String(frac).padStart(2, "0") : "");
  return `${neg ? "−" : ""}${opts.prefix === false ? "" : "KSh "}${body}`;
}

/** Short form for dashboards: `5.1m`, `750k`. */
export function formatKesShort(cents: Cents): string {
  const shillings = cents / 100;
  if (Math.abs(shillings) >= 1_000_000) return `${+(shillings / 1_000_000).toFixed(1)}m`;
  if (Math.abs(shillings) >= 1_000) return `${Math.round(shillings / 1_000)}k`;
  return `${Math.round(shillings)}`;
}

export function sum(values: Cents[]): Cents {
  return values.reduce((a, b) => assertCents(a + b), 0);
}

/**
 * Split `total` across weights with the largest-remainder method, so the parts
 * always add up to the total exactly. Ties go to the earlier index.
 */
export function splitProportional(total: Cents, weights: number[], unit: Cents = 1): Cents[] {
  assertCents(total);
  if (unit > 1) {
    if (total % unit !== 0) throw new Error("Total is not a whole number of units");
    return splitProportional(total / unit, weights).map((x) => x * unit);
  }
  const w = weights.map((x) => Math.max(0, x));
  const wSum = w.reduce((a, b) => a + b, 0);
  if (wSum === 0 || total === 0) return w.map(() => 0);
  const raw = w.map((x) => (total * x) / wSum);
  const floors = raw.map(Math.floor);
  let rest = total - floors.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => ({ i, frac: r - Math.floor(r) })).sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (let k = 0; rest > 0; k = (k + 1) % order.length, rest--) floors[order[k].i]++;
  return floors;
}

/** Percentage of an amount, rounded half-up to the cent. `pct` may have decimals (e.g. 12.5). */
export function percentOf(cents: Cents, pct: number): Cents {
  return Math.round((cents * Math.round(pct * 100)) / 10000);
}

/** Round to the nearest `step` cents (e.g. 5000 = KSh 50). */
export function roundTo(cents: Cents, step: Cents): Cents {
  return Math.round(cents / step) * step;
}
