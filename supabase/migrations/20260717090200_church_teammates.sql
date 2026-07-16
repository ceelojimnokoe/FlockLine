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
