import { formatDate, formatKes, planReminders, render, toSmsSafe, type ReminderTemplate } from "@shulife/core";
import { familyBalance } from "./pipeline";
import { currentTerm, termPosition } from "./queries";
import type { School } from "./types";

/**
 * Reminder job (§7.7, §12). Run every 15 minutes: finds reminders whose send time
 * has arrived, renders them in each guardian's language and queues one message per
 * paying guardian. Idempotent: a key that was already sent is never sent again.
 * Messages only ever go to guardians — never to learners.
 */

export type OutboxMessage = {
  key: string; // idempotency key: family + reminder
  familyId: string;
  guardianId: string;
  to: string; // E.164 without +
  channel: "whatsapp" | "sms";
  template: ReminderTemplate;
  lang: "en" | "sw";
  text: string;
};

const TEMPLATE_FOR: Record<ReminderTemplate, Parameters<typeof render>[0]> = {
  statement_published: "statement_published",
  pre_opening: "pre_opening",
  due_today: "due_today",
  due_plus_7: "due_plus_7",
  due_plus_21: "due_plus_21",
  clearance_notice: "clearance_notice",
  plan_instalment: "plan_instalment",
};

export function dueMessages(s: School, opts: { now: Date; windowMinutes?: number; sent: Set<string>; link: (familyId: string) => string }): OutboxMessage[] {
  const term = currentTerm(s);
  const windowStart = opts.now.getTime() - (opts.windowMinutes ?? 15) * 60_000;
  const out: OutboxMessage[] = [];
  const shillings = (c: number) => formatKes(Math.max(0, Math.round(c / 100) * 100), { prefix: false });
  for (const fam of s.families) {
    const kids = s.learners.filter((l) => l.familyId === fam.id && l.status === "active");
    if (!kids.length) continue;
    const plan = s.plans.find((p) => p.familyId === fam.id);
    const balance = familyBalance(s, fam.id);
    const exam = s.events.find((e) => e.kind === "exam");
    const notCleared = exam ? kids.filter((k) => termPosition(s, k.id).paid * 100 < termPosition(s, k.id).billed * s.org.clearancePct) : [];
    const { scheduled } = planReminders({
      term: { id: term.id, openingDate: term.opening, dueDate: term.due },
      family: {
        familyId: fam.id,
        balance,
        hasActivePlan: plan?.status === "active",
        instalments: plan?.instalments.map((i) => ({ n: i.n, totalN: plan.instalments.length, dueDate: i.dueDate, amount: i.amount, paid: i.paid >= i.amount })),
        clearanceEvents: exam ? [{ id: exam.id, name: exam.name, date: exam.date, cleared: notCleared.length === 0 }] : [],
      },
      config: { quietStart: s.org.quietStart, quietEnd: s.org.quietEnd, maxPerWeek: s.org.maxPerWeek, holidays: [] },
      now: new Date(windowStart),
      sent: [...opts.sent].filter((k) => k.startsWith(`${fam.id}|`)).map((k) => ({ key: k.split("|")[1], at: new Date(windowStart) })),
    });
    const payers = s.guardians.filter((g) => g.familyId === fam.id && g.isPayer);
    for (const m of scheduled) {
      if (m.sendAt.getTime() > opts.now.getTime()) continue; // not due yet
      const key = `${fam.id}|${m.key}`;
      if (opts.sent.has(key)) continue;
      for (const g of payers) {
        const lang = g.lang;
        const children = kids.map((k) => k.firstName).join(lang === "sw" ? " na " : " and ");
        const vars: Record<string, string | number> = {
          school: s.org.name,
          term: term.name,
          children,
          total: shillings(balance),
          balance: shillings(balance),
          paybill: s.campuses.find((c) => c.id === fam.campusId)!.paybill,
          adm_or_family: kids.length > 1 ? fam.code : kids[0].admissionNumber,
          link: opts.link(fam.id),
          date: formatDate(new Date(m.template === "plan_instalment" ? plan!.instalments.find((i) => i.n === m.vars.n)!.dueDate : m.template === "pre_opening" ? term.opening : exam?.date ?? term.due)),
          event: String(m.vars.event ?? ""),
          child: notCleared.map((k) => k.firstName).join(" and ") || children,
          deadline: exam ? formatDate(new Date(Date.parse(exam.date) - 86_400_000)) : "",
          n: m.vars.n ?? "",
          total_n: m.vars.total_n ?? "",
          amount: plan && m.vars.n ? shillings(plan.instalments.find((i) => i.n === m.vars.n)!.amount) : "",
        };
        const text = render(TEMPLATE_FOR[m.template], lang, vars);
        const channel = g.whatsapp ? "whatsapp" : "sms";
        out.push({ key, familyId: fam.id, guardianId: g.id, to: `254${g.phone.slice(1)}`, channel, template: m.template, lang, text: channel === "sms" ? toSmsSafe(text).text : text });
      }
    }
  }
  return out;
}

export type Sender = { send(m: OutboxMessage): Promise<{ ok: boolean; providerId?: string }> };

/** Sends queued messages; with no sender configured it records a dry run instead. */
export async function dispatch(messages: OutboxMessage[], senders: { whatsapp?: Sender; sms?: Sender }, sent: Set<string>) {
  const results = { sent: 0, dryRun: 0, failed: 0 };
  for (const m of messages) {
    const sender = senders[m.channel] ?? (m.channel === "whatsapp" ? senders.sms : undefined);
    if (!sender) {
      results.dryRun++;
      sent.add(m.key);
      continue;
    }
    try {
      const r = await sender.send(m);
      if (r.ok) {
        results.sent++;
        sent.add(m.key);
      } else results.failed++;
    } catch {
      results.failed++;
    }
  }
  return results;
}
