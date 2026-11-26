-- Pin search_path on every function (Supabase advisor: function_search_path_mutable).
alter function app.forbid_change() set search_path = public, app;
alter function app.payment_facts_immutable() set search_path = public, app;
alter function app.receipt_number_immutable() set search_path = public, app;
alter function app.invoice_facts_immutable() set search_path = public, app;
alter function app.structure_frozen() set search_path = public, app;
alter function app.touch() set search_path = public, app;
comment on table parent_login_codes is 'Service-role only by design: no RLS policies, no grants to anon or authenticated.';
