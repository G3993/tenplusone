---
phase: 03-fulfillment-pipeline
plan: 01
subsystem: api
tags: [r2, printful, print-on-demand, cloudflare-workers, fulfillment]

# Dependency graph
requires:
  - phase: 02-team-match-visuals
    provides: "Generative design pipeline with admin export page and designs endpoint"
provides:
  - "R2 image storage for design PNGs with public URLs"
  - "Printful API client for sync product creation"
  - "Refactored designs endpoint: R2 upload + Printful product creation"
  - "Retry endpoint for failed Printful syncs"
affects: []

# Tech tracking
tech-stack:
  added: [cloudflare-r2, printful-api]
  patterns: [r2-public-url-pattern, printful-sync-product, graceful-degradation-on-api-failure]

key-files:
  created:
    - api/src/services/printful.ts
  modified:
    - api/wrangler.toml
    - api/src/db/schema.sql
    - api/src/index.ts
    - api/src/routes/designs.ts

key-decisions:
  - "R2 public URL passed as env var (R2_PUBLIC_URL) to avoid hardcoding bucket subdomain"
  - "Printful product creation is non-blocking -- design saves to R2 even if Printful API fails"
  - "Retry endpoint for failed Printful syncs instead of automatic retry queue"
  - "Bella+Canvas 3001 (product 71) as default t-shirt with variant IDs 4012-4017"

patterns-established:
  - "R2 upload pattern: generate UUID key, put with httpMetadata, construct public URL from env"
  - "External API graceful degradation: try/catch around Printful, record sync status, allow retry"

requirements-completed: [FULF-01, FULF-02, FULF-03]

# Metrics
duration: ~15min
completed: 2026-03-22
---

# Phase 3 Plan 1: Fulfillment Pipeline Summary

**R2 image storage + Printful API product creation replacing D1 base64 + direct Shopify product flow, with auto-sync to Shopify via Printful app**

## Performance

- **Duration:** ~15 min (across two sessions with checkpoint)
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 5

## Accomplishments
- Design images stored in Cloudflare R2 with publicly accessible URLs instead of base64 in D1
- Printful sync products created via API with R2 design URLs as print files
- Old Shopify direct product creation code fully removed from designs endpoint
- Retry endpoint added for recovering from failed Printful API calls
- Schema updated with printful_product_id and printful_sync_status columns

## Task Commits

Each task was committed atomically:

1. **Task 1: R2 config, Printful service, and schema migration** - `44b6387` (feat)
2. **Task 2: Refactor designs endpoint to R2 + Printful pipeline** - `c021e9a` (feat)
3. **Task 3: Configure Printful + R2 and verify end-to-end pipeline** - checkpoint approved (no code changes)

## Files Created/Modified
- `api/src/services/printful.ts` - Printful API client with createPrintfulProduct function
- `api/wrangler.toml` - Added R2 bucket binding (DESIGNS_BUCKET)
- `api/src/db/schema.sql` - Added printful_product_id and printful_sync_status columns
- `api/src/index.ts` - Extended Bindings type with DESIGNS_BUCKET, PRINTFUL_API_TOKEN, R2_PUBLIC_URL
- `api/src/routes/designs.ts` - Refactored upload to R2 + Printful, added retry endpoint, removed Shopify direct creation

## Decisions Made
- R2 public URL as environment variable rather than hardcoded -- supports both r2.dev subdomains and custom domains
- Printful failure is non-blocking: design saves to R2 regardless, sync status tracked for retry
- Retry endpoint over automatic retry queue -- simpler for v1, admin can manually retry failed syncs
- Bella+Canvas 3001 as the default product (Printful catalog ID 71), sizes S-2XL at $34.99

## Deviations from Plan

None - plan executed exactly as written.

## User Setup Required

External services require manual configuration:
- Create R2 bucket `tenplusone-designs` with public access enabled
- Set `R2_PUBLIC_URL` and `PRINTFUL_API_TOKEN` as wrangler secrets
- Install Printful Shopify app and enable auto-import orders
- Verify Printful variant IDs match Bella+Canvas 3001 catalog

## Next Phase Readiness

This is the final phase. The v1 milestone is complete:
- Commerce foundation (Phase 1): match browsing, predictions, merch store, discount codes
- Team & match visuals (Phase 2): 3D pixel grids, team pages, match detail, generative designs
- Fulfillment pipeline (Phase 3): R2 storage, Printful integration, auto-sync to Shopify

Remaining work for production launch:
- Configure external services (R2, Printful, Shopify app) per setup instructions
- Deploy Cloudflare Worker with all secrets configured
- Create 48 team pixel art assets (noted as long-lead creative work in research)

## Self-Check: PASSED

All 6 key files verified present. Both task commits (44b6387, c021e9a) verified in git history.

---
*Phase: 03-fulfillment-pipeline*
*Completed: 2026-03-22*
