# Launch checklist (Stage 13)

| Item | Status |
|---|---|
| Core engines tested (money, billing, matching, allocation, reminders, clearance, projection) | ✅ `npm test` |
| RLS isolation and integrity tested | ✅ `npm run test:db` |
| ≥ 90% auto-match on 300 simulated payments | ✅ `packages/demo/test/seed.test.ts` |
| Supabase project, migrations applied, auth with TOTP for director/head/bursar | ⬜ needs project |
| Postgres-backed data source (load at startup, write-through) | ✅ `bash packages/db/scripts/pgtest.sh` |
| Read models fully in SQL (needed for more than one app instance) | ⬜ |
| Daraja sandbox end-to-end (C2B, STK success/failure, duplicates, reversals) | ⬜ needs keys |
| Ratiba API confirmed with Safaricom | ⬜ |
| WhatsApp templates approved by Meta; SMS sender ID approved | ⬜ |
| PDF receipts, statements and clearance lists | ✅ |
| Load test: 2,000 callbacks, no loss or duplicates | ✅ 12.3 s, p95 308 ms |
| Backup restore drill | ⬜ |
| Legal texts, ODPC registration, Kiswahili review (`{{SW_REVIEW_DONE}}`) | ⬜ |
| Licensed photography replacing AI images (`{{PHOTO_SOURCE}}`) | ⬜ |
| Real prices, contacts and domain in `apps/web/src/lib/site.ts` | ⬜ |
| Mobile app (Expo): dashboard, review queue, offline cash receipts with camera | ✅ type-checks and bundles for Android; not yet run on a device |
| Mobile: Supabase sign-in in the app, push notifications, signed APK (`eas build`) | ⬜ |
| Reminder job every 15 minutes, idempotent, dry run without keys | ✅ |
| Supabase Auth with TOTP for director/head/bursar | ✅ written; ⬜ untested until a Supabase project exists |
