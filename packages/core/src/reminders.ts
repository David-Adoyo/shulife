import type { Cents } from "./money";
import { addDays, fromNairobi, isoWeekKey, nairobiDate, toNairobi } from "./time";

/**
 * Reminder engine (§7.7). Builds a family's reminder schedule for a term and
 * applies quiet hours, Sunday mornings, public holidays and the weekly cap.
 * Fee reminders stop when the balance is cleared or a plan is active (the plan
 * sends its own reminders). Every scheduled item is re-checked at send time
 * with `stillDue`, so a payment made after scheduling always stops the message.
 */

export type ReminderTemplate = "statement_published" | "pre_opening" | "due_today" | "due_plus_7" | "due_plus_21" | "clearance_notice" | "plan_instalment";
export type Tone = "gentle" | "standard" | "firm_but_polite";

export type ReminderConfig = {
  quietStart: string; // "21:00"
  quietEnd: string; // "07:00"
  maxPerWeek: number;
  holidays: string[]; // ISO dates in Nairobi
  sendHour?: number; // default 9 (local)
  tone?: Tone;
  /** Offsets in days; defaults follow §7.7 and can be edited per school. */
  offsets?: Partial<Record<"statement" | "preOpening" | "duePlus7" | "duePlus21" | "clearance", number>>;
};

export type FamilyState = {
  familyId: string;
  balance: Cents;
  hasActivePlan: boolean;
  instalments?: { n: number; totalN: number; dueDate: string; amount: Cents; paid: boolean }[];
  clearanceEvents?: { id: string; name: string; date: string; cleared: boolean }[];
};

export type Scheduled = { key: string; template: ReminderTemplate; sendAt: Date; vars: Record<string, string | number> };
export type Skipped = { key: string; template: ReminderTemplate; reason: string };

const hm = (s: string) => {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
};

/** Moves a send time out of quiet hours, Sunday mornings and holidays. */
export function adjustSendTime(at: Date, cfg: Pick<ReminderConfig, "quietStart" | "quietEnd" | "holidays">): Date {
  let t = at;
  for (let guard = 0; guard < 14; guard++) {
    const p = toNairobi(t);
    const mins = p.hh * 60 + p.mm;
    const qs = hm(cfg.quietStart);
    const qe = hm(cfg.quietEnd);
    const iso = `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
    if (cfg.holidays.includes(iso)) {
      const next = addDays(fromNairobi(p.y, p.m, p.d), 1);
      const n = toNairobi(next);
      t = fromNairobi(n.y, n.m, n.d, 9, 0);
      continue;
    }
    const inQuiet = qs > qe ? mins >= qs || mins < qe : mins >= qs && mins < qe;
    if (inQuiet) {
      const base = mins >= qs && qs > qe ? addDays(fromNairobi(p.y, p.m, p.d), 1) : fromNairobi(p.y, p.m, p.d);
      const n = toNairobi(base);
      t = fromNairobi(n.y, n.m, n.d, Math.floor(qe / 60), qe % 60);
      continue;
    }
    if (p.dow === 0 && p.hh < 12) {
      t = fromNairobi(p.y, p.m, p.d, 12, 0);
      continue;
    }
    return t;
  }
  return t;
}

export function planReminders(input: {
  term: { id: string; openingDate: string; dueDate: string };
  family: FamilyState;
  config: ReminderConfig;
  now: Date;
  /** Already sent (for idempotency and the weekly cap). */
  sent?: { key: string; at: Date }[];
}): { scheduled: Scheduled[]; skipped: Skipped[] } {
  const { term, family: f, config: cfg, now } = input;
  const o = { statement: -14, preOpening: -3, duePlus7: 7, duePlus21: 21, clearance: -7, ...cfg.offsets };
  const hour = cfg.sendHour ?? 9;
  const at = (iso: string, days: number) => addDays(nairobiDate(iso, hour), days);
  const tone = cfg.tone ?? "standard";

  const candidates: Scheduled[] = [
    { key: `${term.id}:statement`, template: "statement_published", sendAt: at(term.openingDate, o.statement), vars: {} },
    { key: `${term.id}:pre_opening`, template: "pre_opening", sendAt: at(term.openingDate, o.preOpening), vars: {} },
    { key: `${term.id}:due_today`, template: "due_today", sendAt: at(term.dueDate, 0), vars: {} },
    { key: `${term.id}:due_plus_7`, template: "due_plus_7", sendAt: at(term.dueDate, o.duePlus7), vars: {} },
  ];
  // Gentle schools stop after the +7 follow-up; others send a firm-but-polite +21.
  if (tone !== "gentle") candidates.push({ key: `${term.id}:due_plus_21`, template: "due_plus_21", sendAt: at(term.dueDate, o.duePlus21), vars: {} });
  for (const ev of f.clearanceEvents ?? []) candidates.push({ key: `${term.id}:clearance:${ev.id}`, template: "clearance_notice", sendAt: at(ev.date, o.clearance), vars: { event: ev.name, eventId: ev.id } });
  for (const ins of f.instalments ?? []) {
    candidates.push({ key: `${term.id}:plan:${ins.n}:-2`, template: "plan_instalment", sendAt: at(ins.dueDate, -2), vars: { n: ins.n, total_n: ins.totalN } });
    candidates.push({ key: `${term.id}:plan:${ins.n}:0`, template: "plan_instalment", sendAt: at(ins.dueDate, 0), vars: { n: ins.n, total_n: ins.totalN } });
  }

  const scheduled: Scheduled[] = [];
  const skipped: Skipped[] = [];
  const sentKeys = new Set((input.sent ?? []).map((s) => s.key));
  const perWeek = new Map<string, number>();
  for (const s of input.sent ?? []) perWeek.set(isoWeekKey(s.at), (perWeek.get(isoWeekKey(s.at)) ?? 0) + 1);

  for (const c of candidates.map((x) => ({ ...x, sendAt: adjustSendTime(x.sendAt, cfg) })).sort((a, b) => a.sendAt.getTime() - b.sendAt.getTime())) {
    if (sentKeys.has(c.key)) {
      skipped.push({ key: c.key, template: c.template, reason: "already sent" });
      continue;
    }
    const why = stillDue(c, f);
    if (why !== true) {
      skipped.push({ key: c.key, template: c.template, reason: why });
      continue;
    }
    if (c.sendAt.getTime() < now.getTime()) {
      skipped.push({ key: c.key, template: c.template, reason: "in the past" });
      continue;
    }
    const wk = isoWeekKey(c.sendAt);
    if ((perWeek.get(wk) ?? 0) >= cfg.maxPerWeek) {
      skipped.push({ key: c.key, template: c.template, reason: "weekly cap reached" });
      continue;
    }
    perWeek.set(wk, (perWeek.get(wk) ?? 0) + 1);
    scheduled.push(c);
  }
  return { scheduled, skipped };
}

/** Re-checked at send time. Returns `true` or the reason the message must not go. */
export function stillDue(m: Pick<Scheduled, "template" | "vars">, f: FamilyState): true | string {
  if (m.template === "plan_instalment") {
    if (!f.hasActivePlan) return "no active plan";
    const ins = f.instalments?.find((i) => i.n === Number(m.vars.n));
    return ins && !ins.paid ? true : "instalment paid";
  }
  if (f.balance <= 0) return "balance cleared";
  if (m.template === "clearance_notice") {
    const ev = f.clearanceEvents?.find((e) => e.id === m.vars.eventId);
    return ev && !ev.cleared ? true : "already cleared";
  }
  if (m.template !== "statement_published" && f.hasActivePlan) return "on an active plan";
  return true;
}
