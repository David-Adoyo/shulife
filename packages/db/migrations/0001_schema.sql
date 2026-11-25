-- Shulife data model (§6). Money is bigint cents. Every table has org_id and RLS.
-- Soft delete is archived_at. Payments, ledger entries, raw events and the audit
-- log are append-only (enforced by triggers in 0003).

create extension if not exists pgcrypto;
create schema if not exists app;

-- ---------- Types ----------
create type app.role as enum ('director', 'head', 'bursar', 'front_office', 'class_teacher', 'transport', 'sponsor');
create type app.term_status as enum ('planned', 'open', 'closed');
create type app.learner_status as enum ('active', 'suspended', 'left', 'graduated', 'prospective');
create type app.boarding as enum ('day', 'boarder');
create type app.lang as enum ('en', 'sw');
create type app.structure_status as enum ('draft', 'approved', 'published');
create type app.pay_channel as enum ('c2b', 'stk', 'ratiba', 'bank_import', 'cash', 'cheque', 'bank_slip');
create type app.match_status as enum ('auto', 'suggested', 'unmatched', 'manual', 'split', 'reversed', 'not_ours');
create type app.alloc_rule as enum ('oldest_balance', 'proportional', 'youngest_first', 'eldest_first', 'exact_number');
create type app.msg_status as enum ('queued', 'sent', 'delivered', 'read', 'failed', 'cancelled');
create type app.channel as enum ('whatsapp', 'sms', 'email');
create type app.clearance as enum ('cleared', 'on_plan', 'not_cleared', 'overridden');
create type app.sub_state as enum ('free', 'trial', 'active', 'overdue', 'read_only');

-- Common columns helper: every table gets these.
-- id uuid pk, org_id, created_at, updated_at, created_by

-- ---------- 6.1 Organisation and academic structure ----------
create table organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  plan text,
  status text not null default 'active',
  default_language app.lang not null default 'en',
  quiet_start time not null default '21:00',
  quiet_end time not null default '07:00',
  allocation_rule app.alloc_rule not null default 'oldest_balance',
  family_code_prefix text not null default 'FAM',
  auto_match_threshold int not null default 90 check (auto_match_threshold between 50 and 100),
  clearance_pct int not null default 70 check (clearance_pct between 0 and 100),
  max_reminders_per_week int not null default 2,
  late_fees_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  archived_at timestamptz
);
create table campuses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id),
  name text not null,
  code text not null check (code ~ '^[A-Z]{3,4}$'),
  crest_path text, motto text, address text, county text, phone text, receipt_footer text, accent_colour text,
  paybill_display text, bank_display text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid, archived_at timestamptz,
  unique (org_id, code)
);
create table memberships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id),
  user_id uuid not null,
  role app.role not null,
  campus_ids uuid[], -- null = every campus
  stream_ids uuid[], -- class teachers: their streams
  route_ids uuid[], -- transport coordinators: their routes
  mfa_required boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid, archived_at timestamptz,
  unique (org_id, user_id, role)
);
create table academic_years (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  name text not null, starts_on date not null, ends_on date not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid
);
create table terms (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  academic_year_id uuid not null references academic_years(id),
  name text not null, number int not null check (number between 1 and 3),
  opens_on date not null, closes_on date not null, half_term_start date, half_term_end date, fee_due_on date not null,
  status app.term_status not null default 'planned',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid,
  check (closes_on > opens_on)
);
create table grades (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  code text not null, display_name text not null, sort_order int not null,
  level text not null check (level in ('pre_primary', 'primary', 'junior', 'senior')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid,
  unique (org_id, code)
);
create table streams (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  campus_id uuid not null references campuses(id), grade_id uuid not null references grades(id),
  name text not null, class_teacher_id uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid, archived_at timestamptz
);

-- ---------- 6.2 Learners and families ----------
create table families (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  code text not null, display_name text not null, preferred_language app.lang not null default 'en',
  consent_whatsapp boolean not null default false, consent_sms boolean not null default true,
  notes text, credit_cents bigint not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid, archived_at timestamptz,
  unique (org_id, code)
);
create table learners (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  campus_id uuid not null references campuses(id), family_id uuid not null references families(id),
  admission_number text not null, first_name text not null, last_name text not null, other_names text,
  gender text, date_of_birth date, -- optional, only for age-based fees
  status app.learner_status not null default 'active', boarding app.boarding not null default 'day',
  joined_on date, left_on date,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid, archived_at timestamptz,
  unique (campus_id, admission_number)
  -- deliberately no photo, medical, national ID or assessment number columns (§13)
);
create table guardians (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  family_id uuid not null references families(id),
  name text not null, relationship text,
  phone_e164 text check (phone_e164 ~ '^254[17][0-9]{8}$'), phone_hash text, phone_last3 text,
  phone2_e164 text, email text,
  whatsapp_opt_in boolean not null default false, whatsapp_opt_in_at timestamptz, whatsapp_opt_in_channel text,
  preferred_language app.lang not null default 'en', is_primary_payer boolean not null default false, receives_notices boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid, archived_at timestamptz
);
create table learner_guardians (
  org_id uuid not null references organisations(id),
  learner_id uuid not null references learners(id), guardian_id uuid not null references guardians(id),
  is_fee_payer boolean not null default true, receives_notices boolean not null default true,
  primary key (learner_id, guardian_id)
);
create table transport_routes (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  campus_id uuid not null references campuses(id), name text not null, zones text, amount_cents bigint not null check (amount_cents >= 0), coordinator_id uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid, archived_at timestamptz
);
create table enrolments (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  learner_id uuid not null references learners(id), term_id uuid not null references terms(id),
  grade_id uuid not null references grades(id), stream_id uuid references streams(id),
  boarding app.boarding not null default 'day', route_id uuid references transport_routes(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid,
  unique (learner_id, term_id)
);
create table admission_aliases (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  learner_id uuid not null references learners(id), alias text not null, source text not null default 'review_queue',
  created_at timestamptz not null default now(), created_by uuid
);

-- ---------- 6.3 Fees and billing ----------
create table fee_items (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  code text not null, name text not null, kind text not null check (kind in ('mandatory', 'optional')),
  refundable boolean not null default false, pro_rata boolean not null default true, allocation_priority int not null default 90,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid, archived_at timestamptz,
  unique (org_id, code)
);
create table fee_structures (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  campus_id uuid not null references campuses(id), term_id uuid not null references terms(id),
  version int not null default 1, status app.structure_status not null default 'draft', approved_by uuid, approved_at timestamptz, published_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid
);
create table fee_structure_rows (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  structure_id uuid not null references fee_structures(id), grade_id uuid not null references grades(id), fee_item_id uuid not null references fee_items(id),
  day_cents bigint not null default 0 check (day_cents >= 0), boarder_cents bigint not null default 0 check (boarder_cents >= 0),
  unique (structure_id, grade_id, fee_item_id)
);
create table optional_subscriptions (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  learner_id uuid not null references learners(id), term_id uuid not null references terms(id), fee_item_id uuid not null references fee_items(id),
  created_at timestamptz not null default now(), created_by uuid,
  unique (learner_id, term_id, fee_item_id)
);
create table discount_rules (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  kind text not null check (kind in ('sibling', 'staff', 'early_payment')), min_rank int, percent numeric(5,2) not null, fee_item_codes text[] not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid, archived_at timestamptz
);
create table sponsors (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  name text not null, contact_email text, user_id uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid
);
create table sponsorships (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  sponsor_id uuid not null references sponsors(id), learner_id uuid not null references learners(id),
  fee_item_codes text[] not null, percent numeric(5,2), fixed_cents bigint,
  created_at timestamptz not null default now(), created_by uuid,
  check ((percent is null) <> (fixed_cents is null))
);
create table invoices (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  campus_id uuid not null references campuses(id), learner_id uuid not null references learners(id), term_id uuid not null references terms(id),
  number text not null, total_cents bigint not null, pdf_path text,
  created_at timestamptz not null default now(), created_by uuid,
  unique (learner_id, term_id), -- idempotent per learner per term
  unique (org_id, number)
);
create table invoice_lines (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  invoice_id uuid not null references invoices(id), fee_item_id uuid references fee_items(id),
  kind text not null check (kind in ('charge', 'sponsorship', 'sibling_discount', 'staff_discount', 'waiver')),
  description text not null, amount_cents bigint not null, optional boolean not null default false, sponsor_id uuid references sponsors(id),
  created_at timestamptz not null default now()
);
create table ledger_entries (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  learner_id uuid not null references learners(id), term_id uuid references terms(id),
  kind text not null check (kind in ('invoice_line', 'charge', 'allocation', 'discount', 'waiver', 'sponsor', 'brought_forward', 'reversal', 'credit_applied')),
  description text not null, amount_cents bigint not null, ref text, source_id uuid,
  created_at timestamptz not null default now(), created_by uuid
);
create table adjustments (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  learner_id uuid not null references learners(id), kind text not null check (kind in ('waiver', 'credit_note', 'write_off')),
  amount_cents bigint not null check (amount_cents > 0), reason text not null check (length(trim(reason)) > 0),
  requested_by uuid not null, approved_by uuid, approved_at timestamptz, approval_tier text,
  created_at timestamptz not null default now(),
  check (approved_by is null or approved_by <> requested_by) -- nobody approves their own
);
create table payment_plans (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  family_id uuid not null references families(id), learner_id uuid references learners(id), term_id uuid not null references terms(id),
  status text not null default 'proposed' check (status in ('proposed', 'active', 'completed', 'broken', 'cancelled')),
  total_cents bigint not null, accepted_by_guardian_id uuid references guardians(id), accepted_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid
);
create table plan_instalments (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  plan_id uuid not null references payment_plans(id), n int not null, due_on date not null, amount_cents bigint not null check (amount_cents > 0), paid_cents bigint not null default 0,
  unique (plan_id, n)
);

-- ---------- 6.4 Payments ----------
create table payment_integrations (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id), campus_id uuid references campuses(id),
  provider text not null check (provider in ('mpesa_paybill', 'mpesa_till', 'bank_import', 'manual')),
  shortcode text, environment text not null default 'sandbox' check (environment in ('sandbox', 'production')),
  vault_secret_ref text, callback_secret text not null default encode(gen_random_bytes(24), 'hex'), last_verified_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid
);
create table raw_mpesa_events (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id), campus_id uuid references campuses(id),
  kind text not null, payload jsonb not null, headers jsonb, source_ip inet, received_at timestamptz not null default now(),
  processed_at timestamptz, error text
);
create table payments (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id), campus_id uuid references campuses(id),
  provider_ref text not null, amount_cents bigint not null check (amount_cents > 0),
  msisdn_hash text, msisdn_last3 text, payer_name text, bill_ref text, paid_at timestamptz not null,
  channel app.pay_channel not null, match_status app.match_status not null default 'unmatched', confidence int,
  matched_family_id uuid references families(id), matched_learner_id uuid references learners(id), rule_used app.alloc_rule,
  raw_event_id uuid references raw_mpesa_events(id),
  created_at timestamptz not null default now(), created_by uuid,
  unique (org_id, provider_ref) -- idempotency (§7.2)
);
create table allocations (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  payment_id uuid not null references payments(id), learner_id uuid not null references learners(id), invoice_line_id uuid references invoice_lines(id),
  amount_cents bigint not null, rule app.alloc_rule not null, reversal_of uuid references allocations(id),
  created_at timestamptz not null default now(), created_by uuid
);
create table allocation_change_requests (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  payment_id uuid not null references payments(id), guardian_id uuid references guardians(id), message text not null,
  status text not null default 'open' check (status in ('open', 'approved', 'declined')), resolved_by uuid, resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create table payer_links (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  phone_hash text not null, family_id uuid not null references families(id),
  source text not null check (source in ('guardian_record', 'learned', 'import')), confidence int not null default 85,
  created_at timestamptz not null default now(), created_by uuid,
  unique (org_id, phone_hash, family_id)
);
create table review_queue (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  payment_id uuid not null unique references payments(id), suggestions jsonb not null default '[]', assignee uuid,
  resolution text check (resolution in ('assigned', 'not_ours', 'skipped')), resolved_family_id uuid references families(id), resolved_by uuid, resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create table bank_deposits (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id), campus_id uuid references campuses(id),
  deposited_on date not null, slip_ref text not null, amount_cents bigint not null, photo_path text, variance_cents bigint not null default 0,
  created_at timestamptz not null default now(), created_by uuid
);
create table manual_receipts (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  payment_id uuid not null unique references payments(id), book_ref text not null, photo_path text not null,
  received_by uuid not null, received_on date not null, banked_deposit_id uuid references bank_deposits(id),
  created_at timestamptz not null default now()
);
create table stk_requests (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  family_id uuid references families(id), checkout_request_id text unique, amount_cents bigint not null, msisdn_hash text,
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed', 'cancelled', 'timeout')), result_desc text,
  created_at timestamptz not null default now()
);
create table ratiba_mandates (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  family_id uuid not null references families(id), plan_id uuid references payment_plans(id), amount_cents bigint not null, frequency text not null,
  starts_on date not null, ends_on date, status text not null default 'pending', provider_ref text,
  created_at timestamptz not null default now()
);
create table receipts (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  payment_id uuid not null unique references payments(id), number text not null, verify_code text not null unique,
  pdf_path text, channel app.channel, sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (org_id, number)
);

-- ---------- 6.5 Communication and operations ----------
create table audiences (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  name text not null, spec jsonb not null,
  created_at timestamptz not null default now(), created_by uuid,
  check (spec->>'kind' in ('whole_school', 'campus', 'grade', 'stream', 'route', 'boarding', 'custom')) -- never "debtors"
);
create table notices (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  title text not null, body_en text not null, body_sw text, attachments jsonb not null default '[]', audience jsonb not null,
  channels app.channel[] not null default '{whatsapp,sms}', scheduled_for timestamptz, sent_at timestamptz, sent_by uuid,
  approval_status text not null default 'approved' check (approval_status in ('pending', 'approved', 'rejected')), emergency boolean not null default false,
  created_at timestamptz not null default now(), created_by uuid
);
create table messages_outbox (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  guardian_id uuid not null references guardians(id), channel app.channel not null, template text not null, language app.lang not null,
  variables jsonb not null default '{}', body text, idempotency_key text not null, status app.msg_status not null default 'queued',
  provider_id text, cost_cents bigint, send_after timestamptz not null default now(), sent_at timestamptz, delivered_at timestamptz, read_at timestamptz,
  related_type text, related_id uuid,
  created_at timestamptz not null default now(),
  unique (org_id, idempotency_key)
);
create table events (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  name text not null, kind text not null check (kind in ('exam', 'trip', 'report_collection', 'term_end', 'other')),
  happens_on date not null, deadline date, cost_cents bigint not null default 0, questions jsonb not null default '[]', audience jsonb,
  created_at timestamptz not null default now(), created_by uuid
);
create table consent_responses (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  event_id uuid not null references events(id), guardian_id uuid not null references guardians(id), learner_id uuid not null references learners(id),
  answer text not null check (answer in ('yes', 'no')), answers jsonb, otp_signed_at timestamptz, paid boolean not null default false,
  created_at timestamptz not null default now(),
  unique (event_id, learner_id)
);
create table inbox_threads (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  family_id uuid references families(id), guardian_id uuid references guardians(id), tag text not null default 'general' check (tag in ('fees', 'transport', 'general')),
  assignee uuid, status text not null default 'open' check (status in ('open', 'closed')), first_response_at timestamptz,
  created_at timestamptz not null default now()
);
create table inbox_messages (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  thread_id uuid not null references inbox_threads(id), direction text not null check (direction in ('in', 'out')), body text not null, sent_by uuid,
  created_at timestamptz not null default now()
);
create table clearance_rules (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  event_id uuid references events(id), kind text not null check (kind in ('exam', 'trip', 'report_collection', 'term_end')), threshold_pct int not null,
  created_at timestamptz not null default now(), created_by uuid
);
-- No money columns here on purpose: class teachers read this table.
create table clearance_status (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  rule_id uuid not null references clearance_rules(id), learner_id uuid not null references learners(id),
  status app.clearance not null, override_by uuid, override_reason text,
  updated_at timestamptz not null default now(),
  unique (rule_id, learner_id),
  check (status <> 'overridden' or (override_by is not null and length(trim(coalesce(override_reason, ''))) > 0))
);
create table reminder_rules (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  template text not null, offset_days int not null, anchor text not null check (anchor in ('opening', 'due', 'instalment', 'event')),
  channels app.channel[] not null default '{whatsapp,sms}', tone text not null default 'standard', enabled boolean not null default true,
  created_at timestamptz not null default now(), created_by uuid
);
create table audit_log (
  id bigserial primary key, org_id uuid, actor uuid, action text not null, entity text not null, entity_id text, detail jsonb,
  at timestamptz not null default now()
);
create table subscriptions (
  id uuid primary key default gen_random_uuid(), org_id uuid not null unique references organisations(id),
  state app.sub_state not null default 'free', trial_ends_at timestamptz, due_at timestamptz, grace_days int not null default 14,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table subscription_invoices (
  id uuid primary key default gen_random_uuid(), org_id uuid not null references organisations(id),
  term_id uuid references terms(id), learners_counted int not null, amount_cents bigint not null, due_at timestamptz not null, paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- Indexes ----------
create index on learners (org_id, family_id);
create index on learners (org_id, campus_id, status);
create index on guardians (org_id, phone_hash);
create index on enrolments (org_id, term_id, stream_id);
create index on ledger_entries (org_id, learner_id, created_at);
create index on payments (org_id, paid_at desc);
create index on payments (org_id, match_status);
create index on allocations (org_id, payment_id);
create index on messages_outbox (status, send_after);
create index on audit_log (org_id, at desc);

