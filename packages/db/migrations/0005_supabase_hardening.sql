-- Supabase hardening and file storage.
-- Supabase grants new public tables to `anon` by default; RLS already blocks it,
-- but anonymous visitors should hold no table privileges at all.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;
revoke all on schema app from anon;
revoke execute on all functions in schema app from public, anon;
grant execute on all functions in schema app to authenticated, service_role;

-- Private buckets (§5.1): every object path starts with the organisation id, e.g. "<org_id>/receipts/RCT-….pdf".
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'storage' and table_name = 'buckets') then
    insert into storage.buckets (id, name, public)
    values ('crests', 'crests', false), ('receipts', 'receipts', false), ('statements', 'statements', false), ('slips', 'slips', false), ('consent', 'consent', false)
    on conflict (id) do nothing;

    -- Office staff read their own school's files; bursars and directors upload slip photos;
    -- directors manage crests. Receipts, statements and consent PDFs are written by the server (service role).
    execute $p$create policy "school files: office read" on storage.objects for select to authenticated
      using (bucket_id in ('crests', 'receipts', 'statements', 'slips', 'consent') and app.office(nullif(split_part(name, '/', 1), '')::uuid))$p$;
    execute $p$create policy "school files: slip upload" on storage.objects for insert to authenticated
      with check (bucket_id = 'slips' and app.money_writer(nullif(split_part(name, '/', 1), '')::uuid))$p$;
    execute $p$create policy "school files: crest upload" on storage.objects for insert to authenticated
      with check (bucket_id = 'crests' and app.has_role(nullif(split_part(name, '/', 1), '')::uuid, '{director}'))$p$;
    execute $p$create policy "school files: crest replace" on storage.objects for update to authenticated
      using (bucket_id = 'crests' and app.has_role(nullif(split_part(name, '/', 1), '')::uuid, '{director}'))$p$;
  end if;
end $$;
