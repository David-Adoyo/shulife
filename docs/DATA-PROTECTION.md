# Data protection (Kenya Data Protection Act, 2019)

> Legal documents (Terms, Privacy notice, DPA) must come from a lawyer — `{{LEGAL_TEXT}}`. This file records how the system is built to support them.

- **Roles:** each school is the data controller; Shulife is the processor.
- **Registration:** with the ODPC — `{{ODPC_REG_NO}}` (required before launch).
- **Children's data — minimum only:** learners have name, admission number, grade/stream, boarding/route and family link. The schema has no columns for photos, health data, national IDs or assessment numbers. Learners are never messaged.
- **Guardian phones** are hashed (salted SHA-256) for matching and shown masked in lists.
- **Access control:** Postgres Row Level Security on every table (`packages/db/migrations/0002_rls.sql`), tested in `packages/db/test/rls.test.sql`: isolation between schools and campuses; class teachers and transport staff never see amounts or contacts; sponsors see only their own lines; secrets, raw events and the audit log are service-role only.
- **Integrity:** ledger, allocations, invoice lines, raw events and the audit log are append-only (triggers); payment facts are immutable; nobody approves their own waiver.
- **Audit:** every money, permission, contact and settings change is written to `audit_log`.
- **Consent:** WhatsApp opt-in is stored with time and channel.
- **Analytics:** no learner or guardian personal data in PostHog events.
- **Retention:** `{{RETENTION_YEARS}}` years for financial records; leavers' contact data minimised after `{{LEAVER_CONTACT_RETENTION_MONTHS}}` months (confirm with a lawyer and accountant).
- **Subject requests:** handled by the school, with admin tooling to export a family's data.
