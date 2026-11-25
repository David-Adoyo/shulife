-- Integrity: append-only money, immutable payment facts, audit trail, updated_at.

-- Never edit or delete ledger entries, allocations, raw events, receipts' numbers or the audit log (§18).
create or replace function app.forbid_change() returns trigger language plpgsql as $$
begin
  raise exception '% is append-only: add an adjusting entry instead', tg_table_name using errcode = 'P0001';
end $$;

do $$
declare t text;
begin
  foreach t in array array['ledger_entries', 'allocations', 'raw_mpesa_events', 'audit_log', 'invoice_lines'] loop
    execute format('create trigger append_only before update or delete on %I for each row execute function app.forbid_change()', t);
  end loop;
end $$;

-- Payments: matching may change, the facts of the payment may not. No deletes at all.
create or replace function app.payment_facts_immutable() returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'payments are never deleted; mark as reversed instead' using errcode = 'P0001';
  end if;
  if new.provider_ref is distinct from old.provider_ref or new.amount_cents is distinct from old.amount_cents
     or new.paid_at is distinct from old.paid_at or new.msisdn_hash is distinct from old.msisdn_hash
     or new.bill_ref is distinct from old.bill_ref or new.channel is distinct from old.channel or new.org_id is distinct from old.org_id then
    raise exception 'payment facts are immutable' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger payment_facts before update or delete on payments for each row execute function app.payment_facts_immutable();

-- Receipt numbers and invoices are permanent too.
create or replace function app.receipt_number_immutable() returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' or new.number is distinct from old.number or new.verify_code is distinct from old.verify_code then
    raise exception 'receipt numbers are permanent' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger receipt_number before update or delete on receipts for each row execute function app.receipt_number_immutable();
create or replace function app.invoice_facts_immutable() returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' or new.number is distinct from old.number or new.total_cents is distinct from old.total_cents
     or new.learner_id is distinct from old.learner_id or new.term_id is distinct from old.term_id then
    raise exception 'invoices are permanent; correct them with an adjustment' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger invoice_facts before update or delete on invoices for each row execute function app.invoice_facts_immutable();

-- Published or approved fee structures are frozen; make a new version.
create or replace function app.structure_frozen() returns trigger language plpgsql as $$
begin
  if old.status = 'published' then raise exception 'a published fee structure cannot change; create a new version' using errcode = 'P0001'; end if;
  return new;
end $$;
create trigger structure_frozen before update on fee_structures for each row execute function app.structure_frozen();

-- Waivers: the approver must not be the requester, and must hold an approving role.
create or replace function app.adjustment_approval() returns trigger language plpgsql security definer set search_path = public, app as $$
begin
  if new.approved_by is not null and old.approved_by is null then
    if new.approved_by = new.requested_by then raise exception 'you cannot approve your own request' using errcode = 'P0001'; end if;
    if new.approved_by <> auth.uid() and auth.uid() is not null then raise exception 'approver must be the signed-in user' using errcode = 'P0001'; end if;
    new.approved_at := now();
  end if;
  if old.approved_by is not null then raise exception 'an approved adjustment cannot change' using errcode = 'P0001'; end if;
  return new;
end $$;
create trigger adjustment_approval before update on adjustments for each row execute function app.adjustment_approval();

-- Audit every money, permission and contact change.
create or replace function app.audit() returns trigger language plpgsql security definer set search_path = public, app as $$
declare v_org uuid; v_id text;
begin
  v_org := coalesce((case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end)->>'org_id', null)::uuid;
  v_id := coalesce((case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end)->>'id', null);
  insert into audit_log (org_id, actor, action, entity, entity_id, detail)
  values (v_org, auth.uid(), lower(tg_op), tg_table_name, v_id,
          case when tg_op = 'UPDATE' then jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new)) else to_jsonb(coalesce(new, old)) end);
  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array['payments', 'allocations', 'ledger_entries', 'adjustments', 'manual_receipts', 'bank_deposits', 'memberships',
                           'guardians', 'fee_structures', 'payment_plans', 'review_queue', 'clearance_status', 'payment_integrations', 'invoices'] loop
    execute format('create trigger audit after insert or update on %I for each row execute function app.audit()', t);
  end loop;
end $$;

-- updated_at maintenance
create or replace function app.touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
do $$
declare t text;
begin
  for t in select c.table_name from information_schema.columns c where c.table_schema = 'public' and c.column_name = 'updated_at'
           and c.table_name in (select tablename from pg_tables where schemaname = 'public') loop
    execute format('create trigger touch before update on %I for each row execute function app.touch()', t);
  end loop;
end $$;

-- Teacher notices may need head approval (school setting); a teacher can never self-approve.
create or replace function app.notice_approval() returns trigger language plpgsql security definer set search_path = public, app as $$
begin
  if app.has_role(new.org_id, '{class_teacher}') and not app.has_role(new.org_id, '{director,head}') then
    new.approval_status := 'pending';
    new.emergency := false; -- emergency broadcast is director/head only
  end if;
  return new;
end $$;
create trigger notice_approval before insert on notices for each row execute function app.notice_approval();
