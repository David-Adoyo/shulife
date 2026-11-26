-- Removes the demo school ("Mlima Academy") and everything belonging to it.
-- History tables are append-only, so their triggers are switched off for this session only.
-- Run in the Supabase SQL editor (or psql) as the postgres user.
begin;
set local session_replication_role = replica;
do $$
declare org uuid := (select id from organisations where name = 'Mlima Academy' limit 1);
  t text;
begin
  if org is null then raise notice 'No demo school found'; return; end if;
  foreach t in array array['parent_login_codes','staff_invitations','consent_responses','inbox_messages','inbox_threads','messages_outbox','notices','clearance_status','clearance_rules','events','reminder_rules','audiences',
    'receipts','review_queue','manual_receipts','bank_deposits','allocation_change_requests','allocations','stk_requests','ratiba_mandates','payer_links','payments','raw_mpesa_events','payment_integrations',
    'plan_instalments','payment_plans','adjustments','ledger_entries','invoice_lines','invoices','sponsorships','sponsors','discount_rules','optional_subscriptions','fee_structure_rows','fee_structures','fee_items',
    'admission_aliases','enrolments','learner_guardians','guardians','learners','families','transport_routes','streams','grades','terms','academic_years','memberships','campuses','subscription_invoices','subscriptions','audit_log'] loop
    execute format('delete from %I where org_id = $1', t) using org;
  end loop;
  delete from organisations where id = org;
  raise notice 'Demo school removed';
end $$;
commit;
