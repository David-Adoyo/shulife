import { NextResponse } from "next/server";
import { dispatch, dueMessages, getSchool, type OutboxMessage, type Sender } from "@shulife/demo";
import { createSms, createWhatsApp } from "@shulife/integrations";
import { getPool, orgId, serial } from "@/lib/db";
import { signParentToken } from "@/lib/session";

/**
 * Reminder job — call every 15 minutes (vercel.json cron, or any scheduler) with
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
  return serial(async () => {
    const s = getSchool();
    const pool = getPool();
    const org = orgId();
    const sent = (g.__sentKeys ??= new Set());
    if (pool && org) for (const r of (await pool.query(`select idempotency_key from messages_outbox where org_id = $1`, [org])).rows) sent.add(r.idempotency_key);
    const now = process.env.SHULIFE_TODAY === "now" || !process.env.SHULIFE_JOB_AT ? new Date() : new Date(process.env.SHULIFE_JOB_AT);
    const due = dueMessages(s, { now, sent, link: (id) => `${origin}/p/${signParentToken(id)}/` });
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
    return NextResponse.json({ due: due.length, ...result, mode: Object.keys(configured).length ? "live" : "dry run (no SMS/WhatsApp keys)" });
  });
}
