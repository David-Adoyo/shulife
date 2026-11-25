import { describe, expect, it } from "vitest";
import { buildInvoice, diffStructures, formatKes, invoiceNumber, kes, lateFee, percentOf, previewInvoicingRun, proRataFactor, splitProportional, sum, upliftStructure, type FeeItem, type FeeStructure } from "../src";

describe("money", () => {
  it("converts shillings to integer cents exactly", () => {
    expect(kes(25000)).toBe(2_500_000);
    expect(kes("1,250.5")).toBe(125_050);
    expect(kes("0.1")).toBe(10);
    expect(() => kes("12.345")).toThrow();
  });
  it("formats like the UI", () => {
    expect(formatKes(2_500_000)).toBe("KSh 25,000");
    expect(formatKes(125_050)).toBe("KSh 1,250.50");
    expect(formatKes(-500)).toBe("−KSh 5");
  });
  it("splits proportionally and always sums to the total", () => {
    const parts = splitProportional(4_500_000, [2_800_000, 1_800_000, 1_400_000]);
    expect(sum(parts)).toBe(4_500_000);
    expect(parts).toEqual([2_100_000, 1_350_000, 1_050_000]);
    const odd = splitProportional(100, [1, 1, 1]);
    expect(odd).toEqual([34, 33, 33]);
    expect(splitProportional(4_500_000, [2_200_000, 1_800_000, 1_200_000], 100)).toEqual([1_903_800, 1_557_700, 1_038_500]);
  });
  it("rejects floats", () => {
    expect(() => sum([0.5, 1])).toThrow();
  });
  it("percent rounds half-up to the cent", () => {
    expect(percentOf(1_000_001, 10)).toBe(100_000);
    expect(percentOf(333, 12.5)).toBe(42);
  });
});

const items: FeeItem[] = [
  { id: "tu", code: "tuition", name: "Tuition", kind: "mandatory", proRata: true, priority: 10 },
  { id: "bo", code: "boarding", name: "Boarding", kind: "mandatory", proRata: true, priority: 20 },
  { id: "lu", code: "lunch", name: "Lunch", kind: "optional", proRata: true, priority: 30 },
  { id: "tr", code: "transport", name: "Transport", kind: "optional", proRata: true, priority: 40 },
  { id: "ad", code: "admission", name: "Admission fee", kind: "mandatory", proRata: false, priority: 90 },
];
const structure: FeeStructure = {
  id: "fs1",
  termId: "T1",
  status: "approved",
  rows: [
    { gradeCode: "G4", feeItemId: "tu", day: kes(30000), boarder: kes(30000) },
    { gradeCode: "G4", feeItemId: "bo", day: 0, boarder: kes(20000) },
    { gradeCode: "G4", feeItemId: "lu", day: kes(6000), boarder: 0 },
    { gradeCode: "G4", feeItemId: "ad", day: kes(5000), boarder: kes(5000) },
  ],
};
const term = { opening: "2027-01-06", closing: "2027-04-07" };
const base = { learnerId: "L1", termId: "T1", gradeCode: "G4", boarding: "day" as const, optionalItemIds: ["lu"], siblingRank: 1 };

describe("fee billing", () => {
  it("builds an invoice from structure + optional items + route", () => {
    const inv = buildInvoice({ enrolment: { ...base, route: { id: "r2", name: "Route 2", amount: kes(8000) } }, structure, feeItems: items, term });
    expect(inv.lines.map((l) => [l.feeItemCode, l.amount])).toEqual([
      ["tuition", kes(30000)],
      ["lunch", kes(6000)],
      ["admission", kes(5000)],
      ["transport", kes(8000)],
    ]);
    expect(inv.total).toBe(kes(49000));
    expect(inv.idempotencyKey).toBe("L1:T1");
  });
  it("skips optional items not chosen and boarding for day scholars", () => {
    const inv = buildInvoice({ enrolment: { ...base, optionalItemIds: [] }, structure, feeItems: items, term });
    expect(inv.lines.map((l) => l.feeItemCode)).toEqual(["tuition", "admission"]);
  });
  it("charges boarders the boarder column", () => {
    const inv = buildInvoice({ enrolment: { ...base, boarding: "boarder", optionalItemIds: [] }, structure, feeItems: items, term });
    expect(inv.total).toBe(kes(55000));
  });
  it("applies discounts in order: sponsorship → sibling → staff → waiver, each as its own line", () => {
    const inv = buildInvoice({
      enrolment: { ...base, siblingRank: 3, staffChild: true, optionalItemIds: [] },
      structure,
      feeItems: items,
      term,
      sponsorships: [{ sponsorId: "S1", sponsorName: "Acme Ltd", feeItemCodes: ["tuition"], percent: 50 }],
      discountRules: [
        { kind: "sibling", minRank: 3, percent: 10, feeItemCodes: ["tuition"] },
        { kind: "staff", percent: 20, feeItemCodes: ["tuition"] },
      ],
      waivers: [{ id: "W1", amount: kes(1000), reason: "Hardship", approved: true }, { id: "W2", amount: kes(9999), reason: "Pending", approved: false }],
    });
    expect(inv.lines.map((l) => [l.kind, l.amount])).toEqual([
      ["charge", kes(30000)],
      ["charge", kes(5000)],
      ["sponsorship", -kes(15000)],
      ["sibling_discount", -kes(1500)], // 10% of the 15,000 left after sponsorship
      ["staff_discount", -kes(2700)], // 20% of 13,500
      ["waiver", -kes(1000)],
    ]);
    expect(inv.total).toBe(kes(14800));
  });
  it("pro-rates mid-term joiners only for pro-rata items", () => {
    expect(proRataFactor(term, "2027-01-01")).toBe(1);
    const f = proRataFactor(term, "2027-02-17");
    expect(f).toBeGreaterThan(0.5);
    expect(f).toBeLessThan(0.8);
    const inv = buildInvoice({ enrolment: { ...base, optionalItemIds: [], joinDate: "2027-02-17" }, structure, feeItems: items, term });
    const admission = inv.lines.find((l) => l.feeItemCode === "admission")!;
    const tuition = inv.lines.find((l) => l.feeItemCode === "tuition")!;
    expect(admission.amount).toBe(kes(5000));
    expect(tuition.amount).toBeLessThan(kes(30000));
    expect(tuition.amount % 100).toBe(0);
    expect(tuition.description).toContain("pro-rata");
  });
  it("refuses draft structures and other terms", () => {
    expect(() => buildInvoice({ enrolment: base, structure: { ...structure, status: "draft" }, feeItems: items, term })).toThrow(/approved/);
    expect(() => buildInvoice({ enrolment: { ...base, termId: "T2" }, structure, feeItems: items, term })).toThrow(/different term/);
  });
  it("invoicing run preview is idempotent per learner per term", () => {
    const a = buildInvoice({ enrolment: base, structure, feeItems: items, term });
    const b = buildInvoice({ enrolment: { ...base, learnerId: "L2" }, structure, feeItems: items, term });
    const p = previewInvoicingRun([a, b], () => "G4", new Set(["L1:T1"]));
    expect(p.skipped).toBe(1);
    expect(p.byGrade.get("G4")).toEqual({ learners: 1, total: b.total });
  });
  it("copies last term with an uplift rounded to KSh 50 and shows a diff", () => {
    const next = upliftStructure(structure, "T2", 7);
    expect(next.status).toBe("draft");
    expect(next.rows[0].day).toBe(kes(32100));
    expect(diffStructures(structure, next).length).toBe(4);
  });
  it("numbers invoices and keeps late fees off by default", () => {
    expect(invoiceNumber("RUI", 2027, 1, 123)).toBe("INV-RUI-2027-T1-000123");
    expect(lateFee(null, kes(10000), 60)).toBe(0);
    expect(lateFee({ enabled: true, graceDays: 14, flat: kes(500) }, kes(10000), 10)).toBe(0);
    expect(lateFee({ enabled: true, graceDays: 14, percent: 2 }, kes(10000), 20)).toBe(kes(200));
  });
});
