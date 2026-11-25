import type { Cents } from "./money";
import { parseReference } from "./reference";
import { levenshtein, nameSimilarity } from "./similarity";

/**
 * Matching engine (§7.3). Scores candidate families from 0 to 100 with reasons.
 * A payment is applied automatically only when the best family scores at least
 * `autoThreshold` AND leads the next family by at least `minMargin`.
 */

export type MatchLearner = {
  id: string;
  familyId: string;
  admissionNumber: string;
  aliases?: string[];
  firstName: string;
  lastName: string;
  otherNames?: string;
  gradeCode: string;
  status: "active" | "suspended" | "left" | "graduated" | "prospective";
};

export type MatchFamily = {
  id: string;
  code: string; // digits only, e.g. "2041" for FAM-2041
  guardianNames: string[];
  guardianPhoneHashes: string[];
  balance: Cents;
  instalmentAmounts?: Cents[];
};

export type PayerLink = { phoneHash: string; familyId: string; source: "guardian_record" | "learned" | "import" };

export type MatchPayment = { billRef: string | null; phoneHash?: string | null; payerName?: string | null; amount: Cents };

export type SignalKind = "admission_exact" | "family_code" | "guardian_phone" | "learned_phone" | "name_in_reference" | "payer_name" | "amount" | "admission_typo";

export type Signal = { kind: SignalKind; score: number; reason: string; learnerId?: string };

export type Candidate = {
  familyId: string;
  /** Set when a specific learner was identified (admission number, name). */
  learnerId: string | null;
  score: number;
  signals: Signal[];
  reasons: string[];
  /** True when the only strong evidence cannot be auto-applied (typo, a learner who left). */
  blocked: boolean;
};

export type MatchResult = {
  decision: "auto" | "review" | "unmatched";
  best: Candidate | null;
  /** Top three for the review queue's Match Card. */
  suggestions: Candidate[];
};

export type MatchOptions = { autoThreshold?: number; minMargin?: number; familyPrefix?: string };

const SCORE = {
  admission_exact: 100,
  family_code: 100,
  guardian_phone: 90,
  learned_phone: 85,
  name_in_reference_max: 70,
  name_no_grade_max: 50,
  payer_name_max: 50,
  amount_max: 25,
  admission_typo: 60,
};

export function matchPayment(
  payment: MatchPayment,
  dir: { learners: MatchLearner[]; families: MatchFamily[]; payerLinks?: PayerLink[] },
  opts: MatchOptions = {},
): MatchResult {
  const autoThreshold = opts.autoThreshold ?? 90;
  const minMargin = opts.minMargin ?? 15;
  const ref = parseReference(payment.billRef, opts.familyPrefix);
  const signals = new Map<string, Signal[]>();
  const add = (familyId: string, s: Signal) => {
    const list = signals.get(familyId) ?? [];
    // keep only the strongest signal of each kind per family
    const existing = list.findIndex((x) => x.kind === s.kind);
    if (existing === -1) list.push(s);
    else if (list[existing].score < s.score) list[existing] = s;
    signals.set(familyId, list);
  };
  const learnersByAdm = new Map<string, MatchLearner[]>();
  for (const l of dir.learners) {
    for (const a of [l.admissionNumber, ...(l.aliases ?? [])]) {
      const key = a.toUpperCase().replace(/[^0-9A-Z]/g, "").replace(/^0+(?=\d)/, "");
      learnersByAdm.set(key, [...(learnersByAdm.get(key) ?? []), l]);
    }
  }

  // 1. Exact admission number (aliases count)
  const exactHit = new Set<string>();
  for (const a of ref.admissionNumbers) {
    for (const l of learnersByAdm.get(a) ?? []) {
      exactHit.add(a);
      add(l.familyId, { kind: "admission_exact", score: SCORE.admission_exact, reason: `Admission number ${l.admissionNumber} (${l.firstName} ${l.lastName})`, learnerId: l.id });
    }
  }

  // 2. Exact family code
  if (ref.familyCode) {
    const f = dir.families.find((x) => x.code === ref.familyCode);
    if (f) add(f.id, { kind: "family_code", score: SCORE.family_code, reason: `Family code ${ref.familyCode}` });
  }

  // 3 & 4. Registered guardian phone, learned phone
  if (payment.phoneHash) {
    for (const f of dir.families) {
      if (f.guardianPhoneHashes.includes(payment.phoneHash)) add(f.id, { kind: "guardian_phone", score: SCORE.guardian_phone, reason: "Paid from a registered guardian phone" });
    }
    for (const link of dir.payerLinks ?? []) {
      if (link.phoneHash !== payment.phoneHash) continue;
      const kind = link.source === "learned" ? "learned_phone" : "guardian_phone";
      add(link.familyId, { kind, score: kind === "learned_phone" ? SCORE.learned_phone : SCORE.guardian_phone, reason: kind === "learned_phone" ? "Phone learned from an earlier payment" : "Paid from a registered guardian phone" });
    }
  }

  // 5. Name in the reference (within the grade if one was mentioned)
  if (ref.nameTokens.length) {
    const pool = ref.gradeCode ? dir.learners.filter((l) => l.gradeCode === ref.gradeCode) : dir.learners;
    const max = ref.gradeCode ? SCORE.name_in_reference_max : SCORE.name_no_grade_max;
    for (const l of pool) {
      const full = [l.firstName, l.lastName, l.otherNames ?? ""].join(" ");
      const sim = nameSimilarity(ref.nameTokens, full);
      if (sim >= 0.88) {
        add(l.familyId, { kind: "name_in_reference", score: Math.round(max * Math.min(1, (sim - 0.8) / 0.2)), reason: `Name “${ref.nameTokens.join(" ")}” is like ${l.firstName} ${l.lastName}${ref.gradeCode ? ` in ${ref.gradeCode}` : ""}`, learnerId: l.id });
      }
    }
  }

  // 6. Payer name similarity to guardian names
  if (payment.payerName) {
    for (const f of dir.families) {
      const best = Math.max(0, ...f.guardianNames.map((g) => nameSimilarity(payment.payerName!, g)));
      if (best >= 0.85) add(f.id, { kind: "payer_name", score: Math.round(SCORE.payer_name_max * Math.min(1, (best - 0.75) / 0.25)), reason: `Payer name ${payment.payerName} is like a guardian’s name` });
    }
  }

  // 7. Amount heuristic — only strengthens families that already have another signal
  for (const [familyId] of signals) {
    const f = dir.families.find((x) => x.id === familyId);
    if (!f) continue;
    if (f.balance > 0 && payment.amount === f.balance) add(familyId, { kind: "amount", score: SCORE.amount_max, reason: "Amount equals the family balance" });
    else if (f.instalmentAmounts?.includes(payment.amount)) add(familyId, { kind: "amount", score: 20, reason: "Amount equals a plan instalment" });
  }

  // 8. Admission number typo (one edit away, 4+ digits) — never auto-applied alone
  for (const a of ref.admissionNumbers) {
    if (a.length < 4 || exactHit.has(a)) continue;
    for (const [key, ls] of learnersByAdm) {
      if (key.length >= 4 && Math.abs(key.length - a.length) <= 1 && levenshtein(key, a) === 1) {
        for (const l of ls) add(l.familyId, { kind: "admission_typo", score: SCORE.admission_typo, reason: `Admission number ${a} is one digit from ${l.admissionNumber}`, learnerId: l.id });
      }
    }
  }

  const learnerById = new Map(dir.learners.map((l) => [l.id, l]));
  const candidates: Candidate[] = [...signals.entries()].map(([familyId, list]) => {
    const sorted = [...list].sort((a, b) => b.score - a.score);
    const top = sorted[0];
    const rest = sorted.slice(1).reduce((s, x) => s + x.score, 0);
    const score = Math.min(100, Math.round(top.score + rest * 0.3));
    const learnerSignal = sorted.find((s) => s.learnerId && (s.kind === "admission_exact" || s.kind === "name_in_reference" || s.kind === "admission_typo"));
    const learner = learnerSignal?.learnerId ? learnerById.get(learnerSignal.learnerId) : undefined;
    const strong = sorted.filter((s) => s.score >= 85 && s.kind !== "admission_typo");
    const inactive = learner && learner.status !== "active" && learner.status !== "suspended";
    const blocked = strong.length === 0 || Boolean(inactive && !sorted.some((s) => s.kind === "family_code" || s.kind === "guardian_phone"));
    const reasons = sorted.map((s) => s.reason);
    if (inactive) reasons.push(`${learner!.firstName} ${learner!.lastName} has ${learner!.status === "left" ? "left the school" : learner!.status}`);
    return { familyId, learnerId: learner?.id ?? null, score, signals: sorted, reasons, blocked };
  });

  candidates.sort((a, b) => b.score - a.score || a.familyId.localeCompare(b.familyId));
  const best = candidates[0] ?? null;
  const second = candidates[1];
  if (!best) return { decision: "unmatched", best: null, suggestions: [] };
  const margin = best.score - (second?.score ?? 0);
  const auto = best.score >= autoThreshold && margin >= minMargin && !best.blocked;
  return { decision: auto ? "auto" : "review", best, suggestions: candidates.slice(0, 3) };
}
