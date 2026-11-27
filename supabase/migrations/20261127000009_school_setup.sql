-- Real schools: a demo flag, setup progress, and lookups the app needs to find a school
-- from a payment callback, a receipt code or a parent link.
alter table organisations
  add column is_demo boolean not null default false,
  add column setup jsonb not null default '{}'::jsonb,   -- {"details": true, "classes": true, …}
  add column live_at timestamptz;
update organisations set is_demo = true where name = 'Mlima Academy';

-- One stream name per grade per campus.
create unique index if not exists streams_campus_grade_name on streams (campus_id, grade_id, name) where archived_at is null;
-- One payment integration per provider per campus (the Paybill callback).
create unique index if not exists payment_integrations_campus_provider on payment_integrations (campus_id, provider);
create unique index if not exists fee_structures_campus_term on fee_structures (campus_id, term_id);
create index if not exists receipts_verify_code on receipts (verify_code);

-- Balance brought forward from the school's old records, entered at import and charged
-- (or credited to the family) when the first term is invoiced.
alter table learners add column opening_balance_cents bigint;
