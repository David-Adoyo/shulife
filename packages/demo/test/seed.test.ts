import { describe, expect, it } from "vitest";
import { hashMsisdn, kes, sum } from "@shulife/core";
import { createSchool, dashboard, familyBalance, familyDetail, ingest, parentView, resolveReview, reviewQueue, SALT, type Payment } from "../src";

const s = createSchool();

describe("demo seed (§16)", () => {
  it("has the specified shape", () => {
    expect(s.learners).toHaveLength(620);
    expect(s.families).toHaveLength(410);
    expect(s.campuses.map((c) => c.name)).toEqual(["Mlima Academy, Ruiru", "Mlima Academy, Syokimau"]);
    expect(s.routes).toHaveLength(3);
    expect(s.learners.some((l) => l.boarding === "boarder" && ["G7", "G8", "G9"].includes(l.gradeCode))).toBe(true);
    expect(s.learners.every((l) => l.boarding === "day" || ["G7", "G8", "G9"].includes(l.gradeCode))).toBe(true);
    const sizes = new Set(s.families.map((f) => s.learners.filter((l) => l.familyId === f.id).length));
    expect([...sizes].sort()).toEqual([1, 2, 3, 4]);
  });

  it("covers the awkward cases", () => {
    const kinds = new Set(s.payments.map((p) => p.matchKind));
    for (const k of ["Auto", "Guardian phone", "Reviewed", "Manual"]) expect(kinds.has(k as Payment["matchKind"])).toBe(true);
    const ch = new Set(s.payments.map((p) => p.channel));
    for (const c of ["c2b", "bank_import", "cash", "cheque"]) expect(ch.has(c as Payment["channel"])).toBe(true);
    expect(s.payments.some((p) => p.matchStatus === "reversed")).toBe(true);
    expect(s.payments.some((p) => p.matchStatus === "not_ours")).toBe(true);
    expect(s.payments.some((p) => p.credit > 0)).toBe(true);
    expect(s.payments.some((p) => p.split.length >= 2)).toBe(true);
    expect(s.duplicatesIgnored).toBe(5);
    expect(s.plans.length).toBeGreaterThan(10);
    expect(reviewQueue(s).length).toBeGreaterThan(0);
  });

  it("reconciles to the cent: ledger = invoices − allocations ± reversals", () => {
    const invoiced = sum(s.invoices.map((i) => i.total));
    const ledger = sum(s.ledger.map((e) => e.amount));
    const allocated = sum(s.payments.filter((p) => p.familyId && p.matchStatus !== "reversed").map((p) => p.amount - p.credit));
    expect(ledger).toBe(invoiced - allocated);
    const open = sum([...s.lines.values()].map((l) => l.outstanding));
    expect(open).toBe(ledger);
    for (const p of s.payments.filter((x) => x.familyId)) expect(sum(p.split.map((x) => x.amount)) + p.credit).toBe(p.amount);
  });

  it("the Otieno family looks like the marketing site", () => {
    const d = familyDetail(s, "f1")!;
    expect(d.kids.map((k) => [k.learner.firstName, k.learner.admissionNumber, k.learner.gradeCode])).toEqual([
      ["Amani", "2041", "G8"],
      ["Zawadi", "2187", "G5"],
      ["Baraka", "2399", "PP2"],
    ]);
    expect(parentView(s, "f1")!.children).toHaveLength(3);
  });

  it("dashboard figures are consistent", () => {
    const d = dashboard(s);
    expect(d.pct).toBeGreaterThan(40);
    expect(d.pct).toBeLessThan(100);
    expect(d.heat).toHaveLength(11);
    expect(d.feed.length).toBe(8);
    expect(d.projection.status).toBe("ok");
  });
});

describe("Stage 6 acceptance: 300 simulated payments → ≥ 90% auto-matched and allocated", () => {
  it("auto-matches at least 90%", () => {
    const sim = createSchool(99);
    const owing = sim.families.filter((f) => familyBalance(sim, f.id) > 0);
    let n = 0;
    let auto = 0;
    for (let i = 0; i < 300; i++) {
      const fam = owing[i % owing.length];
      const kids = sim.learners.filter((l) => l.familyId === fam.id);
      const g = sim.guardians.find((x) => x.familyId === fam.id && x.isPayer)!;
      const kid = kids[i % kids.length];
      // Realistic mix: admission numbers, family codes, guardian phones with junk references, a few odd ones.
      const style = i % 20;
      const billRef = style < 12 ? `ADM ${kid.admissionNumber}` : style < 14 ? fam.code : style < 18 ? "school fees" : style === 18 ? `${kid.lastName} grade ${kid.gradeCode.slice(1)}` : "";
      const phoneHash = style === 18 || style === 19 ? hashMsisdn(`07${String(10_000_000 + i).padStart(8, "0")}`, SALT) : g.phoneHash;
      const p: Payment = { id: `sim${i}`, providerRef: `SIM${i}`, campusId: fam.campusId, amount: kes(1000), billRef, phoneLast3: "000", phoneHash, payerName: null, paidAt: sim.today, channel: "c2b", matchStatus: "unmatched", matchKind: "—", confidence: null, familyId: null, learnerId: null, rule: null, split: [], credit: 0, receiptNo: null, verifyCode: null, termId: "t-2027-1", suggestions: [] };
      const r = ingest(sim, p);
      n++;
      if (r === "auto") auto++;
    }
    expect(auto / n).toBeGreaterThanOrEqual(0.9);
    // and every auto-matched payment produced a receipt and a split
    expect(sim.payments.filter((p) => p.id.startsWith("sim") && p.matchStatus === "auto").every((p) => p.receiptNo && sum(p.split.map((x) => x.amount)) + p.credit === p.amount)).toBe(true);
  });

  it("review decisions teach Shulife the payer's phone", () => {
    const sim = createSchool(7);
    const fam = sim.families[3];
    const stranger = hashMsisdn("0799123456", SALT);
    const mk = (id: string): Payment => ({ id, providerRef: id, campusId: fam.campusId, amount: kes(500), billRef: "for the kids", phoneLast3: "456", phoneHash: stranger, payerName: null, paidAt: sim.today, channel: "c2b", matchStatus: "unmatched", matchKind: "—", confidence: null, familyId: null, learnerId: null, rule: null, split: [], credit: 0, receiptNo: null, verifyCode: null, termId: "t-2027-1", suggestions: [] });
    expect(ingest(sim, mk("x1"))).toBe("review");
    resolveReview(sim, "x1", { familyId: fam.id });
    const second = mk("x2");
    ingest(sim, second);
    expect(second.suggestions[0]?.familyId).toBe(fam.id);
    expect(second.suggestions[0]?.reasons[0]).toMatch(/learned/i);
  });
});
