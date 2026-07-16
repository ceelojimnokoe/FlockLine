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
