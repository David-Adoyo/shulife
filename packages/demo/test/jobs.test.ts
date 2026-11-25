import { describe, expect, it } from "vitest";
import { fromNairobi, toNairobi } from "@shulife/core";
import { createSchool, dispatch, dueMessages, familyBalance } from "../src";

const s = createSchool();
const link = (id: string) => `https://s.li/p/${id}`;

describe("reminder job", () => {
  it("sends the due-date reminder on the due day, in each guardian's language, never to learners", () => {
    const sent = new Set<string>();
    const msgs = dueMessages(s, { now: fromNairobi(2027, 1, 12, 9, 10), windowMinutes: 15, sent, link });
    expect(msgs.length).toBeGreaterThan(0);
    for (const m of msgs) {
      expect(m.template).toBe("due_today");
      expect(m.text.startsWith("Mlima Academy:")).toBe(true);
      expect(s.guardians.some((g) => g.id === m.guardianId && g.isPayer)).toBe(true);
      expect(familyBalance(s, m.familyId)).toBeGreaterThan(0);
    }
    expect(msgs.some((m) => m.lang === "sw" && m.text.includes("inatakiwa leo"))).toBe(true);
    expect(msgs.filter((m) => m.channel === "sms").every((m) => !/[“”—]/.test(m.text))).toBe(true);
  });
  it("sends nothing in quiet hours", () => {
    expect(dueMessages(s, { now: fromNairobi(2027, 1, 12, 22, 30), windowMinutes: 15, sent: new Set(), link })).toHaveLength(0);
  });
  it("is idempotent across runs", async () => {
    const sent = new Set<string>();
    const now = fromNairobi(2027, 1, 12, 9, 10);
    const first = dueMessages(s, { now, sent, link });
    const r = await dispatch(first, {}, sent);
    expect(r.dryRun).toBe(first.length);
    expect(dueMessages(s, { now, sent, link })).toHaveLength(0);
  });
  it("skips paid-up families", () => {
    const msgs = dueMessages(s, { now: fromNairobi(2027, 1, 12, 9, 10), sent: new Set(), link });
    const paid = s.families.filter((f) => familyBalance(s, f.id) <= 0).map((f) => f.id);
    expect(msgs.some((m) => paid.includes(m.familyId))).toBe(false);
    expect(toNairobi(fromNairobi(2027, 1, 12, 9, 10)).hh).toBe(9);
  });
  it("uses a real sender when configured and counts failures", async () => {
    const msgs = dueMessages(s, { now: fromNairobi(2027, 1, 12, 9, 10), sent: new Set(), link }).slice(0, 4);
    let n = 0;
    const r = await dispatch(msgs, { sms: { send: async () => ({ ok: n++ % 2 === 0 }) }, whatsapp: { send: async () => ({ ok: true }) } }, new Set());
    expect(r.sent + r.failed).toBe(4);
  });
});
