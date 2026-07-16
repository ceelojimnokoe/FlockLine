-- FlockLine: pending migrations combined for a single paste into the Supabase SQL editor.
-- Generated from supabase/migrations/ — safe to run more than once: every statement
-- guards against "already exists" (IF NOT EXISTS / DROP ... IF EXISTS first) so a
-- prior partial run (e.g. one that failed partway through) can just be re-run as-is.
-- Do NOT run 20260715-20260718 here, those are already live.

-- ============================================================================
-- supabase/migrations/20260719090000_church_logo_storage.sql
-- ============================================================================

-- Church profile picture / logo support, via Supabase Storage rather than
-- a database column (churches.logo_url already exists from the original
-- schema and just holds the resulting public URL — nothing to add there).
--
-- Also adds a short church-provided message shown on the public giving
-- page, requested alongside the logo work.

alter table public.churches add column if not exists giving_message text;

-- The original column-level grant (20260715120200_rls_policies.sql) only
-- covered name/phone/location/logo_url — grants are additive, so this adds
-- the new column without needing to touch that migration.
grant update (giving_message) on public.churches to authenticated;

-- Public bucket: church logos need to be visible on the public /give page
-- to anonymous visitors, so reads are open. Writes are restricted below.
insert into storage.buckets (id, name, public)
values ('church-logos', 'church-logos', true)
on conflict (id) do nothing;

-- Objects are stored as church-logos/{church_id}/{filename} — the folder
-- segment is what write policies check against, so one church's admin can
-- never overwrite or delete another church's logo.
--
-- CREATE POLICY has no IF NOT EXISTS / OR REPLACE form in Postgres, so each
-- is preceded by a DROP POLICY IF EXISTS — safe whether or not a previous,
-- partially-applied run already created it.
drop policy if exists "church_logos_public_read" on storage.objects;
create policy "church_logos_public_read" on storage.objects
  for select to public
  using (bucket_id = 'church-logos');

drop policy if exists "church_logos_admin_insert" on storage.objects;
create policy "church_logos_admin_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'church-logos'
    and (storage.foldername(name))[1] = public.get_user_church_id()::text
    and public.get_user_role() = 'admin'
  );

drop policy if exists "church_logos_admin_update" on storage.objects;
create policy "church_logos_admin_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'church-logos'
    and (storage.foldername(name))[1] = public.get_user_church_id()::text
    and public.get_user_role() = 'admin'
  );

drop policy if exists "church_logos_admin_delete" on storage.objects;
create policy "church_logos_admin_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'church-logos'
    and (storage.foldername(name))[1] = public.get_user_church_id()::text
    and public.get_user_role() = 'admin'
  );

-- Redefine to also surface giving_message on the public /give page —
-- identical to the version in 20260718090000_public_giving.sql plus that
-- one field. CREATE OR REPLACE can't change a function's RETURNS TABLE
-- shape (adding giving_message counts as a signature change — Postgres
-- error 42P13), so the old 3-column version has to be dropped first.
drop function if exists public.get_public_church_by_slug(text);
create function public.get_public_church_by_slug(p_slug text)
returns table (id uuid, name text, logo_url text, giving_message text)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select id, name, logo_url, giving_message from public.churches where slug = p_slug;
$$;

-- ============================================================================
-- supabase/migrations/20260720090000_groups_sessions_prayer.sql
-- ============================================================================

-- Groups & Sessions: reuses volunteer_teams/team_members (originally built
-- for duty rosters) as the "Groups" and "group membership" tables rather
-- than creating a parallel structure — a fellowship group and a duty
-- roster team are the same shape (a named set of members with a leader).
-- team_members' existing RLS policy needs no change (still just team_id +
-- member_id ancestry). volunteer_teams' policy DOES need tightening below,
-- since it's gaining its first cross-tenant-reachable foreign key
-- (leader_id -> members) and the original "for all, own church_id" policy
-- never checked FK ancestry.
--
-- New tables: sessions (meetings tied to a group), session_attendance
-- (who was invited/attended per session), prayer_requests (optionally tied
-- to a session, with a 3-tier privacy model — see below).

-- ============================================================================
-- volunteer_teams -> also "Groups"
-- ============================================================================
alter table public.volunteer_teams
  add column if not exists description text,
  add column if not exists group_type text check (group_type in (
    'prayer', 'bible_study', 'youth', 'choir', 'ushering', 'men', 'women', 'children', 'other'
  )),
  add column if not exists leader_id uuid references public.members (id) on delete set null,
  add column if not exists whatsapp_link text,
  add column if not exists meeting_location text,
  add column if not exists is_active boolean not null default true;

create index if not exists volunteer_teams_leader_id_idx on public.volunteer_teams (leader_id);

-- Replaces the original policy (20260715120200_rls_policies.sql) so writes
-- also verify leader_id resolves to a member of the caller's own church —
-- otherwise a client could point a group's leader_id at another tenant's
-- member id.
drop policy if exists "volunteer_teams_all_own_church" on public.volunteer_teams;

create policy "volunteer_teams_all_own_church" on public.volunteer_teams
  for all to authenticated
  using (church_id = public.get_user_church_id())
  with check (
    church_id = public.get_user_church_id()
    and (leader_id is null or exists (select 1 from public.members m where m.id = leader_id and m.church_id = public.get_user_church_id()))
  );

-- ============================================================================
-- sessions — a single meeting occurrence of a group (prayer meeting, Bible
-- study, youth night, ...). Recurrence is descriptive only (drives the "New
-- session" form defaulting the next date) — there is no background job that
-- auto-creates future sessions, so each occurrence is still its own row,
-- created explicitly.
-- ============================================================================
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  team_id uuid not null references public.volunteer_teams (id) on delete cascade,
  title text not null,
  type text not null check (type in (
    'prayer_meeting', 'bible_study', 'youth_meeting', 'fellowship', 'other'
  )),
  scheduled_at timestamptz not null,
  recurrence text not null default 'none' check (recurrence in ('none', 'weekly', 'biweekly', 'monthly')),
  whatsapp_link text,
  discussion_questions text,
  prayer_points text,
  resources jsonb not null default '[]'::jsonb,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  created_by uuid references public.church_users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists sessions_church_id_idx on public.sessions (church_id);
create index if not exists sessions_team_id_idx on public.sessions (team_id);
create index if not exists sessions_scheduled_at_idx on public.sessions (scheduled_at);

-- ============================================================================
-- session_attendance — one row per invited/attending member per session.
-- ============================================================================
create table if not exists public.session_attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  status text not null default 'invited' check (status in ('invited', 'attended', 'absent', 'excused', 'late')),
  recorded_by uuid references public.church_users (id) on delete set null,
  recorded_at timestamptz not null default now(),
  unique (session_id, member_id)
);

create index if not exists session_attendance_session_id_idx on public.session_attendance (session_id);
create index if not exists session_attendance_member_id_idx on public.session_attendance (member_id);

-- ============================================================================
-- prayer_requests — optionally raised during a session. Three-tier privacy:
--   * 'all_volunteers'  — any signed-in teammate can see it (general, shareable)
--   * 'assigned_leader' — only the specific teammate it was routed to, plus
--                         church leadership
--   * 'leadership_only' — admins/pastors only (the sensitive default)
-- assigned_leader_id is a church_users id (not a member id) because
-- visibility is enforced against signed-in accounts, and not every group
-- leader (volunteer_teams.leader_id, a member) necessarily has a login.
-- ============================================================================
create table if not exists public.prayer_requests (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  session_id uuid references public.sessions (id) on delete set null,
  request text not null,
  privacy_level text not null default 'leadership_only' check (privacy_level in (
    'all_volunteers', 'assigned_leader', 'leadership_only'
  )),
  assigned_leader_id uuid references public.church_users (id) on delete set null,
  status text not null default 'open' check (status in ('open', 'praying', 'answered', 'closed')),
  created_by uuid references public.church_users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists prayer_requests_church_id_idx on public.prayer_requests (church_id);
create index if not exists prayer_requests_member_id_idx on public.prayer_requests (member_id);
create index if not exists prayer_requests_session_id_idx on public.prayer_requests (session_id);
create index if not exists prayer_requests_assigned_leader_id_idx on public.prayer_requests (assigned_leader_id);

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.sessions enable row level security;
alter table public.session_attendance enable row level security;
alter table public.prayer_requests enable row level security;

-- sessions — same ancestry pattern as rota_assignments: team_id must
-- resolve to the caller's church (church_id is also checked directly since
-- the column exists here, unlike rota_assignments).
drop policy if exists "sessions_all_own_church" on public.sessions;
create policy "sessions_all_own_church" on public.sessions
  for all to authenticated
  using (
    church_id = public.get_user_church_id()
    and exists (select 1 from public.volunteer_teams vt where vt.id = team_id and vt.church_id = public.get_user_church_id())
  )
  with check (
    church_id = public.get_user_church_id()
    and exists (select 1 from public.volunteer_teams vt where vt.id = team_id and vt.church_id = public.get_user_church_id())
  );

-- session_attendance — session_id and member_id must both resolve to the
-- caller's church, same reasoning as team_members/rota_assignments.
drop policy if exists "session_attendance_all_own_church" on public.session_attendance;
create policy "session_attendance_all_own_church" on public.session_attendance
  for all to authenticated
  using (
    exists (select 1 from public.sessions s where s.id = session_id and s.church_id = public.get_user_church_id())
    and exists (select 1 from public.members m where m.id = member_id and m.church_id = public.get_user_church_id())
  )
  with check (
    exists (select 1 from public.sessions s where s.id = session_id and s.church_id = public.get_user_church_id())
    and exists (select 1 from public.members m where m.id = member_id and m.church_id = public.get_user_church_id())
  );

-- prayer_requests — the three-tier privacy model. Any signed-in teammate
-- can log a request (with check below); who can subsequently SEE it is the
-- sensitive part, enforced entirely here rather than in application code.
drop policy if exists "prayer_requests_select_scoped" on public.prayer_requests;
create policy "prayer_requests_select_scoped" on public.prayer_requests
  for select to authenticated
  using (
    church_id = public.get_user_church_id()
    and (
      public.get_user_role() in ('admin', 'pastor')
      or privacy_level = 'all_volunteers'
      or (privacy_level = 'assigned_leader' and assigned_leader_id = public.get_user_church_user_id())
    )
  );

drop policy if exists "prayer_requests_insert_own_church" on public.prayer_requests;
create policy "prayer_requests_insert_own_church" on public.prayer_requests
  for insert to authenticated
  with check (
    church_id = public.get_user_church_id()
    and exists (select 1 from public.members m where m.id = member_id and m.church_id = public.get_user_church_id())
    and (session_id is null or exists (select 1 from public.sessions s where s.id = session_id and s.church_id = public.get_user_church_id()))
    and (assigned_leader_id is null or exists (select 1 from public.church_users cu where cu.id = assigned_leader_id and cu.church_id = public.get_user_church_id()))
    and (created_by is null or created_by = public.get_user_church_user_id())
  );

-- Update: church leadership can always edit; the assigned leader can update
-- their own assigned request (e.g. mark praying/answered) but the same
-- ancestry + no-reassigning-outside-your-church checks still apply.
drop policy if exists "prayer_requests_update_scoped" on public.prayer_requests;
create policy "prayer_requests_update_scoped" on public.prayer_requests
  for update to authenticated
  using (
    church_id = public.get_user_church_id()
    and (
      public.get_user_role() in ('admin', 'pastor')
      or assigned_leader_id = public.get_user_church_user_id()
    )
  )
  with check (
    church_id = public.get_user_church_id()
    and exists (select 1 from public.members m where m.id = member_id and m.church_id = public.get_user_church_id())
    and (session_id is null or exists (select 1 from public.sessions s where s.id = session_id and s.church_id = public.get_user_church_id()))
    and (assigned_leader_id is null or exists (select 1 from public.church_users cu where cu.id = assigned_leader_id and cu.church_id = public.get_user_church_id()))
  );

-- Delete: church leadership only — a volunteer routed a request shouldn't
-- be able to erase it, only progress its status.
drop policy if exists "prayer_requests_delete_admin_pastor" on public.prayer_requests;
create policy "prayer_requests_delete_admin_pastor" on public.prayer_requests
  for delete to authenticated
  using (church_id = public.get_user_church_id() and public.get_user_role() in ('admin', 'pastor'));

-- ============================================================================
-- supabase/migrations/20260721090000_notifications.sql
-- ============================================================================

-- Notification centre. Scoped down from the full taxonomy discussed to just
-- 4 concrete trigger points wired at ship time (see the app code that calls
-- create_notification()/inserts directly): a follow-up being assigned, a
-- prayer request being routed to a specific leader, a new first-timer being
-- added, and a gift being received online. The `category` check constraint
-- still allows all 5 categories from that taxonomy so adding a 5th trigger
-- point later doesn't need another migration — but nothing populates
-- 'sessions' or 'system' yet, and the UI should not imply it does.
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  recipient_id uuid not null references public.church_users (id) on delete cascade,
  category text not null check (category in ('care', 'sessions', 'giving', 'members', 'system')),
  type text not null,
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_id_idx on public.notifications (recipient_id, created_at desc);
create index if not exists notifications_church_id_idx on public.notifications (church_id);

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select to authenticated
  using (recipient_id = public.get_user_church_user_id());

-- Mark-as-read is the only write an ordinary request should ever make;
-- recipient_id itself can't be changed away from the caller by the same
-- with-check clause.
drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update to authenticated
  using (recipient_id = public.get_user_church_user_id())
  with check (recipient_id = public.get_user_church_user_id());

drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own" on public.notifications
  for delete to authenticated
  using (recipient_id = public.get_user_church_user_id());

-- No INSERT policy: every notification is created either by
-- create_notification() below (SECURITY DEFINER, for the single-recipient
-- app-triggered cases) or by the Paystack webhook's service-role client
-- (which bypasses RLS entirely). Never a raw client insert — otherwise
-- anyone could plant a notification in another teammate's inbox.

-- ============================================================================
-- create_notification — the only way an ordinary authenticated request can
-- create a notification. Validates the recipient belongs to the caller's
-- own church (an admin can't notify a stranger in another tenant) and
-- derives church_id server-side rather than trusting a parameter for it.
-- ============================================================================
create or replace function public.create_notification(
  p_recipient_id uuid,
  p_category text,
  p_type text,
  p_title text,
  p_body text,
  p_link text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_recipient_church_id uuid;
begin
  select church_id into v_recipient_church_id
  from public.church_users
  where id = p_recipient_id;

  if v_recipient_church_id is null or v_recipient_church_id != public.get_user_church_id() then
    raise exception 'Recipient not found in your church';
  end if;

  insert into public.notifications (church_id, recipient_id, category, type, title, body, link)
  values (v_recipient_church_id, p_recipient_id, p_category, p_type, p_title, p_body, p_link);
end;
$$;

revoke all on function public.create_notification(uuid, text, text, text, text, text) from public;
grant execute on function public.create_notification(uuid, text, text, text, text, text) to authenticated;

-- ============================================================================
-- New first-timer -> notify every admin. INSERT-only, same reasoning as the
-- existing visitor-welcome follow-up trigger (20260717090100): a member
-- moving back to 'first_timer' later isn't a new visitor arriving.
-- ============================================================================
create or replace function public.notify_admins_new_first_timer()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status = 'first_timer' then
    insert into public.notifications (church_id, recipient_id, category, type, title, body, link)
    select
      new.church_id,
      cu.id,
      'members',
      'first_timer_added',
      'New first-timer: ' || new.first_name || ' ' || new.last_name,
      'Say hello and get them connected this week.',
      '/dashboard/members/' || new.id
    from public.church_users cu
    where cu.church_id = new.church_id and cu.role = 'admin';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_members_notify_first_timer on public.members;
create trigger trg_members_notify_first_timer
  after insert on public.members
  for each row
  execute function public.notify_admins_new_first_timer();

-- ============================================================================
-- supabase/migrations/20260722090000_giving_enhancements.sql
-- ============================================================================

-- Fund management (target amount + public visibility) and public-form
-- additions (anonymous giving, a real donor email for Paystack's own
-- receipt instead of always synthesizing a placeholder).

alter table public.giving_funds
  add column if not exists target_amount numeric(12, 2),
  add column if not exists is_public boolean not null default true;

alter table public.giving_records
  add column if not exists donor_email text;

-- Grants are additive (see 20260719090000's comment on the same pattern) —
-- giving_funds already grants update on other columns to authenticated;
-- admin-only write is enforced by the existing giving_funds_update_admin
-- RLS policy, this just needs the column itself made writable.
grant update (target_amount, is_public) on public.giving_funds to authenticated;

-- Fund marked not-public should simply not appear to givers — the church
-- may still be collecting toward it internally (e.g. a building fund not
-- ready to announce) without it needing a second migration later.
create or replace function public.get_public_giving_funds(p_church_id uuid)
returns table (id uuid, name text)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select id, name
  from public.giving_funds
  where church_id = p_church_id and is_active = true and is_public = true
  order by name;
$$;

