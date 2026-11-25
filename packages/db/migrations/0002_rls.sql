-- Row Level Security (§6.6). Every policy checks the organisation and the
-- member's campus scope. Class teachers never see money. Parents never query
-- tables directly: server routes verify a signed parent token and use the
-- service role. Secrets, raw events and the audit log are service-role only.

-- ---------- Helpers (security definer so policies don't recurse on memberships) ----------
create or replace function app.has_role(p_org uuid, p_roles app.role[]) returns boolean
language sql stable security definer set search_path = public, app as $$
  select exists (select 1 from memberships m where m.org_id = p_org and m.user_id = auth.uid() and m.archived_at is null and m.role = any (p_roles))
$$;

create or replace function app.is_staff(p_org uuid) returns boolean
language sql stable security definer set search_path = public, app as $$
  select app.has_role(p_org, array['director', 'head', 'bursar', 'front_office', 'class_teacher', 'transport']::app.role[])
$$;

create or replace function app.office(p_org uuid) returns boolean
language sql stable security definer set search_path = public, app as $$
  select app.has_role(p_org, array['director', 'head', 'bursar', 'front_office']::app.role[])
$$;

create or replace function app.money_writer(p_org uuid) returns boolean
language sql stable security definer set search_path = public, app as $$
  select app.has_role(p_org, array['director', 'bursar']::app.role[])
$$;

create or replace function app.campus_ok(p_org uuid, p_campus uuid) returns boolean
language sql stable security definer set search_path = public, app as $$
  select exists (
    select 1 from memberships m
    where m.org_id = p_org and m.user_id = auth.uid() and m.archived_at is null
      and m.role in ('director', 'head', 'bursar', 'front_office')
      and (m.campus_ids is null or p_campus = any (m.campus_ids)))
$$;

-- Learners a user may see: office staff in campus scope; teachers via their streams; transport via their routes.
create or replace function app.learner_visible(p_learner uuid) returns boolean
language sql stable security definer set search_path = public, app as $$
  select exists (select 1 from learners l where l.id = p_learner and app.campus_ok(l.org_id, l.campus_id))
      or exists (
        select 1 from enrolments e join memberships m on m.org_id = e.org_id and m.user_id = auth.uid() and m.archived_at is null
        where e.learner_id = p_learner
          and ((m.role = 'class_teacher' and e.stream_id = any (m.stream_ids))
            or (m.role = 'transport' and e.route_id = any (m.route_ids))))
$$;

create or replace function app.learner_money_ok(p_learner uuid) returns boolean
language sql stable security definer set search_path = public, app as $$
  select exists (select 1 from learners l where l.id = p_learner and app.campus_ok(l.org_id, l.campus_id))
$$;

create or replace function app.is_my_sponsor(p_sponsor uuid) returns boolean
language sql stable security definer set search_path = public, app as $$
  select exists (select 1 from sponsors s where s.id = p_sponsor and s.user_id = auth.uid())
$$;

grant usage on schema app to authenticated, service_role;
grant execute on all functions in schema app to authenticated, service_role;

-- ---------- Enable RLS everywhere ----------
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);
  end loop;
end $$;

grant usage on schema public to authenticated, service_role;
grant select, insert, update on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant usage on all sequences in schema public to authenticated, service_role;
-- Nobody deletes through the API; archived_at is the soft delete.
revoke delete on all tables in schema public from authenticated;
-- Service-role only: secrets, raw events, audit log.
revoke all on payment_integrations, raw_mpesa_events, audit_log from authenticated;
create policy service_only on payment_integrations for all to service_role using (true);
create policy service_only on raw_mpesa_events for all to service_role using (true);
create policy service_only on audit_log for all to service_role using (true);

-- ---------- Organisation ----------
create policy member_read on organisations for select to authenticated using (app.is_staff(id) or app.has_role(id, '{sponsor}'));
create policy director_update on organisations for update to authenticated using (app.has_role(id, '{director}'));
create policy read_own_or_director on memberships for select to authenticated using (user_id = auth.uid() or app.has_role(org_id, '{director}'));
create policy director_manage on memberships for insert to authenticated with check (app.has_role(org_id, '{director}'));
create policy director_update on memberships for update to authenticated using (app.has_role(org_id, '{director}'));
create policy staff_read on subscriptions for select to authenticated using (app.has_role(org_id, '{director}'));
create policy director_read on subscription_invoices for select to authenticated using (app.has_role(org_id, '{director}'));

-- Reference data every staff member can read; directors/heads/bursars maintain it.
do $$
declare t text;
begin
  foreach t in array array['academic_years', 'terms', 'grades', 'fee_items', 'discount_rules', 'events', 'clearance_rules', 'reminder_rules', 'audiences'] loop
    execute format('create policy staff_read on %I for select to authenticated using (app.is_staff(org_id))', t);
    execute format('create policy admin_write on %I for insert to authenticated with check (app.has_role(org_id, %L))', t, '{director,head,bursar}');
    execute format('create policy admin_update on %I for update to authenticated using (app.has_role(org_id, %L))', t, '{director,head,bursar}');
  end loop;
end $$;

-- Campus-scoped reference data
create policy scoped_read on campuses for select to authenticated using (app.campus_ok(org_id, id) or (app.is_staff(org_id) and not app.office(org_id)));
create policy director_write on campuses for insert to authenticated with check (app.has_role(org_id, '{director}'));
create policy director_update on campuses for update to authenticated using (app.has_role(org_id, '{director}'));
create policy scoped_read on streams for select to authenticated using (app.campus_ok(org_id, campus_id) or app.is_staff(org_id));
create policy admin_write on streams for insert to authenticated with check (app.has_role(org_id, '{director,head}'));
create policy admin_update on streams for update to authenticated using (app.has_role(org_id, '{director,head}'));
create policy scoped_read on transport_routes for select to authenticated using (app.campus_ok(org_id, campus_id) or app.has_role(org_id, '{transport}'));
create policy admin_write on transport_routes for insert to authenticated with check (app.has_role(org_id, '{director,bursar}') or app.has_role(org_id, '{transport}'));
create policy admin_update on transport_routes for update to authenticated using (app.has_role(org_id, '{director,bursar,transport}'));

-- ---------- People ----------
create policy visible_read on learners for select to authenticated using (app.learner_visible(id));
create policy admin_write on learners for insert to authenticated with check (app.has_role(org_id, '{director,head,bursar}') and app.campus_ok(org_id, campus_id));
create policy admin_update on learners for update to authenticated using (app.has_role(org_id, '{director,head,bursar}') and app.campus_ok(org_id, campus_id));
create policy visible_read on enrolments for select to authenticated using (app.learner_visible(learner_id));
create policy admin_write on enrolments for insert to authenticated with check (app.has_role(org_id, '{director,head,bursar}'));
create policy admin_update on enrolments for update to authenticated using (app.has_role(org_id, '{director,head,bursar,transport}'));
create policy office_read on admission_aliases for select to authenticated using (app.office(org_id));
create policy money_write on admission_aliases for insert to authenticated with check (app.money_writer(org_id));

-- Families and guardians: office staff only (teachers and transport never see contacts).
create policy office_read on families for select to authenticated using (app.office(org_id));
create policy admin_write on families for insert to authenticated with check (app.has_role(org_id, '{director,head,bursar}'));
create policy admin_update on families for update to authenticated using (app.has_role(org_id, '{director,head,bursar}'));
create policy office_read on guardians for select to authenticated using (app.office(org_id));
create policy admin_write on guardians for insert to authenticated with check (app.has_role(org_id, '{director,head,bursar}'));
-- Front office may update contact details (audited by trigger).
create policy office_update on guardians for update to authenticated using (app.office(org_id));
create policy office_read on learner_guardians for select to authenticated using (app.office(org_id));
create policy admin_write on learner_guardians for insert to authenticated with check (app.has_role(org_id, '{director,head,bursar}'));

-- ---------- Money (office staff read in campus scope; directors and bursars write) ----------
do $$
declare t text;
begin
  foreach t in array array['fee_structures', 'fee_structure_rows', 'sponsorships', 'payment_plans', 'plan_instalments', 'payments', 'allocations',
                           'allocation_change_requests', 'payer_links', 'review_queue', 'manual_receipts', 'bank_deposits', 'stk_requests',
                           'ratiba_mandates', 'receipts', 'invoice_lines', 'optional_subscriptions', 'sponsors'] loop
    execute format('create policy office_read on %I for select to authenticated using (app.office(org_id))', t);
    execute format('create policy money_write on %I for insert to authenticated with check (app.money_writer(org_id))', t);
  end loop;
end $$;
create policy scoped_read on invoices for select to authenticated using (app.campus_ok(org_id, campus_id));
create policy money_write on invoices for insert to authenticated with check (app.money_writer(org_id) and app.campus_ok(org_id, campus_id));
create policy scoped_read on ledger_entries for select to authenticated using (app.learner_money_ok(learner_id));
create policy money_write on ledger_entries for insert to authenticated with check (app.money_writer(org_id) and app.learner_money_ok(learner_id));
create policy office_read on adjustments for select to authenticated using (app.office(org_id));
create policy request on adjustments for insert to authenticated with check (app.has_role(org_id, '{director,head,bursar}') and requested_by = auth.uid());
create policy approve on adjustments for update to authenticated using (app.has_role(org_id, '{director,head}'));
-- Matching/plan/queue workflow updates (immutable columns are protected by triggers).
create policy money_update on payments for update to authenticated using (app.money_writer(org_id));
create policy money_update on review_queue for update to authenticated using (app.money_writer(org_id));
create policy money_update on payment_plans for update to authenticated using (app.money_writer(org_id));
create policy money_update on plan_instalments for update to authenticated using (app.money_writer(org_id));
create policy money_update on fee_structures for update to authenticated using (app.money_writer(org_id));
create policy money_update on fee_structure_rows for update to authenticated using (app.money_writer(org_id));
create policy money_update on allocation_change_requests for update to authenticated using (app.money_writer(org_id));
create policy money_update on manual_receipts for update to authenticated using (app.money_writer(org_id));
create policy money_update on stk_requests for update to authenticated using (app.money_writer(org_id));
create policy money_update on receipts for update to authenticated using (app.office(org_id));
-- Sponsors see only their own sponsorships and sponsor lines.
create policy sponsor_read on sponsorships for select to authenticated using (app.is_my_sponsor(sponsor_id));
create policy sponsor_read on invoice_lines for select to authenticated using (app.is_my_sponsor(sponsor_id));
create policy sponsor_self on sponsors for select to authenticated using (user_id = auth.uid());

-- ---------- Communication ----------
create policy office_read on notices for select to authenticated using (app.office(org_id) or created_by = auth.uid());
create policy staff_write on notices for insert to authenticated with check (app.has_role(org_id, '{director,head,front_office,class_teacher}') and created_by = auth.uid());
create policy approve on notices for update to authenticated using (app.has_role(org_id, '{director,head}'));
create policy office_read on messages_outbox for select to authenticated using (app.office(org_id));
create policy office_read on consent_responses for select to authenticated using (app.office(org_id));
create policy office_read on inbox_threads for select to authenticated using (app.office(org_id));
create policy office_update on inbox_threads for update to authenticated using (app.office(org_id));
create policy office_read on inbox_messages for select to authenticated using (app.office(org_id));
create policy office_write on inbox_messages for insert to authenticated with check (app.office(org_id));
-- Clearance has no money columns, so teachers may read it for their streams.
create policy visible_read on clearance_status for select to authenticated using (app.learner_visible(learner_id));
create policy admin_write on clearance_status for insert to authenticated with check (app.has_role(org_id, '{director,head,bursar}'));
create policy admin_update on clearance_status for update to authenticated using (app.has_role(org_id, '{director,head,bursar}'));

-- ---------- Views (security invoker: the caller's RLS applies) ----------
-- Family balance = sum of each learner's ledger. Office staff only.
create view family_balances with (security_invoker = true) as
  select l.org_id, l.family_id, sum(coalesce(le.amount_cents, 0))::bigint as balance_cents
  from learners l left join ledger_entries le on le.learner_id = l.id
  where app.office(l.org_id)
  group by l.org_id, l.family_id;

-- What a class teacher sees: names and clearance only — no money columns at all.
create view class_clearance with (security_invoker = true) as
  select e.org_id, e.stream_id, e.term_id, l.id as learner_id, l.first_name, l.last_name, cs.rule_id, cs.status
  from enrolments e
  join learners l on l.id = e.learner_id
  left join clearance_status cs on cs.learner_id = l.id;

grant select on family_balances, class_clearance to authenticated, service_role;
