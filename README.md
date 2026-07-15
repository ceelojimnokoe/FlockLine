# FlockLine

WhatsApp-first church management for small congregations (50–400 members) in
Ghana and beyond. Built with Next.js 16 (App Router), Supabase, and Tailwind
CSS v4, mobile-first for non-technical church administrators.

This repo contains: project setup, the auth flow (email/password + magic
link via Supabase Auth), a protected dashboard shell, the design system
tokens, and the full multi-tenant database schema (churches, members, tags,
follow-ups, giving, volunteer teams) with Row Level Security. Feature UI on
top of that schema (member lists, follow-up boards, giving dashboards) is
not built yet.

## Stack

- **Next.js 16** (App Router, Turbopack, React 19)
- **Supabase** — Postgres, Auth, Row Level Security, `@supabase/ssr` for
  cookie-based sessions
- **Tailwind CSS v4** — CSS-first theme in [`app/globals.css`](app/globals.css)
- **TypeScript**

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the env template and fill in your Supabase project keys (find them
   in your Supabase project under Settings > API):

   ```bash
   cp .env.local.example .env.local
   ```

   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — required
     for auth to work at all.
   - `SUPABASE_SERVICE_ROLE_KEY` — not used yet, reserved for future
     server-side admin operations (e.g. a Paystack webhook handler). Never
     expose this to the browser.
   - `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY` — not used yet, reserved
     for the future Giving feature.

3. Run the database migrations. Open your Supabase project's **SQL
   Editor** and run the three files in `supabase/migrations/` **in order**
   (the filenames are timestamp-prefixed to make the order obvious):

   1. `20260715120000_schema.sql` — tables and indexes
   2. `20260715120100_functions.sql` — `get_user_church_id()`,
      `onboard_church()`, and friends
   3. `20260715120200_rls_policies.sql` — enables RLS and adds every policy

   (If you have the Supabase CLI linked to this project, `supabase db push`
   applies all three in order automatically instead.)

4. In your Supabase project, under **Authentication > URL Configuration**,
   set:

   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: add `http://localhost:3000/auth/callback`

   This lets magic-link/confirmation emails redirect back to your local dev
   server.

5. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Verifying the auth + onboarding flow

1. Visit `/signup`, enter an email and password (8+ chars), and submit.
   Supabase sends a confirmation email — click the link, which redirects
   through `/auth/callback`.
2. Alternatively, use the magic-link form on `/signup` or `/login` — no
   password required, just click the emailed link.
3. Because your account doesn't belong to a church yet, you'll land on
   `/onboarding` instead of the dashboard. Fill in your church name (phone
   and location are optional) and submit — this calls the `onboard_church`
   Postgres function, which creates your church and makes you its admin.
4. You should now land on `/dashboard` with the top bar showing your real
   church name, and a bottom nav bar with Dashboard, Members, Follow-ups,
   Giving, More.
5. Try visiting `/dashboard` in a private/incognito window (no session) —
   you should be redirected to `/login?redirectTo=/dashboard`.
6. Sign out via the top bar — you should land back on `/login`.

## Loading demo data

`supabase/seed.sql` creates one demo church ("Bethel Assembly Accra") with
15 members, tags, 5 follow-ups, 2 giving funds, and 10 giving records, and
makes your account its admin. It does **not** create a login for you —
follow the instructions at the top of the file: sign up normally first,
find your `auth.users` id, paste it into the script, then run it in the SQL
editor. It refuses to run if your account already belongs to a church (e.g.
via `/onboarding`), to avoid creating duplicates.

## Project structure

```
app/                  Routes (App Router)
  login/, signup/       Auth pages + Server Actions
  auth/callback/        Magic-link PKCE callback (Route Handler)
  onboarding/            Create-your-church form + Server Action (calls
                         the onboard_church RPC)
  dashboard/             Protected layout + placeholder feature pages
components/
  ui/                  Design-system primitives (Button, Input, Card, ...)
  layout/              TopBar, BottomNav
lib/
  supabase/            Browser/server/proxy Supabase client factories
  constants.ts         App name, nav items, public route list
  utils.ts             cn() class merger
  get-origin.ts        Server-only origin resolver for redirect URLs
types/database.ts       Hand-authored to match supabase/migrations/*.sql;
                         regenerate via `supabase gen types typescript`
                         once the schema is live in a real project
supabase/
  migrations/           Schema, helper functions, RLS policies (run in
                         filename order — see "Getting started" above)
  seed.sql               Demo data script (see "Loading demo data" above)
proxy.ts                Next.js 16's renamed middleware.ts — session
                         refresh + auth redirect, runs before every
                         matched route
```

## Notes on the design system

All color, spacing, and type-scale tokens live in one place:
[`app/globals.css`](app/globals.css), using Tailwind v4's CSS-first
`@theme` config (no `tailwind.config.ts`). Deep green primary, gold accent,
warm cream backgrounds; body text never drops below 16px; interactive
elements use a `min-h-tap` (48px) minimum touch target.

## Notes on the database schema

Every tenant-scoped table has Row Level Security enabled, keyed off a
`get_user_church_id()` helper function. A few decisions worth knowing if
you're extending the schema:

- **One church per user for MVP** — `church_users.user_id` is `UNIQUE`.
  Multi-church membership would need that constraint removed and every
  policy re-thought (`get_user_church_id()` currently assumes a single row).
- **Church creation only happens through `onboard_church()`** — there is no
  INSERT policy on `churches` or `church_users` for ordinary requests. A
  policy naive enough to allow self-service inserts there is a privilege
  escalation risk (self-assigning as admin of an existing church); see the
  comments in `supabase/migrations/20260715120100_functions.sql`.
- **`churches.plan` is not editable by admins** — it's locked down with a
  column-level `GRANT`, independent of RLS, so upgrading a subscription
  tier can only happen server-side (e.g. a future Paystack webhook using
  the service-role key), never by a client PATCH request.
- **Giving records are admin/pastor-viewable, any-role-insertable** — a
  volunteer (e.g. a counting-team member) can record a gift but can't
  browse giving history. If you query `giving_records` as a volunteer,
  don't chain `.select()` after `.insert()` — RLS will block reading the
  row back even though the insert itself succeeds.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Auth with Next.js (SSR)](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
