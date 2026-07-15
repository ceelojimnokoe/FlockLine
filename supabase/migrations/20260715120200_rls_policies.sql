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
