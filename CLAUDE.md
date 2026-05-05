# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Hard scope rule

**All operations must stay inside this `finance/` folder.** No `..\`, no Desktop, no parent directories, no other paths on disk. If a tool refuses to operate inside the folder, the workaround is always an in-folder solution (subfolder, rename, delete the conflicting file). Never escape upward, even temporarily. This rule exists because of a prior incident where files were briefly moved to the user's Desktop as a shortcut.

## What this is

OmniWealth — a local-only personal finance app (cash flow + stock portfolio + net worth) built on **Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + better-sqlite3**. Single-user, no auth, no cloud. Used as a learning project alongside a Next.js training course — explanations should be plain-language, not jargon-heavy.

## Commands

```sh
npm run dev      # start dev server on http://localhost:3000 (Turbopack)
npm run build    # production build
npm run start    # run the production build
npm run lint     # eslint
```

There is no test framework yet. To reset the database: stop the dev server, delete `data/finance.db` (plus the `-shm`/`-wal` sidecar files), restart — `src/lib/db.ts` recreates the schema on the first request.

Health check: `GET /api/health` returns `{ status, tables }`.

## Architecture

**`src/lib/db.ts`** — opens `data/finance.db` via `better-sqlite3`, applies the schema with `CREATE TABLE IF NOT EXISTS`, enables WAL + foreign keys, seeds `users(id=1)`. Cached on `globalThis` so dev hot-reload reuses one connection. Also exports the row types (`User`, `Transaction`, `Trade`, `CurrentPrice`) and the `USER_ID = 1` constant.

**`src/lib/calculations.ts`** — pure functions only (no DB, no I/O), TypeScript port of the spec section 3 math: `cashBalance`, `holdingsByTicker`, `valuedHoldings`, `portfolioValue`, `netWorth`. Holdings use the "cost basis carries through SELLs at the current average" approach — SELLs reduce shares and total cost proportionally, leaving avg cost basis unchanged. New financial logic belongs here so it stays unit-testable.

**`src/app/api/*/route.ts`** — Next.js App Router route handlers, one folder per resource. Each does its own input validation (ISO date regex, ticker regex `^[A-Z][A-Z0-9.\-]{0,9}$`, positive-number checks) and returns `400` with `{ error }` on failure. The dashboard route is read-only and assembles its response by calling `calculations.ts` over freshly-queried rows — no derived/cached columns in the DB.

**`src/app/{,transactions,portfolio}/page.tsx`** — server components. Each page queries the DB directly (server-side) and renders. Forms are separate **client components** in `src/components/` that POST to the `/api/*` routes and call `router.refresh()` to re-fetch the server-rendered page.

**`src/app/layout.tsx`** — root layout, Geist fonts, top nav bar (`src/components/Nav.tsx`).

**`src/lib/format.ts`** — money/percent/date formatters, EUR via `Intl.NumberFormat('en-IE')`. Used on both server and client.

## Conventions worth knowing

- **Single user.** Every API route and page uses `USER_ID = 1` from `src/lib/db.ts`. Don't introduce per-user logic until auth is added.
- **`'server-only'` import in `db.ts`** prevents the DB module from leaking into client bundles. Don't remove it.
- **Validation lives in the route handler.** Inline checks returning `Response.json({ error }, { status: 400 })`. Don't reach for a validation library unless we genuinely outgrow this.
- **Tailwind 4.** Single `@import "tailwindcss"` in `globals.css` — no `@tailwind base/components/utilities` directives. Custom components use `@layer components { ... }`.
- **`data/` and `.claude/` are gitignored.** The DB is local state; never commit it. Settings stay local too.
- **SELL validation.** `src/app/api/trades/route.ts` re-queries owned shares before accepting a SELL so you can't oversell. Preserve this guard if refactoring.
- **Prices are manual.** `POST /api/prices` is the stand-in for a real market-data integration. A holding with no price set returns `current_value: null` / `gain: null` and the UI shows a "No price set" placeholder.
- **`export const dynamic = 'force-dynamic'`** on each page so Next.js doesn't try to prerender at build time (DB queries are per-request).
- **`AGENTS.md`** at the project root is created by `create-next-app` and warns that Next.js 16 may differ from training data — when in doubt, read the relevant guide in `node_modules/next/dist/docs/`.
