import { NextResponse } from "next/server";
import { dashboard, dispatch, dueMessages, type OutboxMessage, type Sender, type School } from "@shulife/demo";
import { createSms, createWhatsApp } from "@shulife/integrations";
import { allOrgIds, getPool, serial, school } from "@/lib/db";
import { signParentToken } from "@/lib/session";
import { compose, directorEmails, sendEmail } from "@/lib/email";

const kes = (cents: number) => `KSh ${Math.round(cents / 100).toLocaleString("en-KE")}`;

/** Morning summary for each director: where the term stands and what needs attention. */
async function directorSummary(s: School, org: string, origin: string) {
  const to = await directorEmails(org);
  if (!to.length) return { summary: "no directors with email" };
  const d = dashboard(s);
  const res = await sendEmail(
    compose("director_summary", to, `${s.org.name}: ${d.pct}% collected`, {
      heading: `${d.term.name}: ${d.pct}% of fees collected`,
      intro: `Here’s where ${s.org.name} stands this morning.`,
      rows: [
        ["Collected this term", kes(d.collected)],
        ["Still outstanding", kes(d.outstanding)],
        ["Paid yesterday and today", `${d.paymentsToday} payments, ${kes(d.collectedToday)}`],
        ["Matched automatically", `${d.autoMatchRate}%`],
        ["Waiting in the review queue", String(d.attention.review)],
        ["Cash and cheques not banked", d.attention.unbanked ? `${d.attention.unbanked} (${kes(d.attention.unbankedAmount)})` : "None"],
        ["Families on payment plans", String(d.planCount)],
      ],
      button: { label: "Open the dashboard", href: `${origin}/app/` },
      footer: "You get this because you’re a director on Shulife. Sent once a day.",
    }),
  );
  return { summary: res.ok ? `sent to ${to.length}` : `not sent (${res.error})` };
}

/**
 * Reminder job — call every 15 minutes (or daily with REMINDER_WINDOW_MINUTES=1440) with
 * `Authorization: Bearer $CRON_SECRET`. Without SMS/WhatsApp keys it is a dry run.
 */
export const dynamic = "force-dynamic";
const g = globalThis as unknown as { __sentKeys?: Set<string> };

function senders(): { whatsapp?: Sender; sms?: Sender } {
  const out: { whatsapp?: Sender; sms?: Sender } = {};
  if (process.env.AT_USERNAME && process.env.AT_API_KEY) {
    const sms = createSms({ username: process.env.AT_USERNAME, apiKey: process.env.AT_API_KEY, senderId: process.env.SMS_SENDER_ID, sandbox: process.env.AT_USERNAME === "sandbox" });
    out.sms = { send: async (m: OutboxMessage) => ({ ok: (await sms.send([m.to], m.text))[0]?.ok ?? false }) };
  }
  if (process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_TOKEN) {
    // Production sends the approved Utility template; free text is the fallback inside the 24-hour window.
    const wa = createWhatsApp({ phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID, token: process.env.WHATSAPP_TOKEN });
    out.whatsapp = { send: async (m: OutboxMessage) => ({ ok: Boolean((await wa.text(m.to, m.text)).providerId) }) };
  }
  return out;
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new NextResponse(null, { status: 401 });
  const origin = new URL(req.url).origin;
  if (!getPool()) return NextResponse.json({ schools: [await runFor(await school(), null, origin)] });
  const results = [];
  for (const org of await allOrgIds()) {
    try {
      const s = await school(org);
      // The demo's families are fictional: never message them. Schools still setting up are skipped too.
      if (s.org.isDemo || !s.terms.some((t) => t.status === "open")) continue;
      results.push(await runFor(s, org, origin));
    } catch (e) {
      results.push({ school: org, error: (e as Error).message });
    }
  }
  return NextResponse.json({ schools: results });
}

async function runFor(s: School, org: string | null, origin: string) {
  return serial(async () => {
    const pool = getPool();
    const sent = (g.__sentKeys ??= new Set());
    if (pool && org) for (const r of (await pool.query(`select idempotency_key from messages_outbox where org_id = $1`, [org])).rows) sent.add(r.idempotency_key);
    const now = process.env.SHULIFE_TODAY === "now" || !process.env.SHULIFE_JOB_AT ? new Date() : new Date(process.env.SHULIFE_JOB_AT);
    // Vercel Hobby runs crons once a day: REMINDER_WINDOW_MINUTES=1440 catches up on the last 24 hours.
    const windowMinutes = Number(process.env.REMINDER_WINDOW_MINUTES ?? 15);
    const due = dueMessages(s, { now, windowMinutes, sent, link: (id) => `${origin}/p/${signParentToken(id)}/` });
    const before = new Set(sent);
    const configured = senders();
    const result = await dispatch(due, configured, sent);
    if (pool && org) {
      for (const m of due.filter((x) => sent.has(x.key) && !before.has(x.key))) {
        await pool.query(
          `insert into messages_outbox (org_id, guardian_id, channel, template, language, body, idempotency_key, status, sent_at) values ($1,$2,$3,$4,$5,$6,$7,$8, now()) on conflict (org_id, idempotency_key) do nothing`,
          [org, m.guardianId, m.channel, m.template, m.lang, m.text, m.key, result.dryRun ? "cancelled" : "sent"],
        );
      }
    }
    const summary = org ? await directorSummary(s, org, origin).catch((e) => ({ summary: `failed: ${(e as Error).message}` })) : { summary: "no database" };
    return { school: s.org.name, due: due.length, ...result, ...summary, mode: Object.keys(configured).length ? "live" : "dry run (no SMS/WhatsApp keys)" };
  });
}
