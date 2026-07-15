# FlockLine

WhatsApp-first church management for small congregations (50–400 members) in
Ghana and beyond. Built with Next.js 16 (App Router), Supabase, and Tailwind
CSS v4, mobile-first for non-technical church administrators.

This repo currently contains **scaffolding only**: project setup, the auth
flow (email/password + magic link via Supabase Auth), a protected dashboard
shell, and the design system tokens. No church-management features
(members, follow-ups, giving) are implemented yet.

## Stack

- **Next.js 16** (App Router, Turbopack, React 19)
- **Supabase** — Postgres, Auth, `@supabase/ssr` for cookie-based sessions
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
     server-side admin operations. Never expose this to the browser.
   - `PAYSTACK_SECRET_KEY` / `PAYSTACK_PUBLIC_KEY` — not used yet, reserved
     for the future Giving feature.

3. In your Supabase project, under **Authentication > URL Configuration**,
   set:

   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: add `http://localhost:3000/auth/callback`

   This lets magic-link emails redirect back to your local dev server.

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Verifying the auth flow

1. Visit `/signup`, enter a church name, email, and password (8+ chars),
   and submit. Supabase sends a confirmation email — click the link, which
   redirects through `/auth/callback` into `/dashboard`.
2. Alternatively, use the magic-link form on `/signup` or `/login` — no
   password required, just click the emailed link.
3. Once signed in, you should land on `/dashboard` with:
   - A top bar showing the church name you entered at signup.
   - A bottom nav bar with Dashboard, Members, Follow-ups, Giving, More.
4. Try visiting `/dashboard` in a private/incognito window (no session) —
   you should be redirected to `/login?redirectTo=/dashboard`.
5. Sign out via the top bar — you should land back on `/login`.

## Project structure

```
app/                  Routes (App Router)
  login/, signup/      Auth pages + Server Actions
  auth/callback/        Magic-link PKCE callback (Route Handler)
  dashboard/            Protected layout + placeholder feature pages
components/
  ui/                  Design-system primitives (Button, Input, Card, ...)
  layout/              TopBar, BottomNav
lib/
  supabase/            Browser/server/proxy Supabase client factories
  constants.ts         App name, nav items, public route list
  utils.ts             cn() class merger, origin resolver
types/                 Shared TypeScript types (Supabase Database type)
proxy.ts               Next.js 16's renamed middleware.ts — session refresh
                        + auth redirect, runs before every matched route
```

## Notes on the design system

All color, spacing, and type-scale tokens live in one place:
[`app/globals.css`](app/globals.css), using Tailwind v4's CSS-first
`@theme` config (no `tailwind.config.ts`). Deep green primary, gold accent,
warm cream backgrounds; body text never drops below 16px; interactive
elements use a `min-h-tap` (48px) minimum touch target.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Auth with Next.js (SSR)](https://supabase.com/docs/guides/auth/server-side/nextjs)
