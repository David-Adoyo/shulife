import { createRateLimiter, handleInbound, hashMsisdn, normalizeMsisdn } from "@shulife/core";
import { familyBalance, getSchool, termPosition } from "@shulife/demo";
import { signParentToken } from "@/lib/session";

export { createRateLimiter, handleInbound, hashMsisdn, normalizeMsisdn };

export function familyBalanceSafe() {
  const s = getSchool();
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
