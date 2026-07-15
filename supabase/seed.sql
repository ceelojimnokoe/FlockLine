-- Demo data for local development / QA: one church, 15 members, tags,
-- 5 follow-ups, 2 funds, 10 giving records.
--
-- This deliberately does NOT insert into auth.users — Supabase Auth owns
-- that table, and inserting into it directly from SQL bypasses password
-- hashing and email confirmation, which can leave your auth system in a
-- broken state. Instead:
--
--   1. Sign up for a real account through the app (/signup).
--   2. Find your user id:
--        select id, email from auth.users order by created_at desc limit 5;
--   3. Replace demo_user_id below with that UUID.
--   4. Run this whole file in the Supabase SQL editor.
--
-- This links your account to the demo church as admin — it will fail if
-- your account already belongs to a church (including one created via the
-- app's own onboarding flow).

do $$
declare
  demo_user_id uuid := '00000000-0000-0000-0000-000000000000'; -- <-- replace me
  demo_church_id uuid;
  m_ids uuid[];
  tag_choir uuid;
  tag_youth uuid;
  tag_newconvert uuid;
  fund_tithe uuid;
  fund_offering uuid;
begin
  if demo_user_id = '00000000-0000-0000-0000-000000000000' then
    raise exception 'Replace demo_user_id with a real auth.users id before running this seed.';
  end if;

  if exists (select 1 from public.church_users where user_id = demo_user_id) then
    raise exception 'This user already belongs to a church — seed aborted to avoid duplicates.';
  end if;

  insert into public.churches (name, slug, phone, location, plan)
  values ('Bethel Assembly Accra', 'bethel-assembly-accra', '+233244000000', 'Accra, Greater Accra', 'starter')
  returning id into demo_church_id;

  insert into public.church_users (user_id, church_id, role)
  values (demo_user_id, demo_church_id, 'admin');

  -- 15 members with Ghanaian (Akan) names, a mix of statuses.
  insert into public.members (church_id, first_name, last_name, phone, gender, date_of_birth, status, joined_at)
  values
    (demo_church_id, 'Kwame', 'Mensah', '+233201234001', 'male', '1985-03-12', 'member', '2019-06-01'),
    (demo_church_id, 'Ama', 'Owusu', '+233201234002', 'female', '1990-07-22', 'member', '2018-01-15'),
    (demo_church_id, 'Kofi', 'Boateng', '+233201234003', 'male', '1978-11-05', 'member', '2015-09-10'),
    (demo_church_id, 'Akosua', 'Asante', '+233201234004', 'female', '2001-02-18', 'new_convert', '2026-05-20'),
    (demo_church_id, 'Yaw', 'Darko', '+233201234005', 'male', '1995-09-30', 'member', '2020-03-08'),
    (demo_church_id, 'Efua', 'Addo', '+233201234006', 'female', '1988-12-01', 'member', '2017-07-19'),
    (demo_church_id, 'Kwabena', 'Osei', '+233201234007', 'male', '1975-05-14', 'member', '2012-04-02'),
    (demo_church_id, 'Abena', 'Agyeman', '+233201234008', 'female', '1993-08-09', 'first_timer', '2026-07-05'),
    (demo_church_id, 'Kojo', 'Appiah', '+233201234009', 'male', '1982-01-27', 'member', '2016-11-11'),
    (demo_church_id, 'Adwoa', 'Frimpong', '+233201234010', 'female', '1999-04-16', 'new_convert', '2026-04-01'),
    (demo_church_id, 'Kwaku', 'Amoah', '+233201234011', 'male', '1970-10-03', 'member', '2010-02-14'),
    (demo_church_id, 'Akua', 'Sarpong', '+233201234012', 'female', '1996-06-25', 'member', '2021-08-22'),
    (demo_church_id, 'Fiifi', 'Annan', '+233201234013', 'male', '1992-03-19', 'inactive', '2019-01-06'),
    (demo_church_id, 'Esi', 'Kuffour', '+233201234014', 'female', '1987-09-11', 'member', '2018-05-30'),
    (demo_church_id, 'Nana', 'Yeboah', '+233201234015', 'male', '2003-12-08', 'first_timer', '2026-07-12');

  select array_agg(id order by first_name) into m_ids from public.members where church_id = demo_church_id;

  -- Tags
  insert into public.tags (church_id, name, color) values (demo_church_id, 'Choir', '#1f6440') returning id into tag_choir;
  insert into public.tags (church_id, name, color) values (demo_church_id, 'Youth', '#cc8f1d') returning id into tag_youth;
  insert into public.tags (church_id, name, color) values (demo_church_id, 'New Convert 2026', '#2f7d4f') returning id into tag_newconvert;

  insert into public.member_tags (member_id, tag_id) values
    (m_ids[1], tag_choir),
    (m_ids[5], tag_youth),
    (m_ids[4], tag_newconvert),
    (m_ids[10], tag_newconvert),
    (m_ids[12], tag_youth);

  -- 5 follow-ups
  insert into public.follow_ups (church_id, member_id, type, status, due_date, notes)
  values
    (demo_church_id, m_ids[8], 'visitor_welcome', 'pending', current_date + interval '2 days', 'First-timer, sat in the back row — send a welcome message.'),
    (demo_church_id, m_ids[15], 'visitor_welcome', 'in_progress', current_date + interval '1 day', 'Called once, no answer, try WhatsApp.'),
    (demo_church_id, m_ids[4], 'new_convert', 'pending', current_date + interval '5 days', 'Invite to new believers class.'),
    (demo_church_id, m_ids[10], 'new_convert', 'done', current_date - interval '3 days', 'Completed new believers class.'),
    (demo_church_id, m_ids[13], 'absentee', 'pending', current_date + interval '3 days', 'Missed last 4 Sundays.');

  -- 2 funds
  insert into public.giving_funds (church_id, name) values (demo_church_id, 'Tithe') returning id into fund_tithe;
  insert into public.giving_funds (church_id, name) values (demo_church_id, 'Offering') returning id into fund_offering;

  -- 10 giving records (one anonymous cash gift)
  insert into public.giving_records (church_id, member_id, fund_id, amount, method, given_at)
  values
    (demo_church_id, m_ids[1], fund_tithe, 500.00, 'momo_manual', now() - interval '7 days'),
    (demo_church_id, m_ids[2], fund_tithe, 300.00, 'paystack', now() - interval '7 days'),
    (demo_church_id, m_ids[3], fund_offering, 50.00, 'cash', now() - interval '7 days'),
    (demo_church_id, m_ids[5], fund_tithe, 200.00, 'momo_manual', now() - interval '14 days'),
    (demo_church_id, m_ids[6], fund_offering, 30.00, 'cash', now() - interval '14 days'),
    (demo_church_id, m_ids[7], fund_tithe, 450.00, 'paystack', now() - interval '14 days'),
    (demo_church_id, m_ids[9], fund_offering, 40.00, 'cash', now() - interval '21 days'),
    (demo_church_id, m_ids[11], fund_tithe, 600.00, 'momo_manual', now() - interval '21 days'),
    (demo_church_id, null, fund_offering, 100.00, 'cash', now() - interval '21 days'),
    (demo_church_id, m_ids[14], fund_tithe, 350.00, 'paystack', now() - interval '28 days');

  raise notice 'Seed complete. Demo church id: %', demo_church_id;
end $$;
