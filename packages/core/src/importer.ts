import { normalizeMsisdn } from "./phone";
import { normaliseAdmission } from "./reference";
import { KENYA_GRADES } from "./term";

/**
 * Learner import (§11 step 3): CSV/Excel rows → validated learners, guardians and
 * families. Families are grouped by shared guardian phone, for the school to confirm.
 */

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((x) => x.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim() !== "")) rows.push(row);
  return rows;
}

export type Field = "admission" | "firstName" | "lastName" | "otherNames" | "grade" | "stream" | "boarding" | "guardianName" | "guardianPhone" | "guardian2Name" | "guardian2Phone" | "email" | "route" | "openingBalance" | "lunch";

const ALIASES: Record<Field, string[]> = {
  admission: ["admission", "admission no", "admission number", "adm", "adm no", "adm no.", "admno", "reg no", "upi"],
  firstName: ["first name", "firstname", "first", "given name"],
  lastName: ["last name", "surname", "lastname", "family name"],
  otherNames: ["other names", "middle name", "other name"],
  grade: ["grade", "class", "level", "form"],
  stream: ["stream", "section", "house"],
  boarding: ["boarding", "day/boarder", "boarder", "residence"],
  guardianName: ["parent name", "guardian name", "parent", "guardian", "father/mother", "parent/guardian"],
  guardianPhone: ["phone", "parent phone", "guardian phone", "phone number", "mobile", "tel", "contact"],
  guardian2Name: ["parent 2 name", "guardian 2 name", "second parent", "mother name"],
  guardian2Phone: ["phone 2", "parent 2 phone", "guardian 2 phone", "alternative phone", "mother phone"],
  email: ["email", "parent email", "e-mail"],
  route: ["route", "transport route", "bus route"],
  openingBalance: ["balance", "opening balance", "balance b/f", "bal b/f", "arrears"],
  lunch: ["lunch", "takes lunch", "meals"],
};

export function mapColumns(header: string[]): Partial<Record<Field, number>> {
  const map: Partial<Record<Field, number>> = {};
  header.forEach((h, i) => {
    const key = h.trim().toLowerCase().replace(/\s+/g, " ");
    for (const [field, names] of Object.entries(ALIASES) as [Field, string[]][]) {
      if (map[field] === undefined && names.includes(key)) map[field] = i;
    }
  });
  return map;
}

export function normaliseGrade(v: string): string | null {
  const s = v.trim().toUpperCase().replace(/\s+/g, " ");
  const pp = s.match(/^(?:PP|PRE-?PRIMARY|PREPRIMARY)\s*([12])$/);
  if (pp) return `PP${pp[1]}`;
  const g = s.match(/^(?:GRADE|G|CLASS|STD)?\s*(\d{1,2})$/);
  if (g && +g[1] >= 1 && +g[1] <= 12) return `G${+g[1]}`;
  return null;
}

export type ImportRow = {
  row: number;
  admission: string;
  firstName: string;
  lastName: string;
  otherNames: string;
  gradeCode: string;
  stream: string;
  boarding: "day" | "boarder";
  guardians: { name: string; phone: string | null }[];
  email: string;
  route: string;
  openingBalance: number | null; // cents
  lunch: boolean;
};

export type ImportIssue = { row: number; field: Field | "row"; message: string; severity: "error" | "warning" };

export function validateImport(rows: string[][], map: Partial<Record<Field, number>>) {
  const issues: ImportIssue[] = [];
  const good: ImportRow[] = [];
  const seen = new Map<string, number>();
  const get = (r: string[], f: Field) => (map[f] !== undefined ? (r[map[f]!] ?? "").trim() : "");
  for (const f of ["admission", "firstName", "grade"] as Field[]) if (map[f] === undefined) issues.push({ row: 0, field: f, message: `Choose which column holds “${f}”`, severity: "error" });
  if (issues.length) return { rows: good, issues };

  rows.forEach((r, i) => {
    const rowNo = i + 2; // header is row 1
    const errs: ImportIssue[] = [];
    const adm = normaliseAdmission(get(r, "admission"));
    if (!adm) errs.push({ row: rowNo, field: "admission", message: "Admission number is missing", severity: "error" });
    else if (seen.has(adm)) errs.push({ row: rowNo, field: "admission", message: `Admission number ${adm} is also on row ${seen.get(adm)}`, severity: "error" });
    let first = get(r, "firstName");
    let last = get(r, "lastName");
    if (first && !last && first.includes(" ")) {
      const parts = first.split(/\s+/);
      first = parts[0];
      last = parts.slice(1).join(" ");
    }
    if (!first) errs.push({ row: rowNo, field: "firstName", message: "Name is missing", severity: "error" });
    const grade = normaliseGrade(get(r, "grade"));
    if (!grade || !(KENYA_GRADES as readonly string[]).includes(grade)) errs.push({ row: rowNo, field: "grade", message: `“${get(r, "grade")}” isn’t a grade we recognise`, severity: "error" });
    const guardians: { name: string; phone: string | null }[] = [];
    for (const [nf, pf] of [["guardianName", "guardianPhone"], ["guardian2Name", "guardian2Phone"]] as [Field, Field][]) {
      const rawPhone = get(r, pf);
      const phone = normalizeMsisdn(rawPhone);
      if (rawPhone && !phone) errs.push({ row: rowNo, field: pf, message: `“${rawPhone}” doesn’t look like a Kenyan phone number`, severity: "warning" });
      if (get(r, nf) || phone) guardians.push({ name: get(r, nf), phone });
    }
    if (!guardians.some((g) => g.phone)) errs.push({ row: rowNo, field: "guardianPhone", message: "No guardian phone — this family can’t get receipts or reminders", severity: "warning" });
    const balRaw = get(r, "openingBalance").replace(/[^\d.-]/g, "");
    const openingBalance = balRaw ? Math.round(Number(balRaw) * 100) : null;
    const b = get(r, "boarding").toLowerCase();
    issues.push(...errs);
    if (adm) seen.set(adm, rowNo);
    if (errs.some((e) => e.severity === "error")) return;
    good.push({ row: rowNo, admission: adm, firstName: first, lastName: last, otherNames: get(r, "otherNames"), gradeCode: grade!, stream: get(r, "stream"), boarding: b.startsWith("b") ? "boarder" : "day", guardians, email: get(r, "email"), route: get(r, "route"), openingBalance, lunch: /^(y|yes|true|1|ndiyo)$/i.test(get(r, "lunch")) });
  });
  return { rows: good, issues };
}

/** Group learners into families by shared guardian phone (union–find). */
export function groupFamilies(rows: ImportRow[], familyPrefix = "FAM") {
  const parent = rows.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const byPhone = new Map<string, number>();
  rows.forEach((r, i) => {
    for (const g of r.guardians) {
      if (!g.phone) continue;
      const j = byPhone.get(g.phone);
      if (j === undefined) byPhone.set(g.phone, i);
      else parent[find(i)] = find(j);
    }
  });
  const groups = new Map<number, ImportRow[]>();
  rows.forEach((r, i) => groups.set(find(i), [...(groups.get(find(i)) ?? []), r]));
  return [...groups.values()].map((members) => {
    const eldest = [...members].sort((a, b) => a.admission.localeCompare(b.admission, undefined, { numeric: true }))[0];
    const surname = eldest.lastName || eldest.guardians[0]?.name.split(" ").slice(-1)[0] || eldest.firstName;
    const guardians = new Map<string, { name: string; phone: string | null }>();
    for (const m of members) for (const g of m.guardians) guardians.set(g.phone ?? g.name, g);
    return { code: `${familyPrefix}-${eldest.admission}`, displayName: `The ${surname} family`, learners: members, guardians: [...guardians.values()], needsConfirmation: members.length > 1 && new Set(members.map((m) => m.lastName)).size > 1 };
  });
}
