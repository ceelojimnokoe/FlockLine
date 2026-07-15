-- FlockLine core schema: churches (tenants) and every tenant-scoped table.
-- Run this file, then _functions.sql, then _rls_policies.sql, in order.

-- ============================================================================
-- churches — the tenant table. Every other table is scoped to one church_id.
-- ============================================================================
create table public.churches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  phone text,
  location text,
  logo_url text,
  plan text not null default 'starter' check (plan in ('starter', 'pro', 'business')),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- church_users — links auth.users to a church with a role. One church per
-- user for MVP: user_id is UNIQUE (not just indexed), so a user can appear
-- in this table at most once.
-- ============================================================================
create table public.church_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  church_id uuid not null references public.churches (id) on delete cascade,
  role text not null default 'volunteer' check (role in ('admin', 'pastor', 'volunteer')),
  created_at timestamptz not null default now()
);

create index church_users_church_id_idx on public.church_users (church_id);

-- ============================================================================
-- members — the congregation roster.
-- ============================================================================
create table public.members (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  phone text, -- E.164 format; this is also their WhatsApp number
  gender text check (gender in ('male', 'female')),
  date_of_birth date,
  address text,
  joined_at date not null default current_date,
  status text not null default 'first_timer' check (status in ('first_timer', 'new_convert', 'member', 'inactive')),
  photo_url text,
  notes text,
  created_at timestamptz not null default now()
);

create index members_church_id_idx on public.members (church_id);
create index members_phone_idx on public.members (phone);

-- ============================================================================
-- tags + member_tags
-- ============================================================================
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  unique (church_id, name)
);

create index tags_church_id_idx on public.tags (church_id);

create table public.member_tags (
  member_id uuid not null references public.members (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (member_id, tag_id)
);

create index member_tags_member_id_idx on public.member_tags (member_id);
create index member_tags_tag_id_idx on public.member_tags (tag_id);

-- ============================================================================
-- follow_ups — visitor / pastoral-care tasks.
-- ============================================================================
create table public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  assigned_to uuid references public.church_users (id) on delete set null,
  type text not null check (type in ('visitor_welcome', 'new_convert', 'absentee', 'pastoral_care')),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'done')),
  due_date date,
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index follow_ups_church_id_idx on public.follow_ups (church_id);
create index follow_ups_member_id_idx on public.follow_ups (member_id);
create index follow_ups_assigned_to_idx on public.follow_ups (assigned_to);

-- ============================================================================
-- giving_funds + giving_records
-- ============================================================================
create table public.giving_funds (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (church_id, name)
);

create index giving_funds_church_id_idx on public.giving_funds (church_id);

create table public.giving_records (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  member_id uuid references public.members (id) on delete set null, -- null = anonymous giving
  fund_id uuid not null references public.giving_funds (id) on delete restrict,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'GHS' check (char_length(currency) = 3),
  method text not null check (method in ('paystack', 'momo_manual', 'cash')),
  reference text,
  recorded_by uuid references public.church_users (id) on delete set null,
  given_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index giving_records_church_id_idx on public.giving_records (church_id);
create index giving_records_member_id_idx on public.giving_records (member_id);
create index giving_records_fund_id_idx on public.giving_records (fund_id);

-- Guards against a duplicate-delivered Paystack webhook recording the same
-- payment twice. Partial index: only enforced when a reference is present.
create unique index giving_records_reference_key on public.giving_records (reference) where reference is not null;

-- ============================================================================
-- volunteer_teams, team_members, rota_assignments
-- ============================================================================
create table public.volunteer_teams (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (church_id, name)
);

create index volunteer_teams_church_id_idx on public.volunteer_teams (church_id);

create table public.team_members (
  team_id uuid not null references public.volunteer_teams (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (team_id, member_id)
);

create index team_members_team_id_idx on public.team_members (team_id);
create index team_members_member_id_idx on public.team_members (member_id);

create table public.rota_assignments (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.volunteer_teams (id) on delete cascade,
  service_date date not null,
  member_id uuid not null references public.members (id) on delete cascade,
  role text,
  created_at timestamptz not null default now()
);

create index rota_assignments_team_id_idx on public.rota_assignments (team_id);
create index rota_assignments_member_id_idx on public.rota_assignments (member_id);
