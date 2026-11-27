import { createRateLimiter, handleInbound, hashMsisdn, normalizeMsisdn } from "@shulife/core";
import { demoOrgId, getPool, school, withDb } from "@/lib/db";
import { familyBalance, termPosition } from "@shulife/demo";
import { signParentToken } from "@/lib/session";

export { createRateLimiter, handleInbound, hashMsisdn, normalizeMsisdn };

/** The school a WhatsApp sender belongs to: the one where their number is a guardian's. */
async function schoolForSender(phoneHash: string) {
  if (!getPool()) return school();
  const org = await withDb(async (c) => (await c.query(`select org_id from guardians where phone_hash = $1 and archived_at is null order by created_at limit 1`, [phoneHash])).rows[0]?.org_id ?? null);
  return school(org ?? (await demoOrgId()));
}

export async function familyBalanceSafe(phoneHash: string) {
  const s = await schoolForSender(phoneHash);
  const term = s.terms.find((t) => t.status === "open")!;
  return {
    school: { name: s.org.name, officePhone: s.org.officePhone, term: term.name },
    families: s.families.map((f) => ({
      familyId: f.id,
      guardianPhoneHashes: s.guardians.filter((g) => g.familyId === f.id).map((g) => g.phoneHash),
      preferredLang: f.lang,
      children: s.learners.filter((l) => l.familyId === f.id).map((l) => ({ name: l.firstName, balance: Math.max(0, termPosition(s, l.id).balance) })),
      payLink: `/p/${signParentToken(f.id)}/`,
      _balance: familyBalance(s, f.id),
    })),
  };
}
