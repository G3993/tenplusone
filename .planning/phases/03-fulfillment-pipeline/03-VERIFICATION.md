---
phase: 03-fulfillment-pipeline
verified: 2026-03-22T00:00:00Z
status: human_needed
score: 4/5 must-haves verified
human_verification:
  - test: "Upload a design PNG through POST /api/designs/upload and confirm file appears in R2 bucket tenplusone-designs"
    expected: "File exists at designs/{uuid}.png in the R2 bucket with public access returning HTTP 200"
    why_human: "R2 bucket does not exist yet (wrangler r2 bucket create not run), and public access is not enabled — cannot verify storage or URL reachability programmatically"
  - test: "POST /api/designs/upload with valid image, matchId, title — observe Printful Dashboard for a new sync product"
    expected: "A new sync product appears in Printful Dashboard with the design as a front-print file; product auto-syncs to Shopify store"
    why_human: "PRINTFUL_API_TOKEN secret is not configured in wrangler. End-to-end network call cannot be verified without credentials"
  - test: "Place a test order for a Printful-synced product on Shopify"
    expected: "Order appears in Printful Dashboard automatically and moves to production without any manual step"
    why_human: "Auto-fulfillment depends on the Printful Shopify app being installed with auto-import enabled — this is an external service integration that cannot be verified in code"
---

# Phase 3: Fulfillment Pipeline Verification Report

**Phase Goal:** Generative match designs flow automatically from creation to print-ready files to Printful, and orders are fulfilled without manual intervention
**Verified:** 2026-03-22
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Design PNG is stored in R2 with a publicly accessible URL (not base64 in D1) | ? HUMAN | Code wires R2 upload correctly (`DESIGNS_BUCKET.put`), URL constructed from `R2_PUBLIC_URL` env var. R2 bucket not yet created; public access not enabled. Code is correct, infra is not. |
| 2 | Printful sync product is created via API with the R2 design URL as the print file | ? HUMAN | `createPrintfulProduct` POSTs to `https://api.printful.com/store/products` with imageUrl as `files[0].url`. Function is substantive and wired. `PRINTFUL_API_TOKEN` secret is not set in wrangler. |
| 3 | Design record in D1 tracks R2 URL and Printful product ID | VERIFIED | `designs.ts` inserts `image_url` (R2 URL), `printful_product_id`, `printful_sync_status`. Schema has all three columns. |
| 4 | Printful auto-syncs the product to Shopify (no custom Shopify product creation needed) | ? HUMAN | Code removes the old `createShopifyProduct` path entirely. Shopify sync now depends on the Printful Shopify app being installed with auto-import enabled — cannot verify from codebase. |
| 5 | When a customer buys a Printful-synced product on Shopify, the order auto-routes to Printful for production | ? HUMAN | This is an external service behavior (Printful Shopify app). No code change required. Requires human test order to verify. |

**Score:** 1/5 truths fully verified in isolation, 4/5 require human confirmation of external service setup. All code paths are substantive and correctly wired.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `api/src/services/printful.ts` | Printful API client for product creation | VERIFIED | Exports `createPrintfulProduct` and `TSHIRT_VARIANT_IDS`. POSTs to `https://api.printful.com/store/products` with Bearer auth. 47 lines, fully implemented. |
| `api/src/routes/designs.ts` | Refactored upload endpoint: R2 + Printful instead of D1 base64 + Shopify | VERIFIED | Imports `createPrintfulProduct`. Uses `DESIGNS_BUCKET.put`. No `createShopifyProduct`. No `@shopify/admin-api-client`. `designRoutes` exported. 134 lines. |
| `api/wrangler.toml` | R2 bucket binding configuration | VERIFIED | `[[r2_buckets]]` block with `binding = "DESIGNS_BUCKET"` and `bucket_name = "tenplusone-designs"` present. |
| `api/src/db/schema.sql` | Updated designs table with printful columns | VERIFIED | `printful_product_id TEXT` and `printful_sync_status TEXT DEFAULT 'pending'` both present in designs table definition. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `api/src/routes/designs.ts` | `api/src/services/printful.ts` | `import { createPrintfulProduct }` | WIRED | Line 2: `import { createPrintfulProduct } from '../services/printful'`. Called on line 45 and line 120 (retry endpoint). |
| `api/src/routes/designs.ts` | R2 bucket (DESIGNS_BUCKET) | `env.DESIGNS_BUCKET.put()` | WIRED | Line 36: `await c.env.DESIGNS_BUCKET.put(key, arrayBuffer, { httpMetadata: ... })`. Result URL constructed on line 39. |
| `api/src/services/printful.ts` | `https://api.printful.com/store/products` | `fetch` POST with Bearer token | WIRED | Line 31: `fetch(\`${PRINTFUL_API}/store/products\`, { method: 'POST', headers: { Authorization: \`Bearer ${apiToken}\` } })`. |
| `api/src/index.ts` | `api/src/routes/designs.ts` | `app.route('/api/designs', designRoutes)` | WIRED | Line 30: `app.route('/api/designs', designRoutes)`. `designRoutes` imported on line 5. |
| `api/src/index.ts` | Bindings type | `DESIGNS_BUCKET: R2Bucket`, `PRINTFUL_API_TOKEN: string`, `R2_PUBLIC_URL: string` | WIRED | Lines 9-11: all three bindings declared in Bindings type. |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| FULF-01 | 03-01-PLAN.md | Print-on-demand integration (Printful) handles merch production | NEEDS HUMAN | Printful service module exists and is wired. Actual integration depends on PRINTFUL_API_TOKEN secret and Printful Shopify app install — not yet confirmed. |
| FULF-02 | 03-01-PLAN.md | Generative match designs are automatically uploaded to Printful as print-ready files | NEEDS HUMAN | Code path: design upload -> R2 -> `createPrintfulProduct` with R2 URL as front-print file. Fully implemented. Depends on R2 public access and Printful token being configured. |
| FULF-03 | 03-01-PLAN.md | POD orders are created automatically when a user purchases generative merch | NEEDS HUMAN | Order auto-routing depends on Printful Shopify app with auto-import enabled. Code removes all manual Shopify product creation. External service confirmation required. |

No orphaned requirements: REQUIREMENTS.md maps FULF-01, FULF-02, FULF-03 to Phase 3. All three are claimed by 03-01-PLAN.md. No additional Phase 3 requirements exist in REQUIREMENTS.md.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | — | — | — | — |

No TODO/FIXME comments, no placeholder returns (`return null`, `return []`), no empty handlers, no console.log-only implementations found in any of the five modified files.

### Commits Verified

Both implementation commits documented in SUMMARY are present in git history:
- `44b6387` — feat(03-01): add R2 config, Printful service, and schema migration
- `c021e9a` — feat(03-01): refactor designs endpoint to R2 + Printful pipeline

### Human Verification Required

#### 1. R2 Bucket Creation and Public Access

**Test:** Run `cd api && npx wrangler r2 bucket create tenplusone-designs`, then enable public access in Cloudflare Dashboard -> R2 -> tenplusone-designs -> Settings -> Public Access. Copy the r2.dev subdomain URL and set it as the `R2_PUBLIC_URL` secret.
**Expected:** A test PNG uploaded via POST /api/designs/upload appears at `https://pub-XXXX.r2.dev/designs/{uuid}.png` and returns HTTP 200.
**Why human:** The bucket does not exist yet. Public access and the R2_PUBLIC_URL secret are not configured. Code is correct but infrastructure is unprovisioned.

#### 2. Printful API Token and Product Creation

**Test:** Set `PRINTFUL_API_TOKEN` via `npx wrangler secret put PRINTFUL_API_TOKEN`, then POST a design to the upload endpoint and check the Printful Dashboard for a new sync product.
**Expected:** A new sync product appears in Printful with the R2 image as the front print file. Response JSON has `syncStatus: "synced"` and a non-null `printfulProductId`.
**Why human:** No Printful API token is configured. The API call cannot be verified without credentials.

#### 3. Printful Shopify App Auto-Sync

**Test:** After Printful product creation (step 2), wait a few minutes and check the Shopify store's Products section.
**Expected:** The Printful-created product auto-appears in Shopify without any code from this project creating it.
**Why human:** This depends on the Printful Shopify app being installed with "Automatically import orders" enabled. It is an external service behavior.

#### 4. Order Auto-Fulfillment

**Test:** Purchase the Printful-synced Shopify product (optional, ~$15-25 for a real order, or use Shopify's test order feature).
**Expected:** Order appears in Printful Dashboard automatically and moves to production status without any manual intervention.
**Why human:** End-to-end order routing is entirely Printful Shopify app behavior. Cannot be verified from codebase.

### Summary

All five modified files exist and are substantively implemented. All three key wiring links are present and verified. No stubs, no anti-patterns, no placeholder code.

The phase goal is blocked only by unprovisioned external infrastructure, not by code gaps:

- R2 bucket `tenplusone-designs` does not yet exist and has no public access
- `PRINTFUL_API_TOKEN` secret is not set in wrangler
- `R2_PUBLIC_URL` secret is not set in wrangler
- Printful Shopify app has not been installed or configured

The code is complete and correct. The SUMMARY's self-check and task commit verification are accurate. The three requirement IDs (FULF-01, FULF-02, FULF-03) map cleanly to Phase 3 with no orphans. The human checkpoint (Task 3) in the plan exists precisely to gate these external service configurations — they are expected deferred items, not gaps.

REQUIREMENTS.md still shows FULF-01, FULF-02, FULF-03 as `Pending` (not updated to `Complete`), consistent with the fact that external service configuration has not been verified.

---
_Verified: 2026-03-22_
_Verifier: Claude (gsd-verifier)_
