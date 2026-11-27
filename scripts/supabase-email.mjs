// Switch Supabase Auth emails (invites, password resets…) to Resend SMTP with Shulife's
// own templates, sent from noreply@shulife.co.ke. Run once the Resend domain is verified.
// Usage: node scripts/supabase-email.mjs <project-ref> <resend-domain-id>
// Needs Supabase and Resend credentials (here they're injected by the network proxy).
import { readFileSync } from "node:fs";
const [ref, domainId] = process.argv.slice(2);
if (!ref || !domainId) throw new Error("Usage: node scripts/supabase-email.mjs <project-ref> <resend-domain-id>");
const SB = process.env.SUPABASE_ACCESS_TOKEN ?? "proxy-injected";
const RS = process.env.RESEND_ADMIN_KEY ?? "proxy-injected";
const resend = (path, init = {}) => fetch(`https://api.resend.com${path}`, { ...init, headers: { Authorization: `Bearer ${RS}`, "content-type": "application/json" } }).then((r) => r.json());

const domain = await resend(`/domains/${domainId}`);
if (domain.status !== "verified") {
  console.log(`Domain ${domain.name} is "${domain.status}". Add its DNS records, then run this again.`);
  process.exit(2);
}
const key = await resend("/api-keys", { method: "POST", body: JSON.stringify({ name: "Supabase Auth SMTP (shulife.co.ke)", permission: "sending_access", domain_id: domainId }) });
if (!key.token) throw new Error(`Could not create the SMTP key: ${JSON.stringify(key)}`);

const t = (f) => readFileSync(new URL(`../supabase/templates/${f}.html`, import.meta.url), "utf8");
const config = {
  smtp_admin_email: "noreply@shulife.co.ke",
  smtp_sender_name: "Shulife",
  smtp_host: "smtp.resend.com",
  smtp_port: "465",
  smtp_user: "resend",
  smtp_pass: key.token,
  smtp_max_frequency: 30,
  mailer_otp_exp: 86400, // links in invites and resets work for 24 hours
  rate_limit_email_sent: 100,
  mailer_subjects_invite: "You’ve been invited to Shulife",
  mailer_templates_invite_content: t("invite"),
  mailer_subjects_recovery: "Reset your Shulife password",
  mailer_templates_recovery_content: t("recovery"),
  mailer_subjects_confirmation: "Confirm your email for Shulife",
  mailer_templates_confirmation_content: t("confirmation"),
  mailer_subjects_magic_link: "Your Shulife sign-in link",
  mailer_templates_magic_link_content: t("magic_link"),
  mailer_subjects_email_change: "Confirm your new email for Shulife",
  mailer_templates_email_change_content: t("email_change"),
  mailer_subjects_reauthentication: "Your Shulife confirmation code",
  mailer_templates_reauthentication_content: t("reauthentication"),
};
const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, { method: "PATCH", headers: { Authorization: `Bearer ${SB}`, "content-type": "application/json" }, body: JSON.stringify(config) });
if (!r.ok) {
  await resend(`/api-keys/${key.id}`, { method: "DELETE" });
  throw new Error(`Supabase rejected the email settings (${r.status}): ${(await r.text()).slice(0, 300)}`);
}
console.log("Supabase Auth now sends through Resend from noreply@shulife.co.ke with Shulife templates.");
