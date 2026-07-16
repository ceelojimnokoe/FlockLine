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
