import { assertCents, percentOf, roundTo, sum, type Cents } from "./money";

/**
 * Fee billing engine (§7.1).
 * invoice = enrolment × structure + optional subscriptions + transport route
 *           − discounts (sponsorship → sibling → staff → manual waiver)
 * Every discount is its own statement line. Idempotent per learner per term.
 */

export type FeeItem = {
  id: string;
  code: string; // tuition, lunch, transport, boarding, activity, exam, …
  name: string;
  kind: "mandatory" | "optional";
  refundable?: boolean;
  /** Whether a mid-term joiner pays a pro-rata share. Non-pro-rata items are charged in full. */
  proRata?: boolean;
  priority: number;
};

/** term × grade × fee item → amount, with day/boarder variants. */
export type FeeStructureRow = { gradeCode: string; feeItemId: string; day: Cents; boarder: Cents };

export type FeeStructure = { id: string; termId: string; status: "draft" | "approved" | "published"; rows: FeeStructureRow[] };

export type Enrolment = {
  learnerId: string;
  termId: string;
  gradeCode: string;
  boarding: "day" | "boarder";
  /** Optional items the learner takes this term (e.g. lunch, clubs). */
  optionalItemIds: string[];
  route?: { id: string; name: string; amount: Cents } | null;
  /** 1 = eldest enrolled child in the family, 2 = second, … (for sibling discounts). */
  siblingRank: number;
  staffChild?: boolean;
  /** Join or leave inside the term, for pro-rata. */
  joinDate?: string | null;
};

export type DiscountRule =
  | { kind: "sibling"; minRank: number; percent: number; feeItemCodes: string[]; label?: string }
  | { kind: "staff"; percent: number; feeItemCodes: string[]; label?: string };

export type Sponsorship = { sponsorId: string; sponsorName: string; feeItemCodes: string[]; percent?: number; fixed?: Cents };

export type Waiver = { id: string; amount: Cents; reason: string; approved: boolean };

export type InvoiceLine = {
  key: string;
  kind: "charge" | "sponsorship" | "sibling_discount" | "staff_discount" | "waiver";
  feeItemId: string | null;
  feeItemCode: string | null;
  description: string;
  /** Positive for charges, negative for discounts. */
  amount: Cents;
  optional: boolean;
  sponsorId?: string;
};

export type Invoice = { idempotencyKey: string; learnerId: string; termId: string; lines: InvoiceLine[]; total: Cents };

export type TermDates = { opening: string; closing: string };

/** Fraction of the term remaining from `joinDate`, in whole weeks (0–1). */
export function proRataFactor(term: TermDates, joinDate: string): number {
  const start = Date.parse(term.opening);
  const end = Date.parse(term.closing);
  const join = Date.parse(joinDate);
  if (join <= start) return 1;
  if (join >= end) return 0;
  const totalWeeks = Math.max(1, Math.ceil((end - start) / (7 * 86_400_000)));
  const weeksLeft = Math.ceil((end - join) / (7 * 86_400_000));
  return Math.min(1, weeksLeft / totalWeeks);
}

export function buildInvoice(input: {
  enrolment: Enrolment;
  structure: FeeStructure;
  feeItems: FeeItem[];
  term: TermDates;
  discountRules?: DiscountRule[];
  sponsorships?: Sponsorship[];
  waivers?: Waiver[];
}): Invoice {
  const { enrolment: e, structure, feeItems } = input;
  if (structure.status === "draft") throw new Error("Fee structure must be approved before invoicing");
  if (structure.termId !== e.termId) throw new Error("Fee structure is for a different term");
  const itemById = new Map(feeItems.map((f) => [f.id, f]));
  const factor = e.joinDate ? proRataFactor(input.term, e.joinDate) : 1;
  const lines: InvoiceLine[] = [];
  const net = new Map<string, Cents>(); // fee item code → remaining chargeable amount for discounts

  const charge = (item: FeeItem, full: Cents, description = item.name) => {
    const amount = item.proRata && factor < 1 ? roundTo(Math.round(full * factor), 100) : full;
    if (amount <= 0) return;
    lines.push({ key: `charge:${item.id}`, kind: "charge", feeItemId: item.id, feeItemCode: item.code, description: factor < 1 && item.proRata ? `${description} (pro-rata)` : description, amount: assertCents(amount), optional: item.kind === "optional" });
    net.set(item.code, (net.get(item.code) ?? 0) + amount);
  };

  for (const row of structure.rows.filter((r) => r.gradeCode === e.gradeCode)) {
    const item = itemById.get(row.feeItemId);
    if (!item) continue;
    if (item.code === "transport") continue; // transport comes from the route
    if (item.kind === "optional" && !e.optionalItemIds.includes(item.id)) continue;
    if (item.code === "boarding" && e.boarding !== "boarder") continue;
    const amount = e.boarding === "boarder" ? row.boarder : row.day;
    charge(item, amount);
  }
  if (e.route) {
    const transport = feeItems.find((f) => f.code === "transport");
    if (transport) charge(transport, e.route.amount, `Transport — ${e.route.name}`);
  }

  const discount = (kind: InvoiceLine["kind"], codes: string[], compute: (base: Cents) => Cents, description: string, sponsorId?: string) => {
    for (const code of codes) {
      const base = net.get(code) ?? 0;
      if (base <= 0) continue;
      const amount = Math.min(base, compute(base));
      if (amount <= 0) continue;
      net.set(code, base - amount);
      const item = feeItems.find((f) => f.code === code);
      lines.push({ key: `${kind}:${sponsorId ?? ""}:${code}`, kind, feeItemId: item?.id ?? null, feeItemCode: code, description: `${description} — ${item?.name ?? code}`, amount: -amount, optional: false, sponsorId });
    }
  };

  // Order matters (§7.1): sponsorship → sibling → staff → manual waiver.
  for (const s of input.sponsorships ?? []) {
    if (s.percent != null) discount("sponsorship", s.feeItemCodes, (b) => percentOf(b, s.percent!), `Sponsored by ${s.sponsorName}`, s.sponsorId);
    else if (s.fixed != null) {
      let left = s.fixed;
      discount("sponsorship", s.feeItemCodes, (b) => {
        const take = Math.min(b, left);
        left -= take;
        return take;
      }, `Sponsored by ${s.sponsorName}`, s.sponsorId);
    }
  }
  for (const r of input.discountRules ?? []) {
    if (r.kind === "sibling" && e.siblingRank >= r.minRank) discount("sibling_discount", r.feeItemCodes, (b) => percentOf(b, r.percent), r.label ?? `Sibling discount ${r.percent}%`);
    if (r.kind === "staff" && e.staffChild) discount("staff_discount", r.feeItemCodes, (b) => percentOf(b, r.percent), r.label ?? `Staff child ${r.percent}%`);
  }
  for (const w of (input.waivers ?? []).filter((x) => x.approved)) {
    const total = sum(lines.map((l) => l.amount));
    const amount = Math.min(total, w.amount);
    if (amount > 0) lines.push({ key: `waiver:${w.id}`, kind: "waiver", feeItemId: null, feeItemCode: null, description: `Waiver — ${w.reason}`, amount: -amount, optional: false });
  }

  return { idempotencyKey: `${e.learnerId}:${e.termId}`, learnerId: e.learnerId, termId: e.termId, lines, total: sum(lines.map((l) => l.amount)) };
}

/** Invoicing run preview: totals by grade before committing. Already-invoiced learners are skipped (idempotent). */
export function previewInvoicingRun(invoices: Invoice[], gradeOf: (learnerId: string) => string, alreadyInvoiced: Set<string> = new Set()) {
  const fresh = invoices.filter((i) => !alreadyInvoiced.has(i.idempotencyKey));
  const byGrade = new Map<string, { learners: number; total: Cents }>();
  for (const inv of fresh) {
    const g = gradeOf(inv.learnerId);
    const cur = byGrade.get(g) ?? { learners: 0, total: 0 };
    byGrade.set(g, { learners: cur.learners + 1, total: cur.total + inv.total });
  }
  return { invoices: fresh, skipped: invoices.length - fresh.length, byGrade, total: sum(fresh.map((i) => i.total)) };
}

/** Copy last term's structure with a % uplift, rounded to KSh 50 by default. */
export function upliftStructure(prev: FeeStructure, newTermId: string, percent: number, step: Cents = 5000): FeeStructure {
  return {
    id: `${prev.id}-copy`,
    termId: newTermId,
    status: "draft",
    rows: prev.rows.map((r) => ({ ...r, day: roundTo(r.day + percentOf(r.day, percent), step), boarder: roundTo(r.boarder + percentOf(r.boarder, percent), step) })),
  };
}

/** Diff view versus last term: changed cells only. */
export function diffStructures(prev: FeeStructure, next: FeeStructure) {
  const key = (r: FeeStructureRow) => `${r.gradeCode}|${r.feeItemId}`;
  const before = new Map(prev.rows.map((r) => [key(r), r]));
  return next.rows
    .map((r) => {
      const p = before.get(key(r));
      return { gradeCode: r.gradeCode, feeItemId: r.feeItemId, dayBefore: p?.day ?? 0, dayAfter: r.day, boarderBefore: p?.boarder ?? 0, boarderAfter: r.boarder };
    })
    .filter((d) => d.dayBefore !== d.dayAfter || d.boarderBefore !== d.boarderAfter);
}

/** `INV-RUI-2027-T1-000123` */
export function invoiceNumber(campusCode: string, year: number, termNo: number, seq: number) {
  return `INV-${campusCode}-${year}-T${termNo}-${String(seq).padStart(6, "0")}`;
}

/** Late fees are off by default (§4.8). When enabled, flat or % after a grace period. */
export function lateFee(policy: { enabled: boolean; graceDays: number; flat?: Cents; percent?: number } | null, balance: Cents, daysPastDue: number): Cents {
  if (!policy?.enabled || balance <= 0 || daysPastDue <= policy.graceDays) return 0;
  if (policy.flat != null) return policy.flat;
  return policy.percent != null ? percentOf(balance, policy.percent) : 0;
}
