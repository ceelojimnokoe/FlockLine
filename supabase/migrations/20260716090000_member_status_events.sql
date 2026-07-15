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
