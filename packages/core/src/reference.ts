/**
 * A tolerant parser for what parents type in the M-Pesa account field (§3.1 B2):
 * `ADM 1234`, `adm-01234`, `1234 grade 3`, `JOHN K`, `FAM-2041`, or nothing at all.
 */

export type ParsedReference = {
  raw: string;
  /** Candidate admission numbers, normalised (no prefix, no leading zeros). */
  admissionNumbers: string[];
  /** Family code digits if a family code was used, e.g. `2041` for `FAM-2041`. */
  familyCode: string | null;
  /** Grade code if a grade/class was mentioned: `PP1`, `PP2`, `G1`…`G12`. */
  gradeCode: string | null;
  /** Upper-case name-like words, e.g. `["KAMAU"]`. */
  nameTokens: string[];
};

const STOPWORDS = new Set([
  "ADM", "ADMN", "ADMNO", "NO", "NUMBER", "FEES", "FEE", "SCHOOL", "SCH", "GRADE", "GRD", "CLASS", "FORM", "TERM", "FOR", "PAYMENT", "PAY",
  "BAL", "BALANCE", "TUITION", "LUNCH", "TRANSPORT", "BUS", "BOARDING", "THE", "AND", "OF", "TO", "ACC", "ACCOUNT", "REF", "KIDS", "CHILD",
  "CHILDREN", "PP", "FAM", "FAMILY", "STD", "STANDARD", "ONE", "TWO", "THREE", "TRIP", "ADA", "KARO", "MTOTO",
]);

export function normaliseAdmission(v: string): string {
  const d = v.toUpperCase().replace(/^(ADM|ADMN|NO)/, "").replace(/[^0-9A-Z]/g, "");
  return d.replace(/^0+(?=\d)/, "");
}

function gradeFrom(s: string): string | null {
  const pp = s.match(/\bPP\s*-?\s*([12])\b/);
  if (pp) return `PP${pp[1]}`;
  const g = s.match(/\b(?:GRADE|GRD|CLASS|STD|STANDARD)\s*-?\s*(\d{1,2})\b/) ?? s.match(/\bG\s?(\d{1,2})\b/);
  if (g && +g[1] >= 1 && +g[1] <= 12) return `G${+g[1]}`;
  const f = s.match(/\bFORM\s*([1-4])\b/);
  if (f) return `G${+f[1] + 8}`; // legacy Form 1 ≈ Grade 9 for display mapping
  return null;
}

export function parseReference(raw: string | null | undefined, familyPrefix = "FAM"): ParsedReference {
  const original = (raw ?? "").trim();
  let s = original.toUpperCase().replace(/[_./\\#:]+/g, " ");

  let familyCode: string | null = null;
  const fam = s.match(new RegExp(`\\b${familyPrefix}\\s*-?\\s*0*(\\d+)\\b`));
  if (fam) {
    familyCode = fam[1];
    s = s.replace(fam[0], " ");
  }

  const gradeCode = gradeFrom(s);
  // Remove the grade mention so its number is not mistaken for an admission number.
  const sNoGrade = s
    .replace(/\bPP\s*-?\s*[12]\b/g, " ")
    .replace(/\b(?:GRADE|GRD|CLASS|STD|STANDARD|FORM)\s*-?\s*\d{1,2}\b/g, " ")
    .replace(/\bG\s?\d{1,2}\b/g, " ");

  const admissionNumbers: string[] = [];
  // Joined forms like ADM1234 / ADM-01234 / NO.1234
  for (const m of sNoGrade.matchAll(/\b(?:ADMN?|NO)\s*-?\s*(\d{2,7}[A-Z]?)\b/g)) admissionNumbers.push(normaliseAdmission(m[1]));
  for (const m of sNoGrade.matchAll(/\b(\d{2,7}[A-Z]?)\b/g)) admissionNumbers.push(normaliseAdmission(m[1]));
  // Dashed numbers like 2041-B
  for (const m of sNoGrade.matchAll(/\b(\d{2,7})\s*-\s*([A-Z])\b/g)) admissionNumbers.push(normaliseAdmission(m[1] + m[2]));

  const nameTokens = sNoGrade
    .split(/[^A-Z']+/)
    .map((t) => t.replace(/'/g, ""))
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));

  return { raw: original, admissionNumbers: [...new Set(admissionNumbers)].filter(Boolean), familyCode, gradeCode, nameTokens: [...new Set(nameTokens)] };
}
