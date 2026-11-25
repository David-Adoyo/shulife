/**
 * Africa/Nairobi is UTC+3 all year (no daylight saving). All instants are stored
 * in UTC; these helpers convert to and from Nairobi wall-clock time.
 */
export const NAIROBI_OFFSET_MIN = 180;
const OFFSET_MS = NAIROBI_OFFSET_MIN * 60_000;

export type LocalParts = { y: number; m: number; d: number; hh: number; mm: number; dow: number };

export function toNairobi(instant: Date): LocalParts {
  const t = new Date(instant.getTime() + OFFSET_MS);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), hh: t.getUTCHours(), mm: t.getUTCMinutes(), dow: t.getUTCDay() };
}

/** A Nairobi wall-clock time → UTC instant. */
export function fromNairobi(y: number, m: number, d: number, hh = 0, mm = 0): Date {
  return new Date(Date.UTC(y, m - 1, d, hh, mm) - OFFSET_MS);
}

/** `2027-01-12` (a calendar date in Nairobi) → that day's midnight in Nairobi. */
export function nairobiDate(iso: string, hh = 0, mm = 0): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return fromNairobi(y, m, d, hh, mm);
}

export function isoDateNairobi(instant: Date): string {
  const p = toNairobi(instant);
  return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}

export function addDays(instant: Date, days: number): Date {
  return new Date(instant.getTime() + days * 86_400_000);
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** UI date style (§0.1 rule 5): `24 Nov 2026`. */
export function formatDate(instant: Date): string {
  const p = toNairobi(instant);
  return `${p.d} ${MONTHS[p.m - 1]} ${p.y}`;
}

export function formatTime(instant: Date): string {
  const p = toNairobi(instant);
  return `${String(p.hh).padStart(2, "0")}:${String(p.mm).padStart(2, "0")}`;
}

/** ISO week key in Nairobi time, e.g. `2027-W02`, used for weekly message caps. */
export function isoWeekKey(instant: Date): string {
  const p = toNairobi(instant);
  const date = new Date(Date.UTC(p.y, p.m - 1, p.d));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
