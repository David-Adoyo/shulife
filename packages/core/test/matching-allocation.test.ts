import { describe, expect, it } from "vitest";
import { allocatePayment, describeSplit, hashMsisdn, ingestOnce, kes, matchPayment, parseReference, sum, type ChildBalance, type MatchFamily, type MatchLearner } from "../src";

const SALT = "test";
const h = (p: string) => hashMsisdn(p, SALT);

const learners: MatchLearner[] = [
  { id: "amani", familyId: "otieno", admissionNumber: "2041", firstName: "Amani", lastName: "Otieno", gradeCode: "G8", status: "active" },
  { id: "zawadi", familyId: "otieno", admissionNumber: "2187", firstName: "Zawadi", lastName: "Otieno", gradeCode: "G5", status: "active" },
  { id: "baraka", familyId: "otieno", admissionNumber: "2399", firstName: "Baraka", lastName: "Otieno", gradeCode: "PP2", status: "active" },
  { id: "john1", familyId: "kamau", admissionNumber: "1510", firstName: "John", lastName: "Kamau", gradeCode: "G4", status: "active" },
  { id: "john2", familyId: "kamau2", admissionNumber: "1688", firstName: "John", lastName: "Kamau", gradeCode: "G4", status: "active" },
  { id: "leaver", familyId: "wanjiru", admissionNumber: "1203", firstName: "Grace", lastName: "Wanjiru", gradeCode: "G9", status: "left" },
];
const families: MatchFamily[] = [
  { id: "otieno", code: "2041", guardianNames: ["Janet Otieno"], guardianPhoneHashes: [h("0712345678")], balance: kes(60000) },
  { id: "kamau", code: "1510", guardianNames: ["Peter Kamau"], guardianPhoneHashes: [h("0722000111")], balance: kes(20000) },
  { id: "kamau2", code: "1688", guardianNames: ["Mary Wambui"], guardianPhoneHashes: [h("0733000222")], balance: kes(18000) },
  { id: "wanjiru", code: "1203", guardianNames: ["Ann Wanjiru"], guardianPhoneHashes: [h("0744000333")], balance: kes(5000) },
];
const dir = { learners, families, payerLinks: [{ phoneHash: h("0700999888"), familyId: "otieno", source: "learned" as const }] };

describe("reference parser", () => {
  it.each([
    ["ADM 2041", ["2041"]],
    ["adm-02041", ["2041"]],
    ["2041 grade 8", ["2041"]],
    ["NO.2041", ["2041"]],
  ])("reads %s", (ref, adm) => {
    expect(parseReference(ref).admissionNumbers).toEqual(adm);
  });
  it("finds family codes, grades and names", () => {
    const p = parseReference("FAM-02041");
    expect(p.familyCode).toBe("2041");
    expect(p.admissionNumbers).toEqual([]);
    const q = parseReference("KAMAU GRADE 4");
    expect(q.gradeCode).toBe("G4");
    expect(q.nameTokens).toEqual(["KAMAU"]);
    expect(q.admissionNumbers).toEqual([]);
    expect(parseReference("").admissionNumbers).toEqual([]);
  });
});

describe("matching engine", () => {
  it("auto-applies an exact admission number", () => {
    const r = matchPayment({ billRef: "ADM 2041", amount: kes(45000) }, dir);
    expect(r.decision).toBe("auto");
    expect(r.best).toMatchObject({ familyId: "otieno", learnerId: "amani", score: 100 });
  });
  it("auto-applies a family code", () => {
    expect(matchPayment({ billRef: "FAM 2041", amount: kes(1000) }, dir).best?.familyId).toBe("otieno");
  });
  it("a sibling's number used for the whole family still finds the family", () => {
    const r = matchPayment({ billRef: "2399", amount: kes(60000) }, dir);
    expect(r.decision).toBe("auto");
    expect(r.best?.familyId).toBe("otieno");
    expect(r.best?.reasons.join(" ")).toMatch(/Amount equals the family balance/);
  });
  it("matches by registered guardian phone with no reference", () => {
    const r = matchPayment({ billRef: "", phoneHash: h("0712345678"), amount: kes(10000) }, dir);
    expect(r.decision).toBe("auto");
    expect(r.best?.score).toBe(90);
  });
  it("a grandparent's learned phone scores 85 and goes to review", () => {
    const r = matchPayment({ billRef: "school fees", phoneHash: h("0700999888"), amount: kes(10000) }, dir);
    expect(r.best).toMatchObject({ familyId: "otieno", score: 85 });
    expect(r.decision).toBe("review");
  });
  it("a parent paying with a child's name and grade goes to review with the right suggestion", () => {
    const r = matchPayment({ billRef: "OTIENO GRADE 8", amount: kes(10000) }, dir);
    expect(r.decision).toBe("review");
    expect(r.best?.learnerId).toBe("amani");
  });
  it("two learners with the same name are never auto-applied", () => {
    const r = matchPayment({ billRef: "JOHN KAMAU G4", amount: kes(10000) }, dir);
    expect(r.decision).toBe("review");
    expect(r.suggestions.map((s) => s.familyId).sort()).toEqual(["kamau", "kamau2"]);
  });
  it("a payment for a learner who has left goes to review", () => {
    const r = matchPayment({ billRef: "1203", amount: kes(5000) }, dir);
    expect(r.decision).toBe("review");
    expect(r.best?.reasons.join(" ")).toMatch(/left the school/);
  });
  it("an admission typo is suggested but never auto-applied alone", () => {
    const r = matchPayment({ billRef: "2042", amount: kes(5000) }, dir);
    expect(r.best?.learnerId).toBe("amani");
    expect(r.best?.score).toBe(60);
    expect(r.decision).toBe("review");
  });
  it("a payment for a different school is unmatched (not ours)", () => {
    expect(matchPayment({ billRef: "ST MARYS 9876", amount: kes(5000) }, dir).decision).toBe("unmatched");
  });
  it("duplicate callbacks are ignored", () => {
    const seen = new Set<string>();
    expect(ingestOnce({ providerRef: "SBX1" }, seen).status).toBe("new");
    expect(ingestOnce({ providerRef: "SBX1" }, seen).status).toBe("duplicate");
  });
});

const family = (): ChildBalance[] => [
  {
    learnerId: "amani",
    name: "Amani",
    ageKey: "2013-02-01",
    lines: [
      { lineId: "a-old", feeItemId: "tu", feeItemName: "Tuition", priority: 10, termKey: "2026-3", outstanding: kes(6000) },
      { lineId: "a-tu", feeItemId: "tu", feeItemName: "Tuition", priority: 10, termKey: "2027-1", outstanding: kes(18000) },
      { lineId: "a-tr", feeItemId: "tr", feeItemName: "Transport", priority: 40, termKey: "2027-1", outstanding: kes(4000) },
    ],
  },
  { learnerId: "zawadi", name: "Zawadi", ageKey: "2016-06-01", lines: [{ lineId: "z-tu", feeItemId: "tu", feeItemName: "Tuition", priority: 10, termKey: "2027-1", outstanding: kes(18000) }] },
  {
    learnerId: "baraka",
    name: "Baraka",
    ageKey: "2021-09-01",
    lines: [
      { lineId: "b-old", feeItemId: "lu", feeItemName: "Lunch", priority: 30, termKey: "2026-3", outstanding: kes(2000) },
      { lineId: "b-tu", feeItemId: "tu", feeItemName: "Tuition", priority: 10, termKey: "2027-1", outstanding: kes(12000) },
    ],
  },
];
const per = (r: ReturnType<typeof allocatePayment>) => Object.fromEntries(r.perLearner.map((p) => [p.learnerId, p.amount / 100]));

describe("sibling allocation", () => {
  it("A. oldest balance first: arrears first, then this term across all children", () => {
    const r = allocatePayment({ amount: kes(45000), rule: "oldest_balance", children: family() });
    expect(r.lines.filter((l) => l.lineId.endsWith("old")).map((l) => l.amount)).toEqual([kes(6000), kes(2000)]);
    expect(sum(r.lines.map((l) => l.amount))).toBe(kes(45000));
    expect(per(r)).toEqual({ amani: 21654, zawadi: 12808, baraka: 10538 });
    expect(r.credit).toBe(0);
  });
  it("B. proportional to each child's balance", () => {
    const r = allocatePayment({ amount: kes(45000), rule: "proportional", children: family() });
    expect(per(r)).toEqual({ amani: 21000, zawadi: 13500, baraka: 10500 });
  });
  it("C. eldest first and youngest first", () => {
    expect(per(allocatePayment({ amount: kes(45000), rule: "eldest_first", children: family() }))).toEqual({ amani: 28000, zawadi: 17000, baraka: 0 });
    expect(per(allocatePayment({ amount: kes(20000), rule: "youngest_first", children: family() }))).toEqual({ amani: 0, zawadi: 6000, baraka: 14000 });
  });
  it("D. exact number only: overpayment becomes that learner's credit", () => {
    const r = allocatePayment({ amount: kes(45000), rule: "exact_number", children: family(), matchedLearnerId: "amani" });
    expect(per(r)).toEqual({ amani: 28000, zawadi: 0, baraka: 0 });
    expect(r).toMatchObject({ credit: kes(17000), creditLevel: "learner", creditLearnerId: "amani" });
  });
  it("exact number with a family code falls back to the default rule", () => {
    expect(allocatePayment({ amount: kes(1000), rule: "exact_number", children: family() }).rule).toBe("oldest_balance");
  });
  it("within a learner, older terms first then fee-item priority", () => {
    const r = allocatePayment({ amount: kes(25000), rule: "eldest_first", children: family() });
    expect(r.lines.map((l) => l.lineId)).toEqual(["a-old", "a-tu", "a-tr"]);
    expect(r.lines[2].amount).toBe(kes(1000));
  });
  it("overpayment on a family becomes family credit", () => {
    const r = allocatePayment({ amount: kes(70000), rule: "proportional", children: family() });
    expect(r.credit).toBe(kes(10000));
    expect(r.creditLevel).toBe("family");
    expect(describeSplit(r)).toBe("Amani KSh 28,000, Zawadi KSh 18,000, Baraka KSh 14,000, credit KSh 10,000");
  });
  it("never mutates the caller's data and never loses a cent", () => {
    const input = family();
    for (const amount of [1, 99, kes(33333.33), kes(60000), kes(61000)]) {
      for (const rule of ["oldest_balance", "proportional", "eldest_first", "youngest_first"] as const) {
        const r = allocatePayment({ amount, rule, children: input });
        expect(sum(r.lines.map((l) => l.amount)) + r.credit).toBe(amount);
      }
    }
    expect(input[0].lines[0].outstanding).toBe(kes(6000));
  });
});
