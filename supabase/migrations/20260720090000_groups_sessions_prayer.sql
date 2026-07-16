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
