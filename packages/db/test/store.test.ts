import { afterAll, beforeAll, describe, expect, it } from "vitest";
import pg from "pg";
import { createSchool, dashboard, familyBalance, ingest, resolveReview, reviewQueue, DEMO_TODAY, type Payment, type School } from "@shulife/demo";
import { loadSchool, persistIngest, persistResolution, saveSchool } from "../src";

const url = process.env.DATABASE_URL;
const d = url ? describe : describe.skip;

d("Postgres persistence", () => {
  let client: pg.Client;
  let orgId: string;
  let original: School;
  beforeAll(async () => {
    client = new pg.Client({ connectionString: url });
    await client.connect();
    original = createSchool();
    orgId = await saveSchool(client, original);
  });
  afterAll(async () => client?.end());

  it("round-trips the whole school", async () => {
    const s = await loadSchool(client, orgId, { today: DEMO_TODAY });
    expect(s.learners).toHaveLength(original.learners.length);
    expect(s.families).toHaveLength(original.families.length);
    expect(s.payments).toHaveLength(original.payments.length);
    expect(s.ledger.reduce((a, e) => a + e.amount, 0)).toBe(original.ledger.reduce((a, e) => a + e.amount, 0));
    const outstanding = (x: School) => [...x.lines.values()].reduce((a, l) => a + l.outstanding, 0);
    expect(outstanding(s)).toBe(outstanding(original));
    expect(reviewQueue(s)).toHaveLength(reviewQueue(original).length);
    const a = dashboard(original);
    const b = dashboard(s);
    expect([b.pct, b.collected, b.billed, b.autoMatchRate]).toEqual([a.pct, a.collected, a.billed, a.autoMatchRate]);
    // every family's balance survives the round trip
    const byCode = new Map(original.families.map((f) => [f.code, familyBalance(original, f.id)]));
    for (const f of s.families) expect(familyBalance(s, f.id)).toBe(byCode.get(f.code));
  });

  it("writes new payments through, rejects duplicates, and reloads them", async () => {
    const s = await loadSchool(client, orgId, { today: DEMO_TODAY });
    const fam = s.families.find((f) => f.code === "FAM-2041")!;
    const kid = s.learners.find((l) => l.familyId === fam.id)!;
    const before = familyBalance(s, fam.id);
    const mk = (): Payment => ({ id: "t-new-1", providerRef: "TEST0001", campusId: fam.campusId, amount: 500_000, billRef: `ADM ${kid.admissionNumber}`, phoneLast3: null, phoneHash: null, payerName: null, paidAt: DEMO_TODAY, channel: "c2b", matchStatus: "unmatched", matchKind: "—", confidence: null, familyId: null, learnerId: null, rule: null, split: [], credit: 0, receiptNo: null, verifyCode: null, termId: s.terms.find((t) => t.status === "open")!.id, suggestions: [] });
    const n = s.ledger.length;
    const p = mk();
    expect(ingest(s, p)).toBe("auto");
    expect(await persistIngest(client, s, p, s.ledger.slice(n))).toBe("saved");
    expect(await persistIngest(client, s, mk(), [])).toBe("duplicate");
    const again = await loadSchool(client, orgId, { today: DEMO_TODAY });
    const fam2 = again.families.find((f) => f.code === "FAM-2041")!;
    expect(familyBalance(again, fam2.id)).toBe(before - 500_000);
    expect(again.payments.find((x) => x.providerRef === "TEST0001")?.receiptNo).toMatch(/^RCT-/);
  });

  it("persists review decisions and the learned phone", async () => {
    const s = await loadSchool(client, orgId, { today: DEMO_TODAY });
    const card = reviewQueue(s).find((p) => p.suggestions.length)!;
    const n = s.ledger.length;
    resolveReview(s, card.id, { familyId: card.suggestions[0].familyId });
    await persistResolution(client, s, card, s.ledger.slice(n));
    const again = await loadSchool(client, orgId, { today: DEMO_TODAY });
    expect(reviewQueue(again)).toHaveLength(reviewQueue(s).length);
    expect(again.payments.find((p) => p.id === card.id)?.matchKind).toBe("Reviewed");
    if (card.phoneHash) expect(again.payerLinks.some((l) => l.phoneHash === card.phoneHash && l.source === "learned")).toBe(true);
  });

  it("the database enforces history and idempotency on its own", async () => {
    await expect(client.query(`update ledger_entries set amount_cents = 0 where id = (select id from ledger_entries limit 1)`)).rejects.toThrow(/append-only/);
    await expect(client.query(`insert into payments (org_id, provider_ref, amount_cents, paid_at, channel) values ($1, 'TEST0001', 100, now(), 'c2b')`, [orgId])).rejects.toThrow(/duplicate key/);
  });
});
