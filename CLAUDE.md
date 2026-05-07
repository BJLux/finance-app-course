# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository — it sits alongside the codebase as durable context.

## Hard scope rule

**All operations must stay inside this `finance/` folder.** No `..\`, no Desktop, no parent directories, no other paths on disk. If a tool refuses to operate inside the folder, the workaround is always an in-folder solution (subfolder, rename, delete the conflicting file). Never escape upward, even temporarily. This rule exists because of a prior incident where files were briefly moved to the user's Desktop as a shortcut.

## What this is

OmniWealth — a personal finance app (cash flow + stock portfolio + net worth) built on **Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + Supabase (Auth + Postgres)**. Multi-user with email/password signup and email-link confirmation. Used as a learning project alongside a Next.js training course — explanations should be plain-language, not jargon-heavy.

## Commands

```sh
npm run dev      # start dev server on http://localhost:3000 (Turbopack)
npm run build    # production build
npm run start    # run the production build
npm run lint     # eslint
```

To reset a user's data: truncate the Supabase tables (`profiles`, `transactions`, `trades`, `current_prices`) from the Supabase dashboard, or delete the user from Authentication → Users (cascades to all their rows).

Health check: `GET /api/health` returns `{ status, db_error, authenticated, user_email }`.

## Environment

`.env.local` (gitignored) must define:
- `NEXT_PUBLIC_SUPABASE_URL` — project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — publishable/anon key

The same two vars must be set in Vercel for the deployed app.

## Architecture

**`src/lib/supabase/{server,client,middleware}.ts`** — Supabase client factories built on `@supabase/ssr`. `server.ts` is for server components and route handlers (reads cookies via `next/headers`). `client.ts` is for client components. `middleware.ts` exports `updateSession` used by the root `middleware.ts` to refresh the session cookie on every request.

**`middleware.ts`** (project root) — gates every page behind login: redirects unauthenticated users to `/login` (allowlist: `/login`, `/signup`, `/auth/*`), and bounces logged-in users away from `/login` and `/signup` back to `/`.

**`src/lib/types.ts`** — shared row types (`Profile`, `Transaction`, `Trade`, `CurrentPrice`). Imported by pages, route handlers, and `calculations.ts`.

**`src/lib/calculations.ts`** — pure functions only (no DB, no I/O): `cashBalance`, `holdingsByTicker`, `valuedHoldings`, `portfolioValue`, `netWorth`. Holdings use the "cost basis carries through SELLs at the current average" approach — SELLs reduce shares and total cost proportionally, leaving avg cost basis unchanged. New financial logic belongs here so it stays unit-testable.

**`src/app/api/*/route.ts`** — App Router route handlers. Each does its own input validation (ISO date regex, ticker regex `^[A-Z][A-Z0-9.\-]{0,9}$`, positive-number checks) and returns `400` with `{ error }` on failure. Each route resolves the current user from the session cookie and inserts with `user_id = user.id`. RLS in Postgres rejects any cross-user access at the database layer.

**`src/app/{,transactions,portfolio}/page.tsx`** — server components. Each page resolves the current user, queries Supabase directly server-side, and renders. Forms are separate **client components** in `src/components/` that POST to the `/api/*` routes and call `router.refresh()` to re-fetch the server-rendered page.

**`src/app/auth/`** — `actions.ts` exports the `signUp` / `signIn` / `signOut` server actions used by the auth forms. `confirm/route.ts` is the email-link landing handler; it calls `supabase.auth.verifyOtp` and redirects to `/` on success.

**`src/app/{login,signup}/page.tsx`** — server components rendering `<AuthForm>` wired to the relevant server action. Public (allowlisted in middleware).

**`src/app/layout.tsx`** — root layout, Geist fonts, top nav bar (`src/components/Nav.tsx`). The Nav is async: shows the user's name (from `profiles`) + Sign Out when logged in, Log in / Sign up links when not.

**`src/lib/format.ts`** — money/percent/date formatters, EUR via `Intl.NumberFormat('en-IE')`. Used on both server and client.

## Database (Supabase Postgres)

Four tables, all with RLS enabled and policies keyed on `auth.uid() = user_id` (or `= id` on `profiles`):

- `profiles` — `(id UUID FK→auth.users, name, starting_cash_balance, created_at)`. One row per user, auto-created by an `AFTER INSERT` trigger on `auth.users` (`public.handle_new_user`) that copies `raw_user_meta_data->>'name'`.
- `transactions` — `(id UUID, user_id, type CHECK IN ('INCOME','EXPENSE'), amount > 0, category, transaction_date DATE, note, created_at)`.
- `trades` — `(id UUID, user_id, ticker, type CHECK IN ('BUY','SELL'), shares > 0, price_per_share > 0, trade_date DATE, created_at)`.
- `current_prices` — `(user_id, ticker, price > 0, updated_at)` with composite PK `(user_id, ticker)`. Per-user.

Use the Supabase MCP (`apply_migration`, `list_tables`, `get_advisors`) for any schema change.

## Conventions worth knowing

- **`'server-only'` import in `src/lib/supabase/server.ts`** prevents the server client (and the cookie API) from leaking into client bundles. Don't remove it.
- **Validation lives in the route handler.** Inline checks returning `Response.json({ error }, { status: 400 })`. Don't reach for a validation library unless we genuinely outgrow this.
- **Tailwind 4.** Single `@import "tailwindcss"` in `globals.css` — no `@tailwind base/components/utilities` directives. Custom components use `@layer components { ... }`.
- **`/data/`, `/.claude/`, `.env*` are gitignored.** Local state and secrets stay local.
- **SELL validation.** `src/app/api/trades/route.ts` re-queries the user's BUYs minus SELLs for the ticker before accepting a SELL so you can't oversell. Preserve this guard if refactoring.
- **Prices are manual and per-user.** `POST /api/prices` upserts on `(user_id, ticker)`. A holding with no price returns `current_value: null` / `gain: null` and the UI shows a "No price set" placeholder.
- **`export const dynamic = 'force-dynamic'`** on each page so Next.js doesn't try to prerender at build time (every page reads the session cookie + Supabase).
- **`AGENTS.md`** at the project root is created by `create-next-app` and warns that Next.js 16 may differ from training data — when in doubt, read the relevant guide in `node_modules/next/dist/docs/`.

## Supabase dashboard settings (one-time)

- **Authentication → Providers → Email**: enable "Confirm email".
- **Authentication → URL Configuration**: add `http://localhost:3000/**` and the Vercel URL to "Redirect URLs". Set "Site URL" to the Vercel URL.
- **Authentication → Email Templates → Confirm signup**: change the link target to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`.
