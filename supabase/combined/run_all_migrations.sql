-- ============================================================================
-- 20260715120000_schema.sql
-- ============================================================================
-- FlockLine core schema: churches (tenants) and every tenant-scoped table.
-- Run this file, then _functions.sql, then _rls_policies.sql, in order.

-- ============================================================================
-- churches — the tenant table. Every other table is scoped to one church_id.
-- ============================================================================
create table public.churches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  phone text,
  location text,
  logo_url text,
  plan text not null default 'starter' check (plan in ('starter', 'pro', 'business')),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- church_users — links auth.users to a church with a role. One church per
-- user for MVP: user_id is UNIQUE (not just indexed), so a user can appear
-- in this table at most once.
-- ============================================================================
create table public.church_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  church_id uuid not null references public.churches (id) on delete cascade,
  role text not null default 'volunteer' check (role in ('admin', 'pastor', 'volunteer')),
  created_at timestamptz not null default now()
);

create index church_users_church_id_idx on public.church_users (church_id);

-- ============================================================================
-- members — the congregation roster.
-- ============================================================================
create table public.members (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  phone text, -- E.164 format; this is also their WhatsApp number
  gender text check (gender in ('male', 'female')),
  date_of_birth date,
  address text,
  joined_at date not null default current_date,
  status text not null default 'first_timer' check (status in ('first_timer', 'new_convert', 'member', 'inactive')),
  photo_url text,
  notes text,
  created_at timestamptz not null default now()
);

create index members_church_id_idx on public.members (church_id);
create index members_phone_idx on public.members (phone);

-- ============================================================================
-- tags + member_tags
-- ============================================================================
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  unique (church_id, name)
);

create index tags_church_id_idx on public.tags (church_id);

create table public.member_tags (
  member_id uuid not null references public.members (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (member_id, tag_id)
);

create index member_tags_member_id_idx on public.member_tags (member_id);
create index member_tags_tag_id_idx on public.member_tags (tag_id);

-- ============================================================================
-- follow_ups — visitor / pastoral-care tasks.
-- ============================================================================
create table public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  assigned_to uuid references public.church_users (id) on delete set null,
  type text not null check (type in ('visitor_welcome', 'new_convert', 'absentee', 'pastoral_care')),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'done')),
  due_date date,
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index follow_ups_church_id_idx on public.follow_ups (church_id);
create index follow_ups_member_id_idx on public.follow_ups (member_id);
create index follow_ups_assigned_to_idx on public.follow_ups (assigned_to);

-- ============================================================================
-- giving_funds + giving_records
-- ============================================================================
create table public.giving_funds (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (church_id, name)
);

create index giving_funds_church_id_idx on public.giving_funds (church_id);

create table public.giving_records (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  member_id uuid references public.members (id) on delete set null, -- null = anonymous giving
  fund_id uuid not null references public.giving_funds (id) on delete restrict,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'GHS' check (char_length(currency) = 3),
  method text not null check (method in ('paystack', 'momo_manual', 'cash')),
  reference text,
  recorded_by uuid references public.church_users (id) on delete set null,
  given_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index giving_records_church_id_idx on public.giving_records (church_id);
create index giving_records_member_id_idx on public.giving_records (member_id);
create index giving_records_fund_id_idx on public.giving_records (fund_id);

-- Guards against a duplicate-delivered Paystack webhook recording the same
-- payment twice. Partial index: only enforced when a reference is present.
create unique index giving_records_reference_key on public.giving_records (reference) where reference is not null;

-- ============================================================================
-- volunteer_teams, team_members, rota_assignments
-- ============================================================================
create table public.volunteer_teams (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (church_id, name)
);

create index volunteer_teams_church_id_idx on public.volunteer_teams (church_id);

create table public.team_members (
  team_id uuid not null references public.volunteer_teams (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (team_id, member_id)
);

create index team_members_team_id_idx on public.team_members (team_id);
create index team_members_member_id_idx on public.team_members (member_id);

create table public.rota_assignments (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.volunteer_teams (id) on delete cascade,
  service_date date not null,
  member_id uuid not null references public.members (id) on delete cascade,
  role text,
  created_at timestamptz not null default now()
);

create index rota_assignments_team_id_idx on public.rota_assignments (team_id);
create index rota_assignments_member_id_idx on public.rota_assignments (member_id);


-- ============================================================================
-- 20260715120100_functions.sql
-- ============================================================================
-- Helper functions used by RLS policies (_rls_policies.sql) and by the
-- onboarding flow (app/onboarding/actions.ts).

-- Returns the church_id of the currently authenticated user, or null if
-- they don't belong to a church yet (e.g. mid-onboarding).
--
-- SECURITY DEFINER + a pinned search_path are both required:
--   - SECURITY DEFINER lets this function read church_users bypassing RLS.
--     Without it, every policy that calls this function would trigger
--     church_users' own RLS policy, which itself calls this function —
--     infinite recursion.
--   - `set search_path` prevents a classic SECURITY DEFINER attack: without
--     a pinned path, a caller could shadow public.church_users with their
--     own same-named object earlier in the search path and hijack this
--     function's unqualified table reference.
create or replace function public.get_user_church_id()
returns uuid
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select church_id from public.church_users where user_id = auth.uid();
$$;

create or replace function public.get_user_role()
returns text
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select role from public.church_users where user_id = auth.uid();
$$;

create or replace function public.get_user_church_user_id()
returns uuid
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select id from public.church_users where user_id = auth.uid();
$$;

-- Onboarding entry point — the ONLY way a church_users row can be created.
-- There is deliberately no INSERT policy on churches or church_users for
-- ordinary authenticated requests (see _rls_policies.sql); this function
-- is SECURITY DEFINER so it can bypass that lockdown, but it's safe
-- because it never trusts client-supplied identity:
--   - the user is auth.uid(), not a function parameter
--   - the role is hardcoded to 'admin', not a parameter
--   - the church_id comes from the row this function just inserted, not
--     a parameter — so it's impossible to attach yourself to an existing
--     church by supplying its id.
create or replace function public.onboard_church(
  p_name text,
  p_phone text,
  p_location text
)
returns public.churches
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_church public.churches;
  v_slug_base text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if exists (select 1 from public.church_users where user_id = auth.uid()) then
    raise exception 'You already belong to a church';
  end if;

  if coalesce(trim(p_name), '') = '' then
    raise exception 'Church name is required';
  end if;

  v_slug_base := trim(both '-' from regexp_replace(lower(trim(p_name)), '[^a-z0-9]+', '-', 'g'));
  if v_slug_base = '' then
    v_slug_base := 'church';
  end if;

  insert into public.churches (name, phone, location, slug)
  values (
    trim(p_name),
    nullif(trim(p_phone), ''),
    nullif(trim(p_location), ''),
    v_slug_base || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)
  )
  returning * into v_church;

  insert into public.church_users (user_id, church_id, role)
  values (auth.uid(), v_church.id, 'admin');

  return v_church;
end;
$$;

revoke all on function public.onboard_church(text, text, text) from public;
grant execute on function public.onboard_church(text, text, text) to authenticated;


-- ============================================================================
-- 20260715120200_rls_policies.sql
-- ============================================================================
-- Row Level Security for every table. See the assistant's RLS walkthrough
-- for the reasoning behind each non-obvious decision below; short version:
--
--   * A table with RLS enabled and zero policies for a given command
--     denies that command outright — several tables (churches, church_users)
--     rely on this to block INSERT entirely, forcing writes through the
--     SECURITY DEFINER onboard_church() function instead.
--   * Wherever a row references another tenant-scoped table via foreign
--     key (member_id, tag_id, fund_id, assigned_to, team_id...), the
--     policy verifies that referenced row also belongs to the caller's
--     church — church_id alone is not sufficient.

alter table public.churches enable row level security;
alter table public.church_users enable row level security;
alter table public.members enable row level security;
alter table public.tags enable row level security;
alter table public.member_tags enable row level security;
alter table public.follow_ups enable row level security;
alter table public.giving_funds enable row level security;
alter table public.giving_records enable row level security;
alter table public.volunteer_teams enable row level security;
alter table public.team_members enable row level security;
alter table public.rota_assignments enable row level security;

-- ============================================================================
-- churches
-- ============================================================================
create policy "churches_select_own" on public.churches
  for select to authenticated
  using (id = public.get_user_church_id());

-- No INSERT or DELETE policy at all: creation only happens through
-- onboard_church() (SECURITY DEFINER, bypasses RLS); deleting a tenant is
-- deliberately not self-service.
create policy "churches_update_admin" on public.churches
  for update to authenticated
  using (id = public.get_user_church_id() and public.get_user_role() = 'admin')
  with check (id = public.get_user_church_id());

-- Column-level lockdown: the row-level policy above technically covers the
-- whole row, which would let an admin set their own `plan` to 'business'
-- for free, bypassing Paystack billing. Postgres column privileges are
-- enforced independently of RLS, so narrowing the grant closes that gap
-- regardless of what the row policy allows.
revoke update on public.churches from authenticated;
grant update (name, phone, location, logo_url) on public.churches to authenticated;

-- ============================================================================
-- church_users
-- ============================================================================
create policy "church_users_select_own_church" on public.church_users
  for select to authenticated
  using (church_id = public.get_user_church_id());

-- No INSERT policy: the first admin is created by onboard_church(). An
-- "insert if new row's church_id = my church_id" policy would still let
-- any authenticated user pick their own role, including 'admin' — a real
-- invite flow (out of scope for now) needs its own SECURITY DEFINER
-- function, not a raw INSERT policy.
create policy "church_users_update_admin" on public.church_users
  for update to authenticated
  using (church_id = public.get_user_church_id() and public.get_user_role() = 'admin')
  with check (church_id = public.get_user_church_id());

create policy "church_users_delete_admin" on public.church_users
  for delete to authenticated
  using (church_id = public.get_user_church_id() and public.get_user_role() = 'admin');

-- ============================================================================
-- members
-- ============================================================================
create policy "members_select_own_church" on public.members
  for select to authenticated
  using (church_id = public.get_user_church_id());

create policy "members_insert_own_church" on public.members
  for insert to authenticated
  with check (church_id = public.get_user_church_id());

create policy "members_update_own_church" on public.members
  for update to authenticated
  using (church_id = public.get_user_church_id())
  with check (church_id = public.get_user_church_id());

-- Deleting a member is admin-only per spec — any role can edit (correct a
-- typo, change status) but not permanently remove someone.
create policy "members_delete_admin" on public.members
  for delete to authenticated
  using (church_id = public.get_user_church_id() and public.get_user_role() = 'admin');

-- ============================================================================
-- tags
-- ============================================================================
create policy "tags_all_own_church" on public.tags
  for all to authenticated
  using (church_id = public.get_user_church_id())
  with check (church_id = public.get_user_church_id());

-- ============================================================================
-- member_tags — no church_id column of its own, so the policy verifies
-- BOTH the member and the tag belong to the caller's church. Checking only
-- one side would let someone tag their own church's member with a tag_id
-- borrowed from a different church (or vice versa).
-- ============================================================================
create policy "member_tags_all_own_church" on public.member_tags
  for all to authenticated
  using (
    exists (select 1 from public.members m where m.id = member_id and m.church_id = public.get_user_church_id())
    and exists (select 1 from public.tags t where t.id = tag_id and t.church_id = public.get_user_church_id())
  )
  with check (
    exists (select 1 from public.members m where m.id = member_id and m.church_id = public.get_user_church_id())
    and exists (select 1 from public.tags t where t.id = tag_id and t.church_id = public.get_user_church_id())
  );

-- ============================================================================
-- follow_ups — church_id alone isn't enough on write: member_id and
-- assigned_to must also resolve to a row in the caller's church, otherwise
-- a client could send a correct church_id but a foreign id borrowed from a
-- different tenant (an IDOR across tenants).
-- ============================================================================
create policy "follow_ups_select_own_church" on public.follow_ups
  for select to authenticated
  using (church_id = public.get_user_church_id());

create policy "follow_ups_insert_own_church" on public.follow_ups
  for insert to authenticated
  with check (
    church_id = public.get_user_church_id()
    and exists (select 1 from public.members m where m.id = member_id and m.church_id = public.get_user_church_id())
    and (
      assigned_to is null
      or exists (select 1 from public.church_users cu where cu.id = assigned_to and cu.church_id = public.get_user_church_id())
    )
  );

create policy "follow_ups_update_own_church" on public.follow_ups
  for update to authenticated
  using (church_id = public.get_user_church_id())
  with check (
    church_id = public.get_user_church_id()
    and exists (select 1 from public.members m where m.id = member_id and m.church_id = public.get_user_church_id())
    and (
      assigned_to is null
      or exists (select 1 from public.church_users cu where cu.id = assigned_to and cu.church_id = public.get_user_church_id())
    )
  );

create policy "follow_ups_delete_own_church" on public.follow_ups
  for delete to authenticated
  using (church_id = public.get_user_church_id());

-- ============================================================================
-- giving_funds — structural/financial configuration. Any teammate can read
-- the fund list (needed to record a gift against one), but only admins
-- create/rename/retire funds.
-- ============================================================================
create policy "giving_funds_select_own_church" on public.giving_funds
  for select to authenticated
  using (church_id = public.get_user_church_id());

create policy "giving_funds_insert_admin" on public.giving_funds
  for insert to authenticated
  with check (church_id = public.get_user_church_id() and public.get_user_role() = 'admin');

create policy "giving_funds_update_admin" on public.giving_funds
  for update to authenticated
  using (church_id = public.get_user_church_id() and public.get_user_role() = 'admin')
  with check (church_id = public.get_user_church_id() and public.get_user_role() = 'admin');

create policy "giving_funds_delete_admin" on public.giving_funds
  for delete to authenticated
  using (church_id = public.get_user_church_id() and public.get_user_role() = 'admin');

-- ============================================================================
-- giving_records — the most sensitive table.
--   * admins & pastors can view individual records (name + amount)
--   * any role (e.g. a counting-team volunteer) can record a new gift,
--     but cannot browse giving history
--   * only admins can edit or delete a record
-- recorded_by is force-checked against the caller's own church_users id
-- (or left null) — never a client-supplied id — so nobody can attribute a
-- gift to a colleague they didn't actually record it as.
-- ============================================================================
create policy "giving_records_select_admin_pastor" on public.giving_records
  for select to authenticated
  using (church_id = public.get_user_church_id() and public.get_user_role() in ('admin', 'pastor'));

create policy "giving_records_insert_own_church" on public.giving_records
  for insert to authenticated
  with check (
    church_id = public.get_user_church_id()
    and (member_id is null or exists (select 1 from public.members m where m.id = member_id and m.church_id = public.get_user_church_id()))
    and exists (select 1 from public.giving_funds f where f.id = fund_id and f.church_id = public.get_user_church_id())
    and (recorded_by is null or recorded_by = public.get_user_church_user_id())
  );

create policy "giving_records_update_admin" on public.giving_records
  for update to authenticated
  using (church_id = public.get_user_church_id() and public.get_user_role() = 'admin')
  with check (
    church_id = public.get_user_church_id()
    and (member_id is null or exists (select 1 from public.members m where m.id = member_id and m.church_id = public.get_user_church_id()))
    and exists (select 1 from public.giving_funds f where f.id = fund_id and f.church_id = public.get_user_church_id())
  );

create policy "giving_records_delete_admin" on public.giving_records
  for delete to authenticated
  using (church_id = public.get_user_church_id() and public.get_user_role() = 'admin');

-- ============================================================================
-- volunteer_teams
-- ============================================================================
create policy "volunteer_teams_all_own_church" on public.volunteer_teams
  for all to authenticated
  using (church_id = public.get_user_church_id())
  with check (church_id = public.get_user_church_id());

-- ============================================================================
-- team_members — same cross-tenant-ancestry concern as member_tags.
-- ============================================================================
create policy "team_members_all_own_church" on public.team_members
  for all to authenticated
  using (
    exists (select 1 from public.volunteer_teams vt where vt.id = team_id and vt.church_id = public.get_user_church_id())
    and exists (select 1 from public.members m where m.id = member_id and m.church_id = public.get_user_church_id())
  )
  with check (
    exists (select 1 from public.volunteer_teams vt where vt.id = team_id and vt.church_id = public.get_user_church_id())
    and exists (select 1 from public.members m where m.id = member_id and m.church_id = public.get_user_church_id())
  );

-- ============================================================================
-- rota_assignments — same pattern: team_id and member_id must both resolve
-- to the caller's church.
-- ============================================================================
create policy "rota_assignments_all_own_church" on public.rota_assignments
  for all to authenticated
  using (
    exists (select 1 from public.volunteer_teams vt where vt.id = team_id and vt.church_id = public.get_user_church_id())
    and exists (select 1 from public.members m where m.id = member_id and m.church_id = public.get_user_church_id())
  )
  with check (
    exists (select 1 from public.volunteer_teams vt where vt.id = team_id and vt.church_id = public.get_user_church_id())
    and exists (select 1 from public.members m where m.id = member_id and m.church_id = public.get_user_church_id())
  );


-- ============================================================================
-- 20260716090000_member_status_events.sql
-- ============================================================================
-- Adds status-change history for the Members module's "status timeline".
-- members.status only ever holds the CURRENT status — this table is an
-- append-only log of transitions, populated by the app (createMember /
-- updateMember Server Actions), not by a database trigger, so the logic
-- stays in one place and is easy to reason about.
--
-- Run this after the three migrations from the initial schema
-- (20260715120000/100/200) — it depends on churches, members, and
-- church_users, and reuses get_user_church_id() / get_user_church_user_id().

create table public.member_status_events (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  old_status text,
  new_status text not null check (new_status in ('first_timer', 'new_convert', 'member', 'inactive')),
  changed_by uuid references public.church_users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index member_status_events_church_id_idx on public.member_status_events (church_id);
create index member_status_events_member_id_idx on public.member_status_events (member_id);

alter table public.member_status_events enable row level security;

create policy "member_status_events_select_own_church" on public.member_status_events
  for select to authenticated
  using (church_id = public.get_user_church_id());

-- Same IDOR + spoofing defenses as follow_ups / giving_records: member_id
-- must resolve within the caller's church, and changed_by (if set) must be
-- the caller's own church_users id, never someone else's.
create policy "member_status_events_insert_own_church" on public.member_status_events
  for insert to authenticated
  with check (
    church_id = public.get_user_church_id()
    and exists (select 1 from public.members m where m.id = member_id and m.church_id = public.get_user_church_id())
    and (changed_by is null or changed_by = public.get_user_church_user_id())
  );

-- No UPDATE or DELETE policy: history is append-only and immutable by
-- design — correcting a mistake means inserting a new event, not editing
-- the past.


-- ============================================================================
-- 20260717090000_message_templates.sql
-- ============================================================================
-- WhatsApp message template library for the Follow-ups module.
--
-- A church can have several templates per follow-up type (a real
-- "library"); at most one per type can be flagged is_default, which is
-- what the follow-up card's one-tap "Send on WhatsApp" button uses.
--
-- This migration also seeds the 4 default templates for every EXISTING
-- church (data backfill) and updates onboard_church() so every NEW church
-- gets them automatically at creation time — see the bottom of this file.

create table public.message_templates (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  follow_up_type text not null check (follow_up_type in ('visitor_welcome', 'new_convert', 'absentee', 'pastoral_care')),
  name text not null,
  body text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index message_templates_church_id_idx on public.message_templates (church_id);

-- At most one default template per church per follow-up type — this is
-- what "Send on WhatsApp" falls back to when a church hasn't picked one.
create unique index message_templates_one_default_per_type
  on public.message_templates (church_id, follow_up_type)
  where is_default;

alter table public.message_templates enable row level security;

create policy "message_templates_select_own_church" on public.message_templates
  for select to authenticated
  using (church_id = public.get_user_church_id());

create policy "message_templates_all_own_church" on public.message_templates
  for all to authenticated
  using (church_id = public.get_user_church_id())
  with check (church_id = public.get_user_church_id());

-- ============================================================================
-- Backfill: give every church that already exists the 4 starter templates,
-- in warm, natural Ghanaian church English. Safe to re-run — the
-- `where not exists` guard skips churches that already have one for a type.
-- ============================================================================
insert into public.message_templates (church_id, follow_up_type, name, body, is_default)
select c.id, t.follow_up_type, t.name, t.body, true
from public.churches c
cross join (
  values
    (
      'visitor_welcome',
      'Warm welcome',
      'Hello {first_name}! We are so glad you joined us at {church_name} this week. It was truly a joy to have you worship with us, and we would love to see you again soon. Please do not hesitate to reach out if you need anything at all. God bless you real good!'
    ),
    (
      'new_convert',
      'New believer welcome',
      'Dear {first_name}, we rejoice with you on this new journey of faith! Welcome to the {church_name} family. We are here to walk with you every step of the way — let us know if you would like to join our new believers class. You are loved!'
    ),
    (
      'absentee',
      'We miss you',
      'Hello {first_name}, we have missed seeing you at {church_name} lately and you have been on our minds. We hope all is well with you and your family. Do reply here or give us a call if there is anything we can pray with you about. We love you and cannot wait to see you again soon!'
    ),
    (
      'pastoral_care',
      'Thinking of you',
      'Dear {first_name}, we are thinking of you and holding you up in prayer. The {church_name} family cares about you deeply. Please reach out anytime you need someone to talk to or pray with — we are here for you always.'
    )
) as t(follow_up_type, name, body)
where not exists (
  select 1 from public.message_templates mt
  where mt.church_id = c.id and mt.follow_up_type = t.follow_up_type
);

-- ============================================================================
-- Redefine onboard_church() so every NEW church gets the same 4 starter
-- templates at creation time. Identical to the version in
-- 20260715120100_functions.sql plus the template inserts at the end.
-- ============================================================================
create or replace function public.onboard_church(
  p_name text,
  p_phone text,
  p_location text
)
returns public.churches
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_church public.churches;
  v_slug_base text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if exists (select 1 from public.church_users where user_id = auth.uid()) then
    raise exception 'You already belong to a church';
  end if;

  if coalesce(trim(p_name), '') = '' then
    raise exception 'Church name is required';
  end if;

  v_slug_base := trim(both '-' from regexp_replace(lower(trim(p_name)), '[^a-z0-9]+', '-', 'g'));
  if v_slug_base = '' then
    v_slug_base := 'church';
  end if;

  insert into public.churches (name, phone, location, slug)
  values (
    trim(p_name),
    nullif(trim(p_phone), ''),
    nullif(trim(p_location), ''),
    v_slug_base || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)
  )
  returning * into v_church;

  insert into public.church_users (user_id, church_id, role)
  values (auth.uid(), v_church.id, 'admin');

  insert into public.message_templates (church_id, follow_up_type, name, body, is_default)
  values
    (v_church.id, 'visitor_welcome', 'Warm welcome', 'Hello {first_name}! We are so glad you joined us at {church_name} this week. It was truly a joy to have you worship with us, and we would love to see you again soon. Please do not hesitate to reach out if you need anything at all. God bless you real good!', true),
    (v_church.id, 'new_convert', 'New believer welcome', 'Dear {first_name}, we rejoice with you on this new journey of faith! Welcome to the {church_name} family. We are here to walk with you every step of the way — let us know if you would like to join our new believers class. You are loved!', true),
    (v_church.id, 'absentee', 'We miss you', 'Hello {first_name}, we have missed seeing you at {church_name} lately and you have been on our minds. We hope all is well with you and your family. Do reply here or give us a call if there is anything we can pray with you about. We love you and cannot wait to see you again soon!', true),
    (v_church.id, 'pastoral_care', 'Thinking of you', 'Dear {first_name}, we are thinking of you and holding you up in prayer. The {church_name} family cares about you deeply. Please reach out anytime you need someone to talk to or pray with — we are here for you always.', true);

  return v_church;
end;
$$;

revoke all on function public.onboard_church(text, text, text) from public;
grant execute on function public.onboard_church(text, text, text) to authenticated;


-- ============================================================================
-- 20260717090100_visitor_followup_trigger.sql
-- ============================================================================
-- Auto-creates a "visitor welcome" follow-up, due in 3 days, whenever a
-- member is INSERTed with status = 'first_timer'.
--
-- Implemented as a database trigger rather than application code — see the
-- assistant's explanation for the full justification, in short: this is
-- "the core value of the product" per the spec, so it needs to fire no
-- matter which code path creates the member (the app's Add Member form,
-- the CSV importer, the demo seed script, or anything built later that
-- touches this table directly) rather than depending on every current and
-- future write path remembering to call the same helper function.
--
-- INSERT-only, not UPDATE: a member transitioning back to 'first_timer'
-- from another status isn't "a new visitor arriving," so re-firing on
-- every status-touching UPDATE would risk spurious duplicate welcomes.
create or replace function public.handle_new_first_timer()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status = 'first_timer' then
    insert into public.follow_ups (church_id, member_id, type, status, due_date)
    values (new.church_id, new.id, 'visitor_welcome', 'pending', (current_date + interval '3 days')::date);
  end if;
  return new;
end;
$$;

create trigger trg_members_auto_visitor_follow_up
  after insert on public.members
  for each row
  execute function public.handle_new_first_timer();

-- Composite index for the pipeline view's common query shape: filter by
-- church + status, ordered/filtered by due_date.
create index follow_ups_church_status_due_idx on public.follow_ups (church_id, status, due_date);


-- ============================================================================
-- 20260717090200_church_teammates.sql
-- ============================================================================
-- church_users has no display-name column, and auth.users isn't exposed
-- via PostgREST (by design — it holds password hashes and other sensitive
-- auth internals). This function is a narrow, safe bridge: it reads
-- auth.users internally (via SECURITY DEFINER) but only ever returns rows
-- for church_users in the CALLER's own church, via the same
-- get_user_church_id() scoping used everywhere else.
--
-- Email is a reasonable stand-in "display name" for a small church staff
-- team until a proper profile/display-name system exists — seeing
-- colleagues' emails within your own church is normal, not a privacy
-- overreach the way exposing all of auth.users would be.
create or replace function public.get_church_teammates()
returns table (id uuid, email text, role text)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select cu.id, u.email, cu.role
  from public.church_users cu
  join auth.users u on u.id = cu.user_id
  where cu.church_id = public.get_user_church_id()
  order by cu.role, u.email;
$$;

revoke all on function public.get_church_teammates() from public;
grant execute on function public.get_church_teammates() to authenticated;


-- ============================================================================
-- 20260718090000_public_giving.sql
-- ============================================================================
-- The public giving page (/give/[churchSlug]) has no session — the
-- visitor is a congregant clicking a WhatsApp link, not a logged-in
-- church_user. Every existing RLS policy on churches/giving_funds is
-- scoped `to authenticated`, so an anonymous (`anon` role) request is
-- blocked outright, by design.
--
-- Rather than loosening those table-level policies for anon (which would
-- let anyone enumerate every church's full row, or every fund), these two
-- SECURITY DEFINER functions expose only the minimal public fields for
-- exactly one church at a time, keyed by something the visitor already
-- has (the slug from the URL, or a church_id already scoped to that slug).

create or replace function public.get_public_church_by_slug(p_slug text)
returns table (id uuid, name text, logo_url text)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select id, name, logo_url from public.churches where slug = p_slug;
$$;

grant execute on function public.get_public_church_by_slug(text) to anon, authenticated;

create or replace function public.get_public_giving_funds(p_church_id uuid)
returns table (id uuid, name text)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select id, name
  from public.giving_funds
  where church_id = p_church_id and is_active = true
  order by name;
$$;

grant execute on function public.get_public_giving_funds(uuid) to anon, authenticated;


