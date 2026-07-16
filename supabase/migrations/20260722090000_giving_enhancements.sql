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
