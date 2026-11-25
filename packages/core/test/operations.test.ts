import { describe, expect, it } from "vitest";
import {
  adjustSendTime, balanceOf, bankingVariance, buildStatement, capabilities, cashUp, checkTone, clearanceBoard, closeTerm, createRateLimiter, evaluateClearance,
  formatDate, fromNairobi, groupFamilies, handleInbound, hashMsisdn, kes, mapColumns, maskMsisdn, nextSubscription, normalizeMsisdn, parseBankCsv, parseCommand,
  parseCsv, parseDarajaC2B, parseStkCallback, planReminders, projectCash, promoteGrade, readReceiptStats, receiptNumber, render, resolveAudience, smsInfo, stillDue,
  teacherView, termCharge, toNairobi, toSmsSafe, unbankedAlerts, validateImport, verifyCode, type FamilyState, type LedgerEntry, type Subscription,
} from "../src";

const cfg = { quietStart: "21:00", quietEnd: "07:00", maxPerWeek: 2, holidays: ["2027-01-01"] };

describe("phones and time", () => {
  it("normalises Kenyan numbers", () => {
    for (const p of ["0712345678", "712345678", "254712345678", "+254 712 345 678", "0112345678"]) expect(normalizeMsisdn(p)).toMatch(/^2547|^2541/);
    expect(normalizeMsisdn("0812345678")).toBeNull();
    expect(maskMsisdn("0712345678")).toBe("0712 ••• 678");
  });
  it("works in Nairobi time (UTC+3)", () => {
    const t = fromNairobi(2027, 1, 12, 8, 30);
    expect(t.toISOString()).toBe("2027-01-12T05:30:00.000Z");
    expect(toNairobi(t).hh).toBe(8);
    expect(formatDate(t)).toBe("12 Jan 2027");
  });
});

describe("reminder engine", () => {
  const term = { id: "T1", openingDate: "2027-01-06", dueDate: "2027-01-13" };
  const family: FamilyState = { familyId: "F", balance: kes(20000), hasActivePlan: false };
  const now = fromNairobi(2026, 12, 1);

  it("never sends in quiet hours or on Sunday mornings", () => {
    expect(toNairobi(adjustSendTime(fromNairobi(2027, 1, 12, 22, 15), cfg))).toMatchObject({ d: 13, hh: 7, mm: 0 });
    expect(toNairobi(adjustSendTime(fromNairobi(2027, 1, 12, 5, 0), cfg))).toMatchObject({ d: 12, hh: 7 });
    expect(toNairobi(adjustSendTime(fromNairobi(2027, 1, 10, 9, 0), cfg))).toMatchObject({ d: 10, hh: 12 }); // Sunday
    expect(toNairobi(adjustSendTime(fromNairobi(2027, 1, 1, 9, 0), cfg))).toMatchObject({ d: 2, hh: 9 }); // holiday
  });
  it("follows the term timeline", () => {
    const { scheduled } = planReminders({ term, family, config: { ...cfg, maxPerWeek: 10 }, now });
    expect(scheduled.map((s) => s.template)).toEqual(["statement_published", "pre_opening", "due_today", "due_plus_7", "due_plus_21"]);
    for (const s of scheduled) {
      const p = toNairobi(s.sendAt);
      expect(p.hh >= 7 && p.hh < 21).toBe(true);
    }
  });
  it("gentle tone stops after +7", () => {
    const { scheduled } = planReminders({ term, family, config: { ...cfg, maxPerWeek: 10, tone: "gentle" }, now });
    expect(scheduled.map((s) => s.template)).not.toContain("due_plus_21");
  });
  it("respects the weekly cap", () => {
    // Due date (13 Jan) and the exam clearance notice (20 − 7 = 13 Jan) fall in the same week.
    const { scheduled, skipped } = planReminders({ term, family: { ...family, clearanceEvents: [{ id: "E", name: "Mid-term exams", date: "2027-01-20", cleared: false }] }, config: { ...cfg, maxPerWeek: 1 }, now });
    expect(skipped.filter((s) => s.reason === "weekly cap reached").map((s) => s.template)).toEqual(["clearance_notice"]);
    expect(scheduled.map((s) => s.template)).toContain("due_today");
  });
  it("stops when paid", () => {
    const { scheduled, skipped } = planReminders({ term, family: { ...family, balance: 0 }, config: cfg, now });
    expect(scheduled).toEqual([]);
    expect(skipped.every((s) => s.reason === "balance cleared")).toBe(true);
    expect(stillDue({ template: "due_today", vars: {} }, { ...family, balance: 0 })).toBe("balance cleared");
  });
  it("is plan-aware: fee reminders stop, instalment reminders go out", () => {
    const planned: FamilyState = { ...family, hasActivePlan: true, instalments: [{ n: 1, totalN: 2, dueDate: "2027-01-20", amount: kes(10000), paid: false }, { n: 2, totalN: 2, dueDate: "2027-02-20", amount: kes(10000), paid: true }] };
    const { scheduled } = planReminders({ term, family: planned, config: { ...cfg, maxPerWeek: 10 }, now });
    expect(scheduled.map((s) => s.key)).toEqual(["T1:statement", "T1:plan:1:-2", "T1:plan:1:0"]);
  });
  it("skips what was already sent", () => {
    const { skipped } = planReminders({ term, family, config: cfg, now, sent: [{ key: "T1:statement", at: fromNairobi(2026, 12, 23, 9) }] });
    expect(skipped.find((s) => s.key === "T1:statement")?.reason).toBe("already sent");
  });
});

describe("clearance", () => {
  const rule = { thresholdPct: 70 };
  const base = { learnerId: "L", name: "Amani O.", streamId: "S1", termFees: kes(30000) };
  it("applies the threshold, plans and overrides", () => {
    expect(evaluateClearance({ ...base, paid: kes(21000) }, rule, "2027-02-01")).toBe("cleared");
    expect(evaluateClearance({ ...base, paid: kes(20000) }, rule, "2027-02-01")).toBe("not_cleared");
    expect(evaluateClearance({ ...base, paid: 0, plan: { instalments: [{ dueDate: "2027-01-20", paid: true }, { dueDate: "2027-02-20", paid: false }] } }, rule, "2027-02-01")).toBe("on_plan");
    expect(evaluateClearance({ ...base, paid: 0, plan: { instalments: [{ dueDate: "2027-01-20", paid: false }] } }, rule, "2027-02-01")).toBe("not_cleared");
    expect(evaluateClearance({ ...base, paid: 0, override: { by: "head", reason: "Bereavement" } }, rule, "2027-02-01")).toBe("overridden");
    expect(() => evaluateClearance({ ...base, paid: 0, override: { by: "head", reason: " " } }, rule, "2027-02-01")).toThrow();
  });
  it("teachers see no amounts", () => {
    const view = teacherView([{ ...base, paid: kes(30000) }, { ...base, learnerId: "X", streamId: "S2", paid: 0 }], rule, "2027-02-01", ["S1"]);
    expect(view).toEqual([{ learnerId: "L", name: "Amani O.", status: "cleared" }]);
    expect(JSON.stringify(view)).not.toMatch(/paid|termFees|amount/i);
    expect(clearanceBoard([{ ...base, paid: 0 }], rule, "2027-02-01").not_cleared).toHaveLength(1);
  });
});

describe("cash projection", () => {
  const base = { asOf: "2027-01-06", days: 30 as const, termOpening: "2027-01-06", outstanding: kes(1_000_000), instalments: [{ dueDate: "2027-01-10", amount: kes(10000) }], ratiba: [{ dueDate: "2027-01-15", amount: kes(5000) }] };
  it("says it is learning without history", () => {
    const r = projectCash({ ...base, history: [] });
    expect(r.status).toBe("learning");
    expect(r.total).toBe(kes(8500) + kes(5000));
  });
  it("applies the historical curve and stays within the band", () => {
    const r = projectCash({ ...base, history: [{ billed: kes(100), collectedByWeek: [kes(40), kes(20), kes(10), kes(10), kes(5)] }] });
    expect(r.status).toBe("ok");
    expect(r.total).toBeGreaterThan(kes(800_000));
    expect(r.total).toBeLessThanOrEqual(kes(1_000_000) + kes(13500));
    for (const d of r.days) expect(d.low <= d.expected && d.expected <= d.high).toBe(true);
    expect(r.notes[0], r.notes[0]).toMatch(/first 3 weeks of term \(70%\)/);
  });
});

describe("ledger, statements and term close", () => {
  const e = (id: string, termKey: string, amount: number, kind: LedgerEntry["kind"] = "invoice_line"): LedgerEntry => ({ id, learnerId: "L", termKey, at: `${termKey}T00:00:${id}`, kind, description: id, amount: kes(amount) });
  it("carries balances forward exactly", () => {
    const entries = [e("1", "2026-3", 30000), e("2", "2026-3", -25000, "allocation")];
    expect(balanceOf(entries)).toBe(kes(5000));
    const closed = closeTerm({ closingTermKey: "2026-3", nextTermKey: "2027-1", at: "2027-01-01", balances: [{ learnerId: "L", balance: kes(5000), status: "active" }, { learnerId: "Z", balance: 0, status: "left" }], idFor: (id) => `bf-${id}` });
    const all = [...entries, ...closed.closing, ...closed.carried, e("3", "2027-1", 32000)];
    expect(balanceOf(all)).toBe(kes(37000));
    const st = buildStatement(all, "L");
    expect(st.sections.map((s) => [s.termKey, s.broughtForward / 100, s.closing / 100])).toEqual([
      ["2026-3", 0, 5000],
      ["2027-1", 5000, 37000],
    ]);
    expect(closed.leavers).toEqual([{ learnerId: "Z", balance: 0, certificateEligible: true }]);
  });
  it("promotes grades and graduates the last one", () => {
    expect(promoteGrade("PP2", ["PP1", "PP2", "G1"])).toBe("G1");
    expect(promoteGrade("G1", ["PP1", "PP2", "G1"])).toBe("graduate");
  });
});

describe("receipts and cash-up", () => {
  it("numbers receipts and makes unambiguous verify codes", () => {
    expect(receiptNumber("RUI", 2027, 456)).toBe("RCT-RUI-2027-000456");
    expect(() => receiptNumber("ruiru", 2027, 1)).toThrow();
    expect(verifyCode()).toMatch(/^[A-HJ-NP-Z2-9]{10}$/);
  });
  it("cash-up, banking variance and unbanked alerts", () => {
    const r = [
      { id: "1", receiverId: "A", channel: "cash" as const, amount: kes(1000), receivedOn: "2027-01-12", bankedDepositId: null, hasPhoto: true },
      { id: "2", receiverId: "A", channel: "cheque" as const, amount: kes(5000), receivedOn: "2027-01-12", bankedDepositId: "D1", hasPhoto: false },
    ];
    const c = cashUp(r, "2027-01-12");
    expect(c.total).toBe(kes(6000));
    expect(c.missingPhotos).toEqual(["2"]);
    expect(bankingVariance(kes(5000), [r[1]])).toBe(0);
    expect(unbankedAlerts(r, "2027-01-16", 2).map((x) => x.id)).toEqual(["1"]);
  });
});

describe("messaging", () => {
  it("renders EN and SW and requires the school name first", () => {
    const vars = { school: "Mlima Academy", amount: "45,000", child: "Amani", receipt_no: "RCT-RUI-2027-000456", balance: "0", link: "https://s.li/r/X" };
    expect(render("receipt", "en", vars)).toBe("Mlima Academy: Received KSh 45,000 for Amani. Receipt RCT-RUI-2027-000456. Balance: KSh 0. Thank you! https://s.li/r/X");
    expect(render("receipt", "sw", vars)).toMatch(/^Mlima Academy: Tumepokea KSh 45,000 kwa Amani/);
    expect(() => render("receipt", "en", { school: "Mlima Academy" })).toThrow(/Missing/);
  });
  it("counts SMS parts and keeps SMS emoji-free", () => {
    expect(smsInfo("a".repeat(160))).toEqual({ encoding: "GSM-7", length: 160, parts: 1 });
    expect(smsInfo("a".repeat(161)).parts).toBe(2);
    expect(smsInfo("Asante 🙏").encoding).toBe("UCS-2");
    expect(toSmsSafe("“Hello” – done").text).toBe('"Hello" - done');
    expect(toSmsSafe("Thanks 🙏").problems.length).toBeGreaterThan(0);
  });
  it("blocks shaming words", () => {
    expect(checkTone("List of defaulters attached")).toEqual(["defaulter"]);
    expect(checkTone("Thank you for paying")).toEqual([]);
  });
  it("resolves audiences without duplicates, respecting opt-outs", () => {
    const learners = [
      { id: "1", campusId: "C", gradeCode: "G4", streamId: "G4E", routeId: "R2", boarding: "day" as const, status: "active", guardianIds: ["g1", "g2"] },
      { id: "2", campusId: "C", gradeCode: "G4", streamId: "G4W", routeId: null, boarding: "boarder" as const, status: "active", guardianIds: ["g1"] },
      { id: "3", campusId: "C", gradeCode: "G4", streamId: "G4E", routeId: null, boarding: "day" as const, status: "left", guardianIds: ["g9"] },
    ];
    const guardians = [{ id: "g1", receivesNotices: true }, { id: "g2", receivesNotices: false }, { id: "g9", receivesNotices: true }];
    expect(resolveAudience([{ kind: "stream", streamIds: ["G4E"] }], learners, guardians)).toEqual(["g1"]);
    expect(resolveAudience([{ kind: "grade", gradeCodes: ["G4"] }, { kind: "route", routeIds: ["R2"] }], learners, guardians)).toEqual(["g1"]);
    expect(readReceiptStats([{ status: "read", channel: "whatsapp" }, { status: "delivered", channel: "whatsapp" }, { status: "failed", channel: "sms" }])).toEqual({ total: 3, delivered: 2, read: 1, failed: 1, unreadWhatsapp: 1 });
  });
});

describe("WhatsApp assistant", () => {
  const school = { name: "Mlima Academy", officePhone: "0700 000 000", term: "Term 1 2027" };
  const families = [{ familyId: "F", guardianPhoneHashes: [hashMsisdn("0712345678", "s")], preferredLang: "en" as const, children: [{ name: "Amani", balance: kes(7000) }, { name: "Zawadi", balance: kes(4500) }], payLink: "https://pay" }];
  it("parses EN and SW commands", () => {
    expect(parseCommand(" salio ")).toEqual({ command: "balance", lang: "sw" });
    expect(parseCommand("Balance please")).toEqual({ command: "balance", lang: "en" });
    expect(parseCommand("hello")).toBeNull();
  });
  it("answers registered guardians", () => {
    const r = handleInbound({ senderPhoneHash: hashMsisdn("0712345678", "s"), text: "SALIO", school, families });
    expect(r.kind).toBe("text");
    if (r.kind === "text") expect(r.text).toContain("Jumla: KSh 11,500");
  });
  it("discloses nothing to unknown numbers", () => {
    const r = handleInbound({ senderPhoneHash: hashMsisdn("0799999999", "s"), text: "BALANCE", school, families });
    expect(r).toEqual({ kind: "text", text: "Sorry, this number isn't registered with Mlima Academy. Please contact the school office on 0700 000 000." });
  });
  it("routes PLAN to the bursar and rate-limits", () => {
    expect(handleInbound({ senderPhoneHash: hashMsisdn("0712345678", "s"), text: "MPANGO", school, families }).kind).toBe("route_to_inbox");
    let t = 0;
    const rl = createRateLimiter(2, 1000, () => t);
    expect([rl.allow("x"), rl.allow("x"), rl.allow("x")]).toEqual([true, true, false]);
    t = 2000;
    expect(rl.allow("x")).toBe(true);
  });
});

describe("import", () => {
  const csv = `Adm No,First Name,Surname,Class,Stream,Parent Name,Phone,Boarding
"0123",Amani,Otieno,Grade 8,East,Janet Otieno,0712 345 678,Day
124,Zawadi,Otieno,5,West,Janet Otieno,+254712345678,day
125,Brian,,G9,East,Tom Mwangi,0722111222,Boarder
125,Dup,Row,G9,East,X,0722111223,Day
126,Bad,Grade,Form 9,East,Y,12345,Day`;
  it("maps columns, validates and groups families by phone", () => {
    const rows = parseCsv(csv);
    const map = mapColumns(rows[0]);
    expect(map).toMatchObject({ admission: 0, firstName: 1, lastName: 2, grade: 3, stream: 4, guardianName: 5, guardianPhone: 6, boarding: 7 });
    const { rows: good, issues } = validateImport(rows.slice(1), map);
    expect(good.map((r) => r.admission)).toEqual(["123", "124", "125"]);
    expect(issues.filter((i) => i.severity === "error").map((i) => i.row)).toEqual([5, 6]);
    const fams = groupFamilies(good);
    expect(fams).toHaveLength(2);
    expect(fams[0]).toMatchObject({ code: "FAM-123", displayName: "The Otieno family" });
    expect(fams[0].learners).toHaveLength(2);
  });
});

describe("payment ingestion", () => {
  it("parses Daraja C2B in Nairobi time", () => {
    const p = parseDarajaC2B({ TransID: "SBX123", TransTime: "20270112074200", TransAmount: "45000.00", BusinessShortCode: "600000", BillRefNumber: " ADM 2041 ", MSISDN: "254712345678", FirstName: "JANET", LastName: "OTIENO" });
    expect(p).toMatchObject({ providerRef: "SBX123", amount: kes(45000), billRef: "ADM 2041", paidAt: "2027-01-12T04:42:00.000Z", payerName: "JANET OTIENO" });
  });
  it("parses STK success and failure", () => {
    const ok = parseStkCallback({ Body: { stkCallback: { ResultCode: 0, ResultDesc: "ok", CheckoutRequestID: "C1", CallbackMetadata: { Item: [{ Name: "Amount", Value: 100 }, { Name: "MpesaReceiptNumber", Value: "R1" }, { Name: "TransactionDate", Value: 20270112080000 }, { Name: "PhoneNumber", Value: 254712345678 }] } } } });
    expect(ok.ok && ok.payment.amount).toBe(kes(100));
    expect(parseStkCallback({ Body: { stkCallback: { ResultCode: 1032, ResultDesc: "Cancelled by user", CheckoutRequestID: "C2" } } }).ok).toBe(false);
  });
  it("imports bank CSV and dedupes by reference", () => {
    const csv = "Date,Ref,Narrative,Debit,Credit\n2027-01-12,FT1,ADM 2041,,45000\n2027-01-12,FT1,ADM 2041,,45000\n2027-01-12,FT2,charges,200,\n2027-01-13,FT0,old,,100";
    const r = parseBankCsv(csv, { date: 0, reference: 1, description: 2, credit: 4 }, new Set(["FT0"]));
    expect(r.payments.map((p) => p.providerRef)).toEqual(["FT1"]);
    expect(r.duplicates).toEqual(["FT1", "FT0"]);
  });
});

describe("Shulife subscription", () => {
  const s0: Subscription = { state: "free", trialEndsAt: null, dueAt: null, graceDays: 14, trialDays: 30 };
  it("runs free → trial → active → overdue → read-only → restored, and never stops ingestion", () => {
    let s = nextSubscription(s0, { type: "tick", at: "2027-01-01" });
    expect(s.state).toBe("free");
    s = nextSubscription(s, { type: "first_auto_match", at: "2027-01-10T00:00:00Z" });
    expect(s.state).toBe("trial");
    s = nextSubscription(s, { type: "tick", at: "2027-02-10T00:00:00Z" });
    expect(s.state).toBe("active");
    s = nextSubscription(s, { type: "invoice_issued", at: "2027-02-10", dueAt: "2027-02-24T00:00:00Z" });
    s = nextSubscription(s, { type: "tick", at: "2027-02-25T00:00:00Z" });
    expect(s.state).toBe("overdue");
    s = nextSubscription(s, { type: "tick", at: "2027-03-15T00:00:00Z" });
    expect(s.state).toBe("read_only");
    expect(capabilities(s.state)).toMatchObject({ canEdit: false, paymentIngestion: true, receipts: true, parentBalances: true });
    s = nextSubscription(s, { type: "invoice_paid", at: "2027-03-16" });
    expect(s.state).toBe("active");
    expect(termCharge(10, kes(100), kes(5000))).toBe(kes(5000));
    expect(termCharge(620, kes(100), kes(5000))).toBe(kes(62000));
  });
});
