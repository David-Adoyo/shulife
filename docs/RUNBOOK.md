# Runbook

## Local development
```bash
npm install
npm run dev            # http://localhost:3000 — marketing site, /app (demo school), /login
npm test               # core engines, demo seed, integrations
npm run test:db        # migrations + RLS tests against a throwaway Postgres (needs postgresql installed, run as root)
```
The school app runs on **Mlima Academy**, a fictional demo school generated in memory by `packages/demo` and processed through the real engines. Use the role switcher in the top bar to see each role's view. Demo data resets when the server restarts (or Set-up → Reset demo data).

## Running on Postgres
```bash
eval "$(bash packages/db/scripts/pg.sh start)"          # local throwaway Postgres with all migrations
SHULIFE_SEED_DEMO=1 npm run build -w @shulife/web && DATABASE_URL=$DATABASE_URL SHULIFE_SEED_DEMO=1 npm start -w @shulife/web
```
With `DATABASE_URL` set, the app loads the school from Postgres at startup (seeding the demo school into an empty database when `SHULIFE_SEED_DEMO=1`) and writes every payment, review decision and manual receipt through in a transaction. Payments are processed one at a time per server (like a single queue consumer); run **one** app instance until the read models move fully into SQL.

## Load test (term-opening burst, §14)
```bash
DATABASE_URL=… BASE=http://localhost:3000 node packages/db/scripts/loadtest.mjs 2000 40
```
Last run: 2,000 callbacks (200 repeats) in 12.3 s · p95 308 ms · 0 lost · 0 duplicates · 2,000 raw events stored · 90% auto-matched.

## Vercel (production)
- **Live:** https://shulife.co.ke (`www.shulife.co.ke` 308-redirects to it; https://shulife.vercel.app also still works) — project `shulife` on the `adoyos-team` account (Hobby plan), root directory `apps/web`, Node 22.
- **Deploy:** `npx vercel@65.14.0 deploy --prod --scope team_FKFbHPzPtm1TKhCTxcnDVdh6` from the repository root (`.vercel/project.json` links the project; `.vercelignore` keeps node_modules, the mobile app and local env files out of uploads). Connecting the GitHub repository in Vercel → Settings → Git gives automatic deploys instead.
- **Environment variables (Production and Preview):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY`, `PARENT_TOKEN_SECRET`, `CRON_SECRET`, `MPESA_CALLBACK_SECRET_RUI`, `MPESA_CALLBACK_SECRET_SYO`, `REMINDER_WINDOW_MINUTES=1440`. Not yet set: `DATABASE_URL` (school data and payments are the in-memory demo until it is), SMS/WhatsApp/Paystack/Resend keys.
- **Reminder job:** daily at 07:00 UTC (10:00 Nairobi) because Hobby allows one run a day; it catches up on the previous 24 hours. On Pro, set the schedule to `*/15 * * * *` and remove `REMINDER_WINDOW_MINUTES`.
- **M-Pesa callback paths** use the `MPESA_CALLBACK_SECRET_*` values: `https://shulife.co.ke/api/webhooks/mpesa/rui/<secret>/confirmation` (read the value in Vercel → Settings → Environment Variables when registering URLs with Daraja).
- **Supabase Auth** points at the live site (Site URL and Redirect URLs).

### Domain DNS (at the .co.ke registrar)
| Type | Host | Value |
|---|---|---|
| A | `@` (shulife.co.ke) | `216.198.79.1` |
| CNAME | `www` | `b6ab524905cffcdd.vercel-dns-017.com.` |

Remove any other A/AAAA records on `@` and any old `www` record. Vercel issues the HTTPS certificate automatically once DNS resolves. Supabase Auth `site_url` is `https://shulife.co.ke`; redirect allow-list covers shulife.co.ke, www, shulife.vercel.app and localhost:3000.

### Email (Resend)
- Resend domain `shulife.co.ke` (id `017736f3-f27a-4eb9-9d13-c78cd7e07c13`, eu-west-1). Add these DNS records at the registrar (or in Vercel DNS if the domain uses Vercel's nameservers):

| Type | Name | Value |
|---|---|---|
| TXT | `resend._domainkey` | the DKIM key shown in Resend → Domains → shulife.co.ke |
| MX (priority 10) | `send` | `feedback-smtp.eu-west-1.amazonses.com` |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` |

- The website sends with `RESEND_API_KEY` (a sending-only key for shulife.co.ke, already set in Vercel) from `noreply@shulife.co.ke`: demo-request alerts to Shulife admins, and a 07:00 summary to each school's directors (from the daily cron).
- Supabase sign-in emails (invites, password resets) use Supabase's own sender until the domain is verified. Then run `node scripts/supabase-email.mjs tvlowbpfdsdlijbepxeu 017736f3-f27a-4eb9-9d13-c78cd7e07c13` to switch them to Resend SMTP with the templates in `supabase/templates/` (links valid 24 hours).

### Database connection
- The app keeps a copy of the school in memory on each server and checks `org_versions` (bumped once per write transaction by triggers, migration 0008) before every read, reloading when another server has written.
- Writes take a per-school advisory lock (transaction-scoped, so it works through the Supabase transaction pooler on port 6543), refresh, apply and write. Two-server load test: 1,200 payments, none lost or duplicated.
- `DATABASE_URL` = the transaction pooler string `postgresql://postgres.tvlowbpfdsdlijbepxeu:<password>@aws-1-eu-west-1.pooler.supabase.com:6543/postgres`, stored in Vercel as a sensitive variable.

## Supabase project (tvlowbpfdsdlijbepxeu, eu-west-1)
Built on 26 Nov 2026 through the Management API:
- **Migrations** `supabase/migrations/20261126000001…07` (also recorded in `supabase_migrations.schema_migrations`, so `supabase db push` stays in sync). Re-run with `NODE_USE_ENV_PROXY=1 SUPABASE_ACCESS_TOKEN=sbp_… node scripts/supabase-apply.mjs tvlowbpfdsdlijbepxeu` — already-applied files are skipped.
- 57 tables, all with RLS (138 policies), 48 integrity triggers; anon has no table privileges; Supabase security advisor clean (one intentional note: `parent_login_codes` is service-role only).
- **Sign-in:** public sign-up off (staff join by invitation from Team), passwords ≥ 10 characters, TOTP on — required for director, head and bursar. New users get a `profiles` row; a pending `staff_invitations` row for their email becomes a `memberships` row automatically.
- **Bookings:** "Book a demo" writes `demo_requests`; only users in `shulife_admins` can read them (admin console).
- **Storage:** private buckets `crests`, `receipts`, `statements`, `slips`, `consent`; paths start with the organisation id.
- **Demo data:** the fictional Mlima Academy is loaded so the app has something to show. Remove it before onboarding a real school: run `scripts/remove-demo.sql` in the SQL editor.

### Still to do in Supabase (needs you)
1. **First director and Shulife admin:** create your user in Authentication → Users → Invite, then in the SQL editor:
   `insert into memberships (org_id, user_id, role) select o.id, u.id, 'director' from organisations o, auth.users u where u.email = 'you@…';`
   `insert into shulife_admins (user_id) select id from auth.users where email = 'you@…';`
2. **Email:** the free plan's built-in email sends only a few messages an hour and its templates can't be edited. Add custom SMTP (Authentication → Emails → SMTP, e.g. Resend), then the Shulife-branded templates can be applied.
3. **Site URL:** when the site is deployed, set Authentication → URL Configuration → Site URL to the live address and add `https://<domain>/**` to Redirect URLs.
4. **Database password** for `DATABASE_URL` (Project Settings → Database → Connection string → Session pooler) — needed for the school data, payments and the reminder job.
5. **Rotate the secret key** that was shared in chat (Project Settings → API Keys) and update `SUPABASE_SECRET_KEY` wherever it is set.

## Going live with Supabase
1. Create a Supabase project; run `packages/db/migrations/*.sql` in order (not `packages/db/local/` — that is a local stand-in for Supabase's own auth schema).
2. Fill `.env.local` from `.env.example`.
3. Replace the demo data source (`@shulife/demo`) with a Supabase-backed one implementing the same read models. Server routes use the service role only after verifying the session or a signed parent token.

## Adding a real school
1. Sign in as a Shulife admin and open `/admin/`. Under **Add a school**, enter the school's name and the director's email. This creates the school and emails the director an invitation (if they already have an account, they get access straight away and can switch schools in the app's sidebar).
2. The director sets a password, sets up two-step sign-in and lands on `/setup/`, which saves each step to the database:
   1. School and campuses (name, county, phone, family-code prefix; each campus's 3–4 letter code and Paybill number)
   2. Classes and term (grades, streams, the current term's dates)
   3. Fees (tuition, activity, exam, lunch and boarding per grade; transport routes; how family payments are split; clearance %)
   4. Learners and families (paste or upload the class list; learners sharing a parent's phone become one family; opening balances, lunch and routes are read if present)
   5. Invoice the term (safe to run again; opening balances become "Balance brought forward", credits stay on the family; the term's fee structure is then locked)
   6. Connect M-Pesa and go live (shows each campus's own callback URLs to register with Safaricom, and the note for parents)
3. Register the confirmation and validation URLs from step 6 on the school's Paybill (Daraja C2B register URL).

How it works: each school's data is separate (`org_id` on every row). Each server keeps a copy per school and checks `org_versions` before reading. Callbacks find their school from the campus id and secret in the URL; parent links from the family; receipt checks from the receipt code; WhatsApp from the sender's registered number. The daily job runs reminders and the director summary for every live school and never for the demo.

## Connecting a school's M-Pesa (per campus)
1. School enters Daraja consumer key/secret, shortcode and STK passkey → stored in Vault, never shown again.
2. Create a `payment_integrations` row; its `callback_secret` forms the path `/api/webhooks/mpesa/{campus}/{secret}/{validation|confirmation}`.
3. Call `registerUrls` (packages/integrations); make a KSh 1 sandbox test payment; confirm it appears and is receipted.
4. Optional: set `SAFARICOM_CALLBACK_IPS`.

## Incidents
- **Callbacks failing:** the raw event is always stored before processing; fix and replay from `raw_mpesa_events` (idempotent on TransID).
- **Duplicate callbacks:** ignored by the unique `(org_id, provider_ref)` index — no action needed.
- **Wrong allocation:** never edit; post a reversal and a new allocation (both audited).
- **Subscription overdue:** read-only after grace; ingestion, receipts and parent balances keep running by design.

## Not yet confirmed (must check before enabling)
- M-PESA Ratiba API endpoint and fields (adapter throws until confirmed).
- Bank statement CSV formats `{{BANK_FORMATS}}` — confirm with pilot schools' real statements.
- WhatsApp template approval (Utility category) for every template in `packages/core/src/messaging.ts`.
