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

## Going live with Supabase
1. Create a Supabase project; run `packages/db/migrations/*.sql` in order (not `packages/db/local/` — that is a local stand-in for Supabase's own auth schema).
2. Fill `.env.local` from `.env.example`.
3. Replace the demo data source (`@shulife/demo`) with a Supabase-backed one implementing the same read models. Server routes use the service role only after verifying the session or a signed parent token.

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
