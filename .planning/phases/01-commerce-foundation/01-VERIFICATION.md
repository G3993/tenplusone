---
phase: 01-commerce-foundation
verified: 2026-03-22T22:30:00Z
status: gaps_found
score: 16/18 must-haves verified
gaps:
  - truth: "User can browse merch catalog organized by team"
    status: partial
    reason: "COMM-04 requires catalog organized by team. ProductGrid renders a flat list from Shopify ordered by Shopify default. No team-based grouping, filtering, or tagging exists in the frontend or Shopify data model at this stage."
    artifacts:
      - path: "frontend/src/components/merch/ProductGrid.tsx"
        issue: "Renders a flat product list with no team grouping or filter"
      - path: "frontend/src/pages/Merch.tsx"
        issue: "Passes straight to ProductGrid — no team organization layer"
    missing:
      - "Team-based grouping or tag filtering in ProductGrid (or Shopify product tags/collections mapped by team)"
      - "This could be deferred: PLAN 01-02 noted organization as future concern once real Shopify data exists"
human_verification:
  - test: "Terminal aesthetic pixel-match against prototype"
    expected: "Geist Mono everywhere, 14px, 1.85 line-height, #000 background, #a0a0a0 body text, line numbers in #333333, green (#4ade80) visible only on hover"
    why_human: "Visual appearance cannot be verified programmatically from static analysis alone"
  - test: "Odds button toggle and bet slip interaction"
    expected: "Clicking an odds button adds a prediction, clicking it again removes it. Slip badge in nav increments. Slip page shows bets with remove buttons."
    why_human: "State-driven UI interaction requires browser runtime"
  - test: "Cart persistence across page reload"
    expected: "Add item to cart, reload page — cart ID is restored from localStorage and cart items are re-fetched from Shopify (or held in mock state)"
    why_human: "localStorage and Shopify cart restore behavior requires browser runtime"
  - test: "Prediction submission flow"
    expected: "Enter email on slip, click place predictions — POST /api/wagers is called for each bet. On success, toast shows, slip clears."
    why_human: "Requires wrangler dev running alongside the frontend dev server"
---

# Phase 01: Commerce Foundation Verification Report

**Phase Goal:** Users can browse World Cup matches, place predictions, browse and purchase merch through a terminal-aesthetic storefront backed by Shopify, and receive discount codes after match resolution
**Verified:** 2026-03-22T22:30:00Z
**Status:** gaps_found (1 gap — COMM-04 team organization not implemented)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User sees match list with line numbers, Geist Mono, and monochrome palette | ? HUMAN | All CSS tokens verified (`--font`, `--bg`, `--white`, `--bright`). Visual confirmation needed. |
| 2 | User can click odds buttons to add/remove predictions to a bet slip | ? HUMAN | `OddsButton.tsx` calls `toggleBet` from `useSlipStore` — wiring confirmed. Runtime needed to verify toggle UX. |
| 3 | User can filter matches by group | ✓ VERIFIED | `MatchList.tsx` uses `useMatchesStore.groupFilter` to filter `MATCHES` array. Filter buttons render all 12 groups A-L. |
| 4 | User can navigate between matches, groups, and slip via sticky nav bar | ✓ VERIFIED | `Nav.tsx` has `Link` to `/matches`, `/groups`, `/slip`, `/merch`. `App.tsx` has `BrowserRouter + Routes` for all. |
| 5 | Layout is responsive at 560px breakpoint | ✓ VERIFIED | `MatchList.module.css` has `@media (max-width: 560px)` adjusting gaps and font sizes. |
| 6 | Green appears only on hover, never as default | ✓ VERIFIED | All `var(--green)` usages across all CSS files are inside `:hover` pseudo-classes (confirmed via grep). |
| 7 | User can browse merch products loaded from Shopify Storefront API | ✓ VERIFIED | `ProductGrid.tsx` calls `fetchProducts()` on mount. `shopify.ts` uses `createStorefrontApiClient` with mock fallback when token absent. |
| 8 | User can view product details (images, price, sizing, description) | ✓ VERIFIED | `ProductDetail.tsx` fetches by handle, renders images, price, description, variant selector, add-to-cart button. |
| 9 | User can add products to a cart | ✓ VERIFIED | `ProductDetail.tsx` calls `addItem(selectedVariantId)` from `useCartStore`. `useCartStore.addItem` calls `createCart` or `addToCart` in `shopify.ts`. |
| 10 | User can click checkout and be redirected to Shopify hosted checkout | ✓ VERIFIED | `CartDrawer.tsx` calls `checkout()` from `useCartStore`. `checkout()` sets `window.location.href = checkoutUrl`. Alert shown in mock mode. |
| 11 | User can select a merch item to wager in the bet slip | ✓ VERIFIED | `BetSlip.tsx` fetches products, renders `<select>` dropdown per bet mapped to `p.variants.edges[0].node.id`. Calls `setWager()` on change. |
| 12 | Cart persists across page reloads via localStorage cart ID | ✓ VERIFIED | `useCartStore` uses `persist` with `partialize: (s) => ({ cartId: s.cartId })`. `App.tsx` calls `restoreCart()` on mount. |
| 13 | User can browse merch catalog organized by team | ✗ FAILED | ProductGrid renders a flat Shopify product list. No team-based grouping, tags, or filtering is implemented. |
| 14 | Backend API responds to GET /api/matches with match data | ✓ VERIFIED | `api/src/routes/matches.ts` has `app.get('/')` that queries D1 `matches` table and returns JSON. |
| 15 | Backend API accepts POST /api/wagers to store a prediction | ✓ VERIFIED | `api/src/routes/wagers.ts` has `app.post('/')` with match status validation, duplicate check (409), and D1 INSERT. |
| 16 | Backend API generates 50% discount via Shopify Admin API when prediction wins | ✓ VERIFIED | `resolver.ts` calls `createWinnerDiscount()`. `shopify-admin.ts` creates `WIN-{matchId}-{uuid8}` with `percentage: 0.5`, 72h expiry, single-use. |
| 17 | Backend API generates 15% consolation discount when prediction loses | ✓ VERIFIED | `resolver.ts` calls `createConsolationDiscount()`. `shopify-admin.ts` creates `TY-{matchId}-{uuid8}` with `percentage: 0.15`, 7d expiry, single-use. |
| 18 | Match data is polled from API-Football and cached in D1 | ✓ VERIFIED | `football.ts` exports `fetchAndSyncMatches()` calling `v3.football.api-sports.io/fixtures`. Scheduled handler in `index.ts` calls it every 5 min via cron. |

**Score:** 16/18 truths verified (1 failed, 1 human-needed)

---

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `frontend/src/components/layout/Line.tsx` | ✓ VERIFIED | Exports `Line`, `Blank`, `useLineCounter`. Substantive (not stub). Used throughout all components. |
| `frontend/src/components/layout/Nav.tsx` | ✓ VERIFIED | Has `useSlipStore`, `useCartStore`, `Link`, active state detection. |
| `frontend/src/stores/slip.ts` | ✓ VERIFIED | Exports `useSlipStore` with `toggleBet`, `removeBet`, `setWager`, `clear`. Uses `persist` with key `'tenplusone-slip'`. |
| `frontend/src/components/matches/MatchList.tsx` | ✓ VERIFIED | Imports `Line`, `useMatchesStore`, `MATCHES`, `GROUPS`, `OddsButton`. Renders 24 matches with group filter. |
| `frontend/src/styles/tokens.css` | ✓ VERIFIED | Contains `--bg: #000000`, `--green: #4ade80`, `--font: 'Geist Mono'`. |
| `frontend/src/lib/shopify.ts` | ✓ VERIFIED | Uses `createStorefrontApiClient`. Exports `fetchProducts`, `fetchProductByHandle`, `createCart`, `addToCart`, `fetchCart`. GraphQL queries present. Mock fallback implemented. |
| `frontend/src/stores/cart.ts` | ✓ VERIFIED | Exports `useCartStore` with `addItem`, `restoreCart`, `checkout`, `clear`. `persist` with key `'tenplusone-cart'` and `partialize`. |
| `frontend/src/components/merch/ProductGrid.tsx` | ✓ VERIFIED | Calls `fetchProducts()` on mount. Renders `ProductCard` for each. Has loading/error states. |
| `frontend/src/pages/ProductDetail.tsx` | ✓ VERIFIED | Uses `useParams`, `fetchProductByHandle`, `addItem` from cart store. |
| `api/src/index.ts` | ✓ VERIFIED | Mounts `matchesRoute` at `/api/matches`, `wagersRoute` at `/api/wagers`. CORS middleware. `scheduled` handler implemented. Exports `fetch` and `scheduled`. |
| `api/src/routes/matches.ts` | ✓ VERIFIED | GET `/`, GET `/:id`, POST `/sync`, POST `/seed` (24 matches), POST `/:id/resolve`. |
| `api/src/routes/wagers.ts` | ✓ VERIFIED | POST `/` (with SCHEDULED check + 409 duplicate guard), GET `/` (by email), GET `/:id`. |
| `api/src/services/resolver.ts` | ✓ VERIFIED | Exports `resolveMatch`. Determines winner from score, calls winner/consolation discount, updates wager status to WON/LOST. |
| `api/src/services/shopify-admin.ts` | ✓ VERIFIED | Exports `createWinnerDiscount` (WIN- prefix, 50%, 72h) and `createConsolationDiscount` (TY- prefix, 15%, 7d). Uses `createAdminApiClient`. |
| `api/src/db/schema.sql` | ✓ VERIFIED | `CREATE TABLE matches`, `CREATE TABLE wagers`, three `CREATE INDEX` statements. |
| `api/migrations/0001_initial.sql` | ✓ VERIFIED | Identical to schema.sql. |
| `frontend/src/lib/api.ts` | ✓ VERIFIED | Exports `fetchMatches`, `placeWager`, `fetchMyWagers`. Uses `VITE_API_URL` with fallback to `localhost:8787`. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `frontend/src/pages/Matches.tsx` | `MatchList.tsx` | import + render | ✓ WIRED | `import { MatchList }` and `return <MatchList />` confirmed |
| `frontend/src/components/matches/OddsButton.tsx` | `stores/slip.ts` | `useSlipStore` | ✓ WIRED | Imports `useSlipStore`, reads `bets`, calls `toggleBet` |
| `frontend/src/App.tsx` | react-router | `BrowserRouter + Routes` | ✓ WIRED | Imports and uses `BrowserRouter`, `Routes`, `Route` |
| `frontend/src/lib/shopify.ts` | `@shopify/storefront-api-client` | `createStorefrontApiClient` | ✓ WIRED | Line 1 import, used to create `shopifyClient` |
| `frontend/src/stores/cart.ts` | `frontend/src/lib/shopify.ts` | import cart mutations | ✓ WIRED | Imports `createCart`, `addToCart`, `fetchCart` |
| `frontend/src/components/merch/ProductGrid.tsx` | `lib/shopify.ts` | `fetchProducts` call | ✓ WIRED | Imports and calls `fetchProducts()` in `useEffect` |
| `frontend/src/components/slip/BetSlip.tsx` | `lib/api.ts` | `placeWager` call | ✓ WIRED | Imports `placeWager`, calls it per bet in `handleSubmit` |
| `api/src/routes/wagers.ts` | `api/src/services/resolver.ts` | `resolveMatch` | ✓ WIRED | `/:id/resolve` in matches.ts calls `resolveMatch` via dynamic import |
| `api/src/services/resolver.ts` | `api/src/services/shopify-admin.ts` | discount functions | ✓ WIRED | Imports and calls `createWinnerDiscount` / `createConsolationDiscount` |
| `api/src/services/shopify-admin.ts` | `@shopify/admin-api-client` | `createAdminApiClient` | ✓ WIRED | Line 1 import, used in both exported functions |
| `api/src/routes/matches.ts` | `api/src/services/football.ts` | `fetchAndSyncMatches` | ✓ WIRED | Dynamic import in POST `/sync` handler, also in scheduled handler |
| `frontend/src/lib/api.ts` | `api/src/index.ts` | fetch to `/api/*` | ✓ WIRED | `fetch(\`${API_BASE}/api/matches\`)`, `fetch(\`${API_BASE}/api/wagers\`)` |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| COMM-01 | 01-01 | Browse World Cup 2026 matches with odds in terminal UI | ✓ SATISFIED | 24 matches in `MATCHES` array, `MatchList.tsx` renders with odds buttons, Geist Mono, line numbers |
| COMM-02 | 01-01 | Add match predictions to bet slip | ✓ SATISFIED | `OddsButton` → `toggleBet` → `useSlipStore`. `BetSlip` renders stored bets. |
| COMM-03 | 01-02 | Select merch to wager on each prediction | ✓ SATISFIED | `BetSlip.tsx` wager dropdown populated from `fetchProducts()`, calls `setWager()` on change |
| COMM-04 | 01-02 | Browse merch catalog organized by team | ✗ BLOCKED | `ProductGrid.tsx` renders flat list. No team grouping, tagging, or collection-based organization |
| COMM-05 | 01-02 | View product details (images, sizing, materials) | ✓ SATISFIED | `ProductDetail.tsx` shows images, price, description, variant selector |
| COMM-06 | 01-02 | Add merch to cart and checkout via Shopify | ✓ SATISFIED | `addItem()` → Shopify cart mutation. `CartDrawer` with `CHECKOUT` button → `window.location.href = checkoutUrl` |
| COMM-07 | 01-02 | Order confirmation and tracking via Shopify emails | ? NEEDS HUMAN | Handled natively by Shopify — no custom code required. Cannot verify Shopify email settings programmatically. |
| COMM-08 | 01-03 | Winning prediction unlocks 50% discount code | ✓ SATISFIED | `resolver.ts` → `createWinnerDiscount()` → `WIN-` prefix, `percentage: 0.5`, 72h, single-use |
| COMM-09 | 01-03 | Losing prediction unlocks consolation reward (15%) | ✓ SATISFIED | `resolver.ts` → `createConsolationDiscount()` → `TY-` prefix, `percentage: 0.15`, 7d, single-use |
| COMM-10 | 01-03 | Discount codes dynamically generated via Shopify Admin API | ✓ SATISFIED | `shopify-admin.ts` uses `createAdminApiClient` + `discountCodeBasicCreate` GraphQL mutation |
| FRNT-01 | 01-01 | Terminal/code-editor aesthetic (Geist Mono, line numbers, black/white) | ? HUMAN | Tokens verified: `--font: 'Geist Mono'`, `--bg: #000000`. Visual confirmation needed. |
| FRNT-02 | 01-01 | Green reserved for hover states only | ✓ SATISFIED | All `var(--green)` in CSS files are inside `:hover` pseudo-classes. Confirmed via grep across all `.css` files. |
| FRNT-03 | 01-01 | Mobile-responsive layout at 560px breakpoint | ✓ SATISFIED | `MatchList.module.css` has `@media (max-width: 560px)`. Human confirmation of layout still needed. |
| FRNT-04 | 01-01 | Consistent nav bar across terminal and grid pages | ✓ SATISFIED | `Nav.tsx` rendered in `App.tsx` wrapping all routes. |
| INFR-01 | 01-02 | Shopify store set up with Storefront API access | ? NEEDS HUMAN | `frontend/.env.example` has correct env vars. Mock fallback works without real store. Actual Shopify store setup is user's responsibility. |
| INFR-02 | 01-03 | Backend API (Cloudflare Workers) for discount generation, match resolution | ✓ SATISFIED | Full Hono API with D1, CORS, routes, scheduled handler. `wrangler.toml` configured. API vitest passes. |
| INFR-03 | 01-03 | Football data API integration (API-Football) | ✓ SATISFIED | `football.ts` calls `v3.football.api-sports.io/fixtures`. Seed endpoint provides 24 matches for dev without API key. |
| INFR-04 | 01-03 | Wager database tracking predictions, outcomes, discount codes | ✓ SATISFIED | D1 `wagers` table with `status`, `discount_code`, `discount_pct`, `resolved_at`. `resolver.ts` updates these on resolution. |

**Orphaned requirements:** None. All 18 requirement IDs declared across the three plans are accounted for.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `api/src/index.ts` | 31-56 | `scheduled` handler is implemented with actual logic | ✓ Clean | No issue |
| `frontend/src/components/slip/BetSlip.tsx` | 91 | `void selectedProduct;` — variable referenced only to suppress lint | ℹ Info | Dead reference; `selectedProduct` is found but not used in render. Minor code smell, not a blocker. |
| `api/src/routes/matches.ts` | 32-55 | Seed endpoint only includes 24 matches (2 hardcoded, rest filled) | ✓ Clean | All 24 matches confirmed in seed array. |

No blockers or stubs found.

---

### Human Verification Required

#### 1. Terminal Aesthetic Visual Match

**Test:** Run `cd frontend && npm run dev`, open `http://localhost:5173`, compare to `index.html` prototype side-by-side.
**Expected:** Geist Mono font, 14px, 1.85 line-height, pure black background, #a0a0a0 body text, #ffffff bright text, #333333 line numbers. Green visible only on hover over odds buttons, team links, nav items.
**Why human:** Visual appearance cannot be verified from static CSS analysis alone.

#### 2. Odds Toggle and Bet Slip

**Test:** Click an odds button on the matches page. Click it again.
**Expected:** First click adds a bet to slip (badge increments in nav). Second click removes it (badge decrements).
**Why human:** State-driven toggle behavior requires browser runtime and React state execution.

#### 3. Cart Persistence Across Reload

**Test:** Add a product to cart, reload the page.
**Expected:** Cart count in nav remains; cart drawer shows previous items (or restores from Shopify).
**Why human:** localStorage and `restoreCart()` require browser runtime.

#### 4. End-to-End Prediction Submission

**Test:** Run `wrangler dev` in `api/`, run `npm run dev` in `frontend/`. Add bets, enter email, click "place predictions".
**Expected:** 201 response from `POST /api/wagers` for each bet. Success toast appears. Slip clears.
**Why human:** Requires two concurrent processes; wager validation checks D1 (needs seeded data).

#### 5. Shopify Order Confirmation (COMM-07)

**Test:** With real Shopify credentials, complete checkout. Check email.
**Expected:** Shopify sends order confirmation and tracking email automatically.
**Why human:** External Shopify email service, requires real store credentials.

---

### Gaps Summary

**1 gap found blocking full goal achievement:**

**COMM-04 — Merch catalog organized by team** is not implemented. The `ProductGrid` component renders a flat product list from Shopify in whatever order Shopify returns products. There is no team-based grouping, filtering by team tag, or collection-based organization.

The plan's wording ("product browsing pages (grid + detail) in terminal aesthetic") was implemented correctly, but the *requirement* COMM-04 specifies "organized by team." This organization was not built in any of the three plans.

**Root cause:** The three plans collectively did not include a task to implement team-based product organization. Plan 01-02's `must_haves.truths` said only "User can browse merch products" — it dropped the "organized by team" qualifier from COMM-04.

**What is needed:**
- Shopify products need team tags or be organized into per-team collections
- `ProductGrid` or `Merch` page needs to group/filter by team
- This is likely a small addition (tag-based filter tabs similar to group filter on matches page)

**Note on COMM-07 and INFR-01:** These are marked "? NEEDS HUMAN" because they depend on Shopify store configuration by the user (external service). The code infrastructure is correct; the gap is in external setup that cannot be verified programmatically.

---

*Verified: 2026-03-22T22:30:00Z*
*Verifier: Claude (gsd-verifier)*
