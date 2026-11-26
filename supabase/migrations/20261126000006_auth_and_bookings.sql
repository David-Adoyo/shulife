-- Sign-in and bookings.
--  • profiles: one row per Supabase Auth user (staff and Shulife admins).
--  • staff_invitations: a director invites by email; when that person accepts the
--    Supabase invite, their membership is created automatically.
--  • shulife_admins: Shulife's own staff (admin console, demo bookings).
--  • parent_login_codes: one-time SMS codes for parents (hashed, service-role only).
--  • demo_requests: "Book a demo" leads from the marketing site (§9.3).

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table staff_invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id),
  email text not null check (email = lower(email) and email like '%@%'),
  role app.role not null check (role <> 'sponsor'),
  campus_ids uuid[],
  stream_ids uuid[],
  route_ids uuid[],
  invited_by uuid not null,
  accepted_by uuid references auth.users(id),
  accepted_at timestamptz,
  expires_at timestamptz not null default now() + interval '14 days',
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index staff_invitations_pending on staff_invitations (org_id, email, role) where accepted_at is null and revoked_at is null;

create table shulife_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table parent_login_codes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organisations(id),
  guardian_id uuid not null references guardians(id),
  code_hash text not null,
  expires_at timestamptz not null default now() + interval '10 minutes',
  attempts int not null default 0 check (attempts <= 5),
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index on parent_login_codes (guardian_id, created_at desc);

create table demo_requests (
  id uuid primary key default gen_random_uuid(),
  school_name text not null check (length(trim(school_name)) between 2 and 160),
  role text not null,
  learners_band text,
  county text,
  phone text not null check (phone ~ '^254[17][0-9]{8}$'),
  best_time text,
  source text not null default 'website',
  status text not null default 'new' check (status in ('new', 'contacted', 'demo_booked', 'won', 'lost', 'spam')),
  notes text,
  assigned_to uuid references auth.users(id),
  booked_for timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on demo_requests (status, created_at desc);

-- ---------- Helpers ----------
create or replace function app.is_shulife_admin() returns boolean
language sql stable security definer set search_path = public, app as $$
  select exists (select 1 from shulife_admins where user_id = auth.uid())
$$;
grant execute on function app.is_shulife_admin() to authenticated, service_role;

-- New Supabase user → profile; if they were invited, create their membership(s).
create or replace function app.handle_new_user() returns trigger
language plpgsql security definer set search_path = public, app as $$
declare inv record;
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, lower(new.email), coalesce(new.raw_user_meta_data->>'full_name', null))
  on conflict (id) do nothing;
  for inv in
    select * from public.staff_invitations
    where email = lower(new.email) and accepted_at is null and revoked_at is null and expires_at > now()
  loop
    insert into public.memberships (org_id, user_id, role, campus_ids, stream_ids, route_ids, created_by)
    values (inv.org_id, new.id, inv.role, inv.campus_ids, inv.stream_ids, inv.route_ids, inv.invited_by)
    on conflict (org_id, user_id, role) do nothing;
    update public.staff_invitations set accepted_by = new.id, accepted_at = now() where id = inv.id;
  end loop;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users for each row execute function app.handle_new_user();

-- ---------- RLS ----------
alter table profiles enable row level security;
alter table profiles force row level security;
alter table staff_invitations enable row level security;
alter table staff_invitations force row level security;
alter table shulife_admins enable row level security;
alter table shulife_admins force row level security;
alter table parent_login_codes enable row level security;
alter table parent_login_codes force row level security;
alter table demo_requests enable row level security;
alter table demo_requests force row level security;

grant select, insert, update on profiles, staff_invitations, demo_requests to authenticated;
grant select on shulife_admins to authenticated;
grant all on profiles, staff_invitations, shulife_admins, parent_login_codes, demo_requests to service_role;
revoke all on profiles, staff_invitations, shulife_admins, parent_login_codes, demo_requests from anon;
revoke all on parent_login_codes from authenticated; -- service-role only

-- Profiles: you, and directors of a school you belong to.
create policy own_profile on profiles for select to authenticated using (id = auth.uid() or exists (select 1 from memberships m where m.user_id = profiles.id and app.has_role(m.org_id, '{director}')));
create policy own_profile_update on profiles for update to authenticated using (id = auth.uid());

-- Invitations: directors manage their school's invitations.
create policy director_read on staff_invitations for select to authenticated using (app.has_role(org_id, '{director}'));
create policy director_invite on staff_invitations for insert to authenticated with check (app.has_role(org_id, '{director}') and invited_by = auth.uid());
create policy director_revoke on staff_invitations for update to authenticated using (app.has_role(org_id, '{director}'));

-- Admins see the admin list; demo bookings are for Shulife admins only (the website writes them with the service role).
create policy admins_read on shulife_admins for select to authenticated using (app.is_shulife_admin());
create policy admin_read on demo_requests for select to authenticated using (app.is_shulife_admin());
create policy admin_update on demo_requests for update to authenticated using (app.is_shulife_admin());

create trigger touch before update on profiles for each row execute function app.touch();
create trigger touch before update on demo_requests for each row execute function app.touch();
create trigger audit after insert or update on staff_invitations for each row execute function app.audit();
