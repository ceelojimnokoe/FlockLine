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
