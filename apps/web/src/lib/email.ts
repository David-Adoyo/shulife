import "server-only";
import { supabaseAdmin } from "./supabase-admin";

/**
 * Transactional email through Resend's HTTP API. Needs RESEND_API_KEY (a sending-only key
 * for shulife.co.ke). Without it, emails are logged and skipped so nothing else breaks.
 */
const FROM = process.env.EMAIL_FROM ?? "Shulife <noreply@shulife.co.ke>";
const REPLY_TO = process.env.EMAIL_REPLY_TO;

export type Email = { to: string | string[]; subject: string; html: string; text: string; tag?: string };
export type SendResult = { ok: true; id: string } | { ok: false; skipped?: boolean; error: string };

export async function sendEmail(e: Email): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  const to = (Array.isArray(e.to) ? e.to : [e.to]).filter(Boolean);
  if (!to.length) return { ok: false, skipped: true, error: "no recipients" };
  if (!key) {
    console.info(`[email] skipped (no RESEND_API_KEY): ${e.subject}`);
    return { ok: false, skipped: true, error: "RESEND_API_KEY not set" };
  }
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ from: FROM, to, subject: e.subject, html: e.html, text: e.text, reply_to: REPLY_TO, tags: e.tag ? [{ name: "type", value: e.tag }] : undefined }),
      signal: AbortSignal.timeout(10_000),
    });
    const j = (await r.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!r.ok || !j.id) {
      console.error("[email] send failed", r.status, j.message);
      return { ok: false, error: j.message ?? `HTTP ${r.status}` };
    }
    return { ok: true, id: j.id };
  } catch (err) {
    console.error("[email] send failed", err);
    return { ok: false, error: (err as Error).message };
  }
}

/* ---------- Recipients ---------- */

async function emailsFor(userIds: string[]): Promise<string[]> {
  const sb = supabaseAdmin();
  if (!sb) return [];
  const out: string[] = [];
  for (const id of [...new Set(userIds)]) {
    const { data } = await sb.auth.admin.getUserById(id);
    if (data.user?.email) out.push(data.user.email);
  }
  return out;
}

/** Shulife's own staff (people in shulife_admins). */
export async function shulifeAdminEmails(): Promise<string[]> {
  const sb = supabaseAdmin();
  if (!sb) return [];
  const { data } = await sb.from("shulife_admins").select("user_id");
  return emailsFor((data ?? []).map((r) => r.user_id as string));
}

/** A school's directors. */
export async function directorEmails(orgId: string): Promise<string[]> {
  const sb = supabaseAdmin();
  if (!sb) return [];
  const { data } = await sb.from("memberships").select("user_id").eq("org_id", orgId).eq("role", "director").is("archived_at", null);
  return emailsFor((data ?? []).map((r) => r.user_id as string));
}

/* ---------- Layout ---------- */

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** A plain, table-based layout that renders in Gmail, Outlook and phone mail apps. */
export function layout({ heading, intro, rows, button, footer }: { heading: string; intro?: string; rows?: [string, string][]; button?: { label: string; href: string }; footer?: string }) {
  const table = rows?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-top:1px solid #e9dfc8">${rows
        .map(([k, v]) => `<tr><td style="padding:10px 0;border-bottom:1px solid #e9dfc8;color:#5b6478;font-size:14px">${esc(k)}</td><td style="padding:10px 0;border-bottom:1px solid #e9dfc8;color:#14204a;font-size:14px;font-weight:600;text-align:right">${esc(v)}</td></tr>`)
        .join("")}</table>`
    : "";
  const btn = button
    ? `<p style="margin:24px 0"><a href="${esc(button.href)}" style="display:inline-block;background:#14204a;color:#fdf9f1;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px;font-size:15px">${esc(button.label)}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#f7f1e3;font-family:'Plus Jakarta Sans',Segoe UI,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f1e3;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fdf9f1;border-radius:14px;padding:28px">
<tr><td style="font-size:22px;font-weight:800;color:#14204a;letter-spacing:-0.5px">shulife</td></tr>
<tr><td style="padding-top:20px"><h1 style="margin:0;font-size:22px;line-height:1.25;color:#14204a">${esc(heading)}</h1>
${intro ? `<p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#3c4558">${esc(intro)}</p>` : ""}${table}${btn}
${footer ? `<p style="margin:20px 0 0;font-size:12px;line-height:1.5;color:#7a8194">${esc(footer)}</p>` : ""}</td></tr>
</table></td></tr></table></body></html>`;
}

export function textVersion({ heading, intro, rows, button, footer }: Parameters<typeof layout>[0]) {
  return [heading, intro, rows?.map(([k, v]) => `${k}: ${v}`).join("\n"), button && `${button.label}: ${button.href}`, footer].filter(Boolean).join("\n\n");
}

export function compose(tag: string, to: string[], subject: string, content: Parameters<typeof layout>[0]): Email {
  return { to, subject, html: layout(content), text: textVersion(content), tag };
}
