-- RLS and integrity tests (Stage 3 acceptance: isolation across schools, campuses
-- and roles; teachers see no amounts). Run by scripts/test.sh against a scratch DB.
\set ON_ERROR_STOP on
set client_min_messages = notice;

create or replace function pg_temp.check(label text, actual bigint, expected bigint) returns void language plpgsql as $$
begin
  if actual is distinct from expected then raise exception 'FAIL %: expected %, got %', label, expected, actual; end if;
  raise notice 'ok  %', label;
end $$;

create or replace function pg_temp.expect_error(label text, stmt text) returns void language plpgsql as $$
begin
  begin
    execute stmt;
  exception when others then
    raise notice 'ok  % (%)', label, sqlerrm;
    return;
  end;
  raise exception 'FAIL %: statement succeeded but should have failed', label;
end $$;


create or replace function pg_temp.affected(stmt text) returns bigint language plpgsql as $$
declare n bigint;
begin
  execute stmt;
  get diagnostics n = row_count;
  return n;
end $$;

-- ---------- Fixtures (as superuser) ----------
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000d1', 'dir.a@x'), ('00000000-0000-0000-0000-0000000000b1', 'bursar.a@x'),
  ('00000000-0000-0000-0000-0000000000c1', 'teacher.a@x'), ('00000000-0000-0000-0000-0000000000f1', 'front.a@x'),
  ('00000000-0000-0000-0000-0000000000e1', 'transport.a@x'), ('00000000-0000-0000-0000-0000000000d2', 'dir.b@x'),
  ('00000000-0000-0000-0000-0000000000a1', 'sponsor@x'), ('00000000-0000-0000-0000-0000000000a2', 'head.a@x');

insert into organisations (id, name) values ('aaaaaaaa-0000-0000-0000-000000000000', 'Mlima Academy'), ('bbbbbbbb-0000-0000-0000-000000000000', 'Other School');
insert into campuses (id, org_id, name, code) values
  ('aaaaaaaa-0000-0000-0000-0000000000c1', 'aaaaaaaa-0000-0000-0000-000000000000', 'Ruiru', 'RUI'),
  ('aaaaaaaa-0000-0000-0000-0000000000c2', 'aaaaaaaa-0000-0000-0000-000000000000', 'Syokimau', 'SYO'),
  ('bbbbbbbb-0000-0000-0000-0000000000c1', 'bbbbbbbb-0000-0000-0000-000000000000', 'Main', 'MAI');
insert into academic_years (id, org_id, name, starts_on, ends_on) values ('aaaaaaaa-0000-0000-0000-0000000000a7', 'aaaaaaaa-0000-0000-0000-000000000000', '2027', '2027-01-01', '2027-12-31');
insert into terms (id, org_id, academic_year_id, name, number, opens_on, closes_on, fee_due_on, status) values
  ('aaaaaaaa-0000-0000-0000-0000000000e1', 'aaaaaaaa-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-0000000000a7', 'Term 1 2027', 1, '2027-01-06', '2027-04-07', '2027-01-13', 'open');
insert into grades (id, org_id, code, display_name, sort_order, level) values ('aaaaaaaa-0000-0000-0000-0000000000a4', 'aaaaaaaa-0000-0000-0000-000000000000', 'G4', 'Grade 4', 6, 'primary');
insert into streams (id, org_id, campus_id, grade_id, name) values
  ('aaaaaaaa-0000-0000-0000-00000000004e', 'aaaaaaaa-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-0000000000c1', 'aaaaaaaa-0000-0000-0000-0000000000a4', 'East'),
  ('aaaaaaaa-0000-0000-0000-00000000004f', 'aaaaaaaa-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-0000000000c1', 'aaaaaaaa-0000-0000-0000-0000000000a4', 'West');
insert into transport_routes (id, org_id, campus_id, name, amount_cents) values ('aaaaaaaa-0000-0000-0000-0000000000f2', 'aaaaaaaa-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-0000000000c1', 'Route 2', 800000);

insert into memberships (org_id, user_id, role, campus_ids, stream_ids, route_ids) values
  ('aaaaaaaa-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000d1', 'director', null, null, null),
  ('aaaaaaaa-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000a2', 'head', null, null, null),
  ('aaaaaaaa-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000b1', 'bursar', '{aaaaaaaa-0000-0000-0000-0000000000c1}', null, null),
  ('aaaaaaaa-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000c1', 'class_teacher', null, '{aaaaaaaa-0000-0000-0000-00000000004e}', null),
  ('aaaaaaaa-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000f1', 'front_office', null, null, null),
  ('aaaaaaaa-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000e1', 'transport', null, null, '{aaaaaaaa-0000-0000-0000-0000000000f2}'),
  ('bbbbbbbb-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000d2', 'director', null, null, null),
  ('aaaaaaaa-0000-0000-0000-000000000000', '00000000-0000-0000-0000-0000000000a1', 'sponsor', null, null, null);

insert into families (id, org_id, code, display_name) values
  ('aaaaaaaa-0000-0000-0000-0000000000f0', 'aaaaaaaa-0000-0000-0000-000000000000', '2041', 'The Otieno family'),
  ('aaaaaaaa-0000-0000-0000-0000000000f9', 'aaaaaaaa-0000-0000-0000-000000000000', '9001', 'The Njeri family'),
  ('bbbbbbbb-0000-0000-0000-0000000000f0', 'bbbbbbbb-0000-0000-0000-000000000000', '1', 'The B family');
insert into guardians (id, org_id, family_id, name, phone_e164) values
  ('aaaaaaaa-0000-0000-0000-0000000000a9', 'aaaaaaaa-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-0000000000f0', 'Janet Otieno', '254712345678');
insert into learners (id, org_id, campus_id, family_id, admission_number, first_name, last_name) values
  ('aaaaaaaa-0000-0000-0000-000000000011', 'aaaaaaaa-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-0000000000c1', 'aaaaaaaa-0000-0000-0000-0000000000f0', '2041', 'Amani', 'Otieno'),
  ('aaaaaaaa-0000-0000-0000-000000000012', 'aaaaaaaa-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-0000000000c1', 'aaaaaaaa-0000-0000-0000-0000000000f0', '2187', 'Zawadi', 'Otieno'),
  ('aaaaaaaa-0000-0000-0000-000000000013', 'aaaaaaaa-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-0000000000c2', 'aaaaaaaa-0000-0000-0000-0000000000f9', '3001', 'Wairimu', 'Njeri'),
  ('bbbbbbbb-0000-0000-0000-000000000011', 'bbbbbbbb-0000-0000-0000-000000000000', 'bbbbbbbb-0000-0000-0000-0000000000c1', 'bbbbbbbb-0000-0000-0000-0000000000f0', '2041', 'Other', 'Child');
insert into enrolments (org_id, learner_id, term_id, grade_id, stream_id, route_id) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000011', 'aaaaaaaa-0000-0000-0000-0000000000e1', 'aaaaaaaa-0000-0000-0000-0000000000a4', 'aaaaaaaa-0000-0000-0000-00000000004e', 'aaaaaaaa-0000-0000-0000-0000000000f2'),
  ('aaaaaaaa-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000012', 'aaaaaaaa-0000-0000-0000-0000000000e1', 'aaaaaaaa-0000-0000-0000-0000000000a4', 'aaaaaaaa-0000-0000-0000-00000000004f', null);
insert into ledger_entries (org_id, learner_id, kind, description, amount_cents) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000011', 'invoice_line', 'Tuition', 3000000),
  ('aaaaaaaa-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000013', 'invoice_line', 'Tuition', 2500000);
insert into invoices (id, org_id, campus_id, learner_id, term_id, number, total_cents) values
  ('aaaaaaaa-0000-0000-0000-0000000000b1', 'aaaaaaaa-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-0000000000c1', 'aaaaaaaa-0000-0000-0000-000000000011', 'aaaaaaaa-0000-0000-0000-0000000000e1', 'INV-RUI-2027-T1-000001', 3000000);
insert into sponsors (id, org_id, name, user_id) values ('aaaaaaaa-0000-0000-0000-0000000000a5', 'aaaaaaaa-0000-0000-0000-000000000000', 'Acme Ltd', '00000000-0000-0000-0000-0000000000a1');
insert into invoice_lines (org_id, invoice_id, kind, description, amount_cents, sponsor_id) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-0000000000b1', 'charge', 'Tuition', 3000000, null),
  ('aaaaaaaa-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-0000000000b1', 'sponsorship', 'Sponsored by Acme', -1500000, 'aaaaaaaa-0000-0000-0000-0000000000a5');
insert into payments (id, org_id, provider_ref, amount_cents, paid_at, channel, bill_ref) values
  ('aaaaaaaa-0000-0000-0000-0000000000a6', 'aaaaaaaa-0000-0000-0000-000000000000', 'SBX001', 4500000, now(), 'c2b', 'ADM 2041');
insert into allocations (org_id, payment_id, learner_id, amount_cents, rule) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-0000000000a6', 'aaaaaaaa-0000-0000-0000-000000000011', 4500000, 'oldest_balance');
insert into clearance_rules (id, org_id, kind, threshold_pct) values ('aaaaaaaa-0000-0000-0000-0000000000cc', 'aaaaaaaa-0000-0000-0000-000000000000', 'exam', 70);
insert into clearance_status (org_id, rule_id, learner_id, status) values
  ('aaaaaaaa-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-0000000000cc', 'aaaaaaaa-0000-0000-0000-000000000011', 'cleared'),
  ('aaaaaaaa-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-0000000000cc', 'aaaaaaaa-0000-0000-0000-000000000012', 'not_cleared');
insert into adjustments (id, org_id, learner_id, kind, amount_cents, reason, requested_by) values
  ('aaaaaaaa-0000-0000-0000-0000000000ad', 'aaaaaaaa-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000011', 'waiver', 100000, 'Hardship', '00000000-0000-0000-0000-0000000000b1');

-- ---------- Tests ----------
create or replace function pg_temp.as_user(uid text) returns void language sql as $$ select set_config('request.jwt.claim.sub', uid, true) $$;

-- Director A
begin; select pg_temp.as_user('00000000-0000-0000-0000-0000000000d1'); set local role authenticated;
select pg_temp.check('director A sees all A learners', (select count(*) from learners), 3);
select pg_temp.check('director A sees A ledger', (select count(*) from ledger_entries), 2);
select pg_temp.check('director A sees no B families', (select count(*) from families where org_id = 'bbbbbbbb-0000-0000-0000-000000000000'), 0);
select pg_temp.check('family balance view', (select balance_cents from family_balances where family_id = 'aaaaaaaa-0000-0000-0000-0000000000f0'), 3000000);
select pg_temp.expect_error('audit log is service-role only', 'select count(*) from audit_log');
select pg_temp.expect_error('payment secrets are service-role only', 'select count(*) from payment_integrations');
select pg_temp.check('ledger edits change nothing through the API', pg_temp.affected($q$update ledger_entries set amount_cents = 1$q$), 0);
select pg_temp.expect_error('payments cannot be deleted', 'delete from payments');
commit;

-- Director B: complete isolation from school A
begin; select pg_temp.as_user('00000000-0000-0000-0000-0000000000d2'); set local role authenticated;
select pg_temp.check('director B sees only B learners', (select count(*) from learners), 1);
select pg_temp.check('director B sees no A payments', (select count(*) from payments), 0);
select pg_temp.check('director B sees no A ledger', (select count(*) from ledger_entries), 0);
select pg_temp.check('director B cannot update A payments', pg_temp.affected($q$update payments set match_status = 'not_ours'$q$), 0);
select pg_temp.expect_error('director B cannot write into school A', $q$insert into families (org_id, code, display_name) values ('aaaaaaaa-0000-0000-0000-000000000000', 'X', 'X')$q$);
commit;

-- Bursar scoped to the Ruiru campus
begin; select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1'); set local role authenticated;
select pg_temp.check('campus bursar sees only Ruiru learners', (select count(*) from learners), 2);
select pg_temp.check('campus bursar sees only Ruiru ledger', (select count(*) from ledger_entries), 1);
select pg_temp.check('bursar can update matching', pg_temp.affected($q$update payments set match_status = 'manual'$q$), 1);
select pg_temp.expect_error('payment amount is immutable', 'update payments set amount_cents = 1');
select pg_temp.expect_error('duplicate provider_ref rejected', $q$insert into payments (org_id, provider_ref, amount_cents, paid_at, channel) values ('aaaaaaaa-0000-0000-0000-000000000000', 'SBX001', 100, now(), 'c2b')$q$);
select pg_temp.check('bursar cannot approve waivers', pg_temp.affected($q$update adjustments set approved_by = '00000000-0000-0000-0000-0000000000b1'$q$), 0);
commit;

-- Head approves the bursar's waiver; nobody approves their own
begin; select pg_temp.as_user('00000000-0000-0000-0000-0000000000a2'); set local role authenticated;
select pg_temp.expect_error('approver must be the signed-in user', $q$update adjustments set approved_by = '00000000-0000-0000-0000-0000000000d1'$q$);
select pg_temp.check('head approves the waiver', pg_temp.affected($q$update adjustments set approved_by = '00000000-0000-0000-0000-0000000000a2'$q$), 1);
commit;
begin; select pg_temp.as_user('00000000-0000-0000-0000-0000000000a2'); set local role authenticated;
select pg_temp.expect_error('approved adjustments are frozen', $q$update adjustments set reason = 'changed'$q$);
commit;

-- Class teacher of Grade 4 East: their learners, clearance only, never money or contacts
begin; select pg_temp.as_user('00000000-0000-0000-0000-0000000000c1'); set local role authenticated;
select pg_temp.check('teacher sees only their stream', (select count(*) from learners), 1);
select pg_temp.check('teacher sees clearance for their stream', (select count(*) from class_clearance where status is not null), 1);
select pg_temp.check('teacher sees no ledger', (select count(*) from ledger_entries), 0);
select pg_temp.check('teacher sees no invoices', (select count(*) from invoices), 0);
select pg_temp.check('teacher sees no invoice lines', (select count(*) from invoice_lines), 0);
select pg_temp.check('teacher sees no payments', (select count(*) from payments), 0);
select pg_temp.check('teacher sees no balances', (select count(*) from family_balances), 0);
select pg_temp.check('teacher sees no guardians', (select count(*) from guardians), 0);
select pg_temp.check('teacher sees no families', (select count(*) from families), 0);
select pg_temp.expect_error('teacher cannot record payments', $q$insert into payments (org_id, provider_ref, amount_cents, paid_at, channel) values ('aaaaaaaa-0000-0000-0000-000000000000', 'T1', 100, now(), 'cash')$q$);
insert into notices (org_id, title, body_en, audience, created_by, approval_status, emergency) values ('aaaaaaaa-0000-0000-0000-000000000000', 'Trip', 'Hello', '{"kind":"stream"}', '00000000-0000-0000-0000-0000000000c1', 'approved', true);
select pg_temp.check('teacher notices await approval and cannot be emergencies', (select count(*) from notices where approval_status = 'pending' and not emergency), 1);
commit;

-- Transport coordinator: their route's learners only
begin; select pg_temp.as_user('00000000-0000-0000-0000-0000000000e1'); set local role authenticated;
select pg_temp.check('transport sees route learners only', (select count(*) from learners), 1);
select pg_temp.check('transport sees no ledger', (select count(*) from ledger_entries), 0);
commit;

-- Front office: look up families, update contacts (audited), never change charges
begin; select pg_temp.as_user('00000000-0000-0000-0000-0000000000f1'); set local role authenticated;
select pg_temp.check('front office reads families', (select count(*) from families), 2);
select pg_temp.check('front office updates a contact', pg_temp.affected($q$update guardians set email = 'j@x'$q$), 1);
select pg_temp.expect_error('front office cannot add charges', $q$insert into ledger_entries (org_id, learner_id, kind, description, amount_cents) values ('aaaaaaaa-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000011', 'charge', 'x', 1)$q$);
commit;

-- Sponsor: only their sponsor lines
begin; select pg_temp.as_user('00000000-0000-0000-0000-0000000000a1'); set local role authenticated;
select pg_temp.check('sponsor sees only sponsor lines', (select count(*) from invoice_lines), 1);
select pg_temp.check('sponsor sees no learners directly', (select count(*) from learners), 0);
commit;

-- Anonymous: nothing
begin; set local role anon;
select pg_temp.expect_error('anon cannot read learners', 'select count(*) from learners');
commit;

-- Integrity (even the service role cannot rewrite history)
select pg_temp.expect_error('even the service role cannot edit the ledger', 'update ledger_entries set amount_cents = 1');
select pg_temp.expect_error('allocations are append-only', 'update allocations set amount_cents = 0');
select pg_temp.expect_error('allocations cannot be deleted', 'delete from allocations');
select pg_temp.expect_error('debtors audience rejected', $q$insert into audiences (org_id, name, spec) values ('aaaaaaaa-0000-0000-0000-000000000000', 'x', '{"kind":"debtors"}')$q$);
select pg_temp.expect_error('admission number unique per campus', $q$insert into learners (org_id, campus_id, family_id, admission_number, first_name, last_name) values ('aaaaaaaa-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-0000000000c1', 'aaaaaaaa-0000-0000-0000-0000000000f0', '2041', 'X', 'Y')$q$);
select pg_temp.expect_error('override needs a reason', $q$update clearance_status set status = 'overridden' where learner_id = 'aaaaaaaa-0000-0000-0000-000000000012'$q$);
insert into learners (org_id, campus_id, family_id, admission_number, first_name, last_name) values ('aaaaaaaa-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-0000000000c2', 'aaaaaaaa-0000-0000-0000-0000000000f0', '2041', 'Same', 'Number');
select pg_temp.check('same admission number allowed on another campus', (select count(*) from learners where admission_number = '2041'), 3);
select pg_temp.check('money and contact changes are audited', (select (count(*) >= 4)::int from audit_log where entity in ('payments', 'adjustments', 'guardians')), 1);
-- Sign-in and bookings
insert into staff_invitations (org_id, email, role, stream_ids, invited_by) values ('aaaaaaaa-0000-0000-0000-000000000000', 'new.teacher@x', 'class_teacher', '{aaaaaaaa-0000-0000-0000-00000000004e}', '00000000-0000-0000-0000-0000000000d1');
insert into auth.users (id, email, raw_user_meta_data) values ('00000000-0000-0000-0000-0000000000a9', 'New.Teacher@x', '{"full_name":"New Teacher"}');
select pg_temp.check('accepting an invitation creates the membership', (select count(*) from memberships where user_id = '00000000-0000-0000-0000-0000000000a9' and role = 'class_teacher'), 1);
select pg_temp.check('a profile is created for every new user', (select count(*) from profiles where id = '00000000-0000-0000-0000-0000000000a9' and full_name = 'New Teacher'), 1);
insert into demo_requests (school_name, role, phone) values ('Test School', 'Director', '254712345678');
begin; select pg_temp.as_user('00000000-0000-0000-0000-0000000000d1'); set local role authenticated;
select pg_temp.check('school directors cannot read demo bookings', (select count(*) from demo_requests), 0);
select pg_temp.check('directors see their invitations', (select count(*) from staff_invitations), 1);
select pg_temp.expect_error('parent login codes are service-role only', 'select count(*) from parent_login_codes');
commit;
begin; select pg_temp.as_user('00000000-0000-0000-0000-0000000000d2'); set local role authenticated;
select pg_temp.check('other schools cannot see invitations', (select count(*) from staff_invitations), 0);
select pg_temp.expect_error('other schools cannot invite into school A', $q$insert into staff_invitations (org_id, email, role, invited_by) values ('aaaaaaaa-0000-0000-0000-000000000000', 'x@y', 'bursar', '00000000-0000-0000-0000-0000000000d2')$q$);
commit;
insert into shulife_admins (user_id) values ('00000000-0000-0000-0000-0000000000d2');
begin; select pg_temp.as_user('00000000-0000-0000-0000-0000000000d2'); set local role authenticated;
select pg_temp.check('Shulife admins read demo bookings', (select count(*) from demo_requests), 1);
commit;
begin; set local role anon;
select pg_temp.expect_error('anonymous visitors cannot read bookings', 'select count(*) from demo_requests');
commit;
\echo ALL RLS TESTS PASSED
