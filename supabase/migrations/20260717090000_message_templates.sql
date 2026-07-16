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
