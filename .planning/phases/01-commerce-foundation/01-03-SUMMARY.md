---
phase: 01-commerce-foundation
plan: 03
subsystem: api
tags: [hono, cloudflare-workers, d1, shopify-admin-api, vitest, wrangler, api-football]

# Dependency graph
requires:
  - phase: 01-01
    provides: "React SPA scaffold with match data, bet slip store, terminal UI"
provides:
  - "Hono REST API on Cloudflare Workers with D1 database"
  - "Match CRUD endpoints with seed and API-Football sync"
  - "Wager creation/retrieval with validation and duplicate check"
  - "Match resolution engine with Shopify discount code generation"
  - "Scheduled handler for auto-resolving finished matches"
  - "Frontend API client for match data and prediction submission"
affects: [02-01, 02-02, 03-01]

# Tech tracking
tech-stack:
  added: [hono, wrangler, "@cloudflare/workers-types", "@shopify/admin-api-client", vitest]
  patterns: [hono-route-modules, d1-bindings, scheduled-handler, shopify-admin-graphql, dynamic-import-services]

key-files:
  created:
    - api/package.json
    - api/tsconfig.json
    - api/wrangler.toml
    - api/vitest.config.ts
    - api/src/index.ts
    - api/src/index.test.ts
    - api/src/routes/matches.ts
    - api/src/routes/wagers.ts
    - api/src/services/football.ts
    - api/src/services/shopify-admin.ts
    - api/src/services/resolver.ts
    - api/src/db/schema.sql
    - api/migrations/0001_initial.sql
    - frontend/src/lib/api.ts
  modified:
    - frontend/src/components/slip/BetSlip.tsx
    - frontend/.env.example

key-decisions:
  - "Dynamic imports for services (football, resolver) to avoid loading Shopify client on every request"
  - "Seed endpoint with all 24 prototype matches for development without API-Football key"
  - "Email-based user identification (no accounts for v1)"
  - "CORS with dynamic origin check against env var + production Pages domain"

patterns-established:
  - "Hono route modules: export named Hono app, mount via app.route() in index.ts"
  - "D1 bindings via Hono generics: Hono<{ Bindings: Bindings }>"
  - "Discount code naming: WIN-{matchId}-{uuid8} for winners, TY-{matchId}-{uuid8} for consolation"
  - "Match status lifecycle: SCHEDULED -> LIVE -> FINISHED (wagers only accepted on SCHEDULED)"
  - "Frontend API client in src/lib/api.ts with VITE_API_URL env var"

requirements-completed: [INFR-02, INFR-03, INFR-04, COMM-08, COMM-09, COMM-10]

# Metrics
duration: ~5min
completed: 2026-03-23
---

# Phase 1 Plan 03: Backend API Summary

**Hono REST API on Cloudflare Workers with D1 database, match/wager CRUD, API-Football sync, and Shopify Admin API discount code generation for match resolution**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-23T00:51:28Z
- **Completed:** 2026-03-23T00:56:12Z
- **Tasks:** 2
- **Files created:** 14
- **Files modified:** 2

## Accomplishments
- Complete Cloudflare Workers API with Hono framework, CORS, health check, and D1 database bindings
- Match endpoints (list, detail, seed, sync, resolve) and wager endpoints (create, list by email, detail) with validation
- Shopify Admin API integration generating WIN- (50%, 72h) and TY- (15%, 7d) single-use discount codes
- Match resolution engine that determines winner from scores and generates appropriate discounts for all pending wagers
- Scheduled handler (cron every 5 min) for auto-syncing matches and auto-resolving finished ones
- Frontend API client and BetSlip email input with prediction submission to backend

## Task Commits

Each task was committed atomically:

1. **Task 1: Cloudflare Workers API with Hono, D1 schema, and match/wager routes** - `3d108a4` (feat)
2. **Task 2: Discount code generation, match resolution logic, frontend API client** - `bfdf02e` (feat)

## Files Created/Modified
- `api/package.json` - Dependencies: hono, @shopify/admin-api-client, wrangler, vitest
- `api/tsconfig.json` - TypeScript config targeting ESNext with Workers types
- `api/wrangler.toml` - Workers config with D1 binding, cron trigger, env vars
- `api/vitest.config.ts` - Test runner configuration
- `api/src/index.ts` - Hono entry point with CORS, route mounting, scheduled handler
- `api/src/index.test.ts` - Smoke test verifying default export has fetch handler
- `api/src/routes/matches.ts` - Match CRUD: list, detail, sync, seed (24 matches), resolve
- `api/src/routes/wagers.ts` - Wager CRUD: create (with validation), list by email, detail
- `api/src/services/football.ts` - API-Football integration for match data sync
- `api/src/services/shopify-admin.ts` - Shopify Admin API discount code creation (winner + consolation)
- `api/src/services/resolver.ts` - Match resolution: determine winner, generate discounts, update wager status
- `api/src/db/schema.sql` - D1 schema (matches + wagers tables + indexes)
- `api/migrations/0001_initial.sql` - D1 migration file (same as schema)
- `frontend/src/lib/api.ts` - Frontend API client (fetchMatches, placeWager, fetchMyWagers)
- `frontend/src/components/slip/BetSlip.tsx` - Added email input and API submission
- `frontend/.env.example` - Added VITE_API_URL

## Decisions Made
- Dynamic imports for services to avoid loading Shopify client on every request -- keeps cold start fast for simple match queries
- Seed endpoint includes all 24 prototype matches -- enables full dev workflow without API-Football credentials
- Email-based identification without user accounts -- simplest viable auth for v1, consistent with ARCHITECTURE.md design
- CORS origin check uses env var for dev + hardcoded production domain -- prevents open CORS in production

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added Shopify bindings to matches route Bindings type**
- **Found during:** Task 2 (adding resolve endpoint to matches.ts)
- **Issue:** The resolve endpoint calls resolveMatch which needs SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_TOKEN, but the matches route Bindings type only had DB, FOOTBALL_API_KEY, FOOTBALL_API_HOST
- **Fix:** Added SHOPIFY_ADMIN_TOKEN and SHOPIFY_STORE_DOMAIN to the matches route Bindings type
- **Files modified:** api/src/routes/matches.ts
- **Committed in:** bfdf02e (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary type fix for resolve endpoint to compile. No scope creep.

## Issues Encountered

None.

## User Setup Required

None for local development -- `wrangler dev` runs locally with D1 in-memory database. For production deployment, the following secrets need to be configured in Cloudflare Workers:
- `SHOPIFY_ADMIN_TOKEN` - Shopify Admin API access token
- `SHOPIFY_STORE_DOMAIN` - Shopify store domain (e.g., tenplusone.myshopify.com)
- `FOOTBALL_API_KEY` - API-Football API key

## Next Phase Readiness
- Backend API complete, ready for frontend integration testing when wrangler dev is running
- Match resolution and discount generation ready for end-to-end testing with Shopify credentials
- Seed endpoint provides full match dataset for development without external API dependencies
- Frontend API client wired and ready for live data when backend is running

---
*Phase: 01-commerce-foundation*
*Completed: 2026-03-23*
