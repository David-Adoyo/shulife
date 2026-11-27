-- A per-school change counter. Every transaction that writes to the tables the app loads
-- bumps it once, so each
-- server can tell cheaply whether its in-memory copy of the school is out of date.
create table org_versions (
  org_id uuid primary key references organisations(id) on delete cascade,
  version bigint not null default 1,
  last_txid bigint,
  updated_at timestamptz not null default now()
);
alter table org_versions enable row level security;
alter table org_versions force row level security;
revoke all on org_versions from anon, authenticated;
grant all on org_versions to service_role;

create or replace function app.bump_org_version() returns trigger
language plpgsql security definer set search_path = public, app as $$
declare o uuid;
begin
  o := case when tg_table_name = 'organisations' then coalesce(new.id, old.id)
            else coalesce((to_jsonb(new) ->> 'org_id')::uuid, (to_jsonb(old) ->> 'org_id')::uuid) end;
  if o is not null then
    -- One bump per transaction, however many rows it writes.
    insert into public.org_versions as v (org_id, last_txid) values (o, txid_current())
    on conflict (org_id) do update set version = v.version + 1, last_txid = excluded.last_txid, updated_at = now()
    where v.last_txid is distinct from excluded.last_txid;
  end if;
  return null;
end $$;

do $$
declare t text;
begin
  foreach t in array array['organisations','campuses','grades','streams','terms','families','guardians','learners','sponsors',
    'transport_routes','fee_items','fee_structure_rows','invoices','invoice_lines','payments','allocations','ledger_entries',
    'payer_links','payment_plans','plan_instalments'] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop trigger if exists bump_version on public.%I', t);
      execute format('create trigger bump_version after insert or update or delete on public.%I for each row execute function app.bump_org_version()', t);
    end if;
  end loop;
end $$;

insert into org_versions (org_id) select id from organisations on conflict do nothing;
