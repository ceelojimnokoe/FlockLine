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
