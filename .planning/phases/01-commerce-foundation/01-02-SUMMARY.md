---
phase: 01-commerce-foundation
plan: 02
subsystem: commerce
tags: [shopify, storefront-api, graphql, zustand, react, cart, checkout]

# Dependency graph
requires:
  - phase: 01-01
    provides: "SPA scaffold with terminal UI system, Line components, Nav, routing, slip store"
provides:
  - "Shopify Storefront API client with GraphQL queries"
  - "Cart store with Zustand persist (localStorage cart ID)"
  - "Product browsing pages (grid + detail) in terminal aesthetic"
  - "Cart drawer with checkout redirect to Shopify hosted checkout"
  - "BetSlip wager dropdown populated from Shopify products"
  - "Mock data fallback when no Shopify token configured"
affects: [01-03, 02-01, 03-01]

# Tech tracking
tech-stack:
  added: ["@shopify/storefront-api-client"]
  patterns: ["GraphQL Storefront API queries", "Zustand persist with partialize for cart ID", "Mock data fallback pattern for missing env vars"]

key-files:
  created:
    - frontend/src/lib/shopify.ts
    - frontend/src/stores/cart.ts
    - frontend/src/components/merch/ProductGrid.tsx
    - frontend/src/components/merch/ProductGrid.module.css
    - frontend/src/components/merch/ProductCard.tsx
    - frontend/src/components/merch/ProductCard.module.css
    - frontend/src/components/merch/CartDrawer.tsx
    - frontend/src/components/merch/CartDrawer.module.css
    - frontend/src/pages/Merch.tsx
    - frontend/src/pages/ProductDetail.tsx
    - frontend/src/pages/ProductDetail.module.css
    - frontend/.env.example
  modified:
    - frontend/src/App.tsx
    - frontend/src/components/layout/Nav.tsx
    - frontend/src/components/layout/Nav.module.css
    - frontend/src/components/slip/BetSlip.tsx
    - frontend/src/stores/slip.ts
    - frontend/package.json
    - frontend/package-lock.json

key-decisions:
  - "Mock data fallback when VITE_SHOPIFY_STOREFRONT_TOKEN is empty -- app works without Shopify store"
  - "Cart persistence via localStorage cart ID only (not full cart contents) -- Shopify is source of truth"
  - "Checkout redirects to Shopify hosted checkout -- no custom payment handling"

patterns-established:
  - "Shopify GraphQL pattern: queries as template literals, helper functions wrapping shopifyClient.request()"
  - "Mock fallback pattern: check env var at runtime, return mock data if missing"
  - "Cart store pattern: Zustand persist with partialize to only store cartId in localStorage"

requirements-completed: [INFR-01, COMM-03, COMM-04, COMM-05, COMM-06, COMM-07]

# Metrics
duration: 10min
completed: 2026-03-22
---

# Phase 1 Plan 2: Shopify Integration Summary

**Shopify Storefront API client with product browsing, cart management, checkout redirect, and merch-in-bet-slip wager selection -- all with mock data fallback**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-22T20:45:00Z
- **Completed:** 2026-03-22T20:55:00Z
- **Tasks:** 2 (1 auto + 1 checkpoint)
- **Files modified:** 19

## Accomplishments
- Shopify Storefront API client with full GraphQL queries for products, cart, and checkout
- Product catalog (grid + detail pages) rendered in terminal aesthetic with Line components
- Shopping cart with slide-in drawer, item management, and Shopify hosted checkout redirect
- BetSlip wager dropdown dynamically populated from Shopify products instead of hardcoded array
- Mock data fallback ensures app works without Shopify credentials configured
- Cart persistence across page reloads via localStorage cart ID + Shopify restore

## Task Commits

Each task was committed atomically:

1. **Task 1: Shopify Storefront API client, cart store, and product browsing** - `9d65719` (feat)
2. **Task 2: Verify Shopify integration and merch experience** - checkpoint approved by user

## Files Created/Modified
- `frontend/src/lib/shopify.ts` - Shopify Storefront API client, GraphQL queries, types, mock data fallback
- `frontend/src/stores/cart.ts` - Zustand cart store with Shopify sync and localStorage persist
- `frontend/src/components/merch/ProductGrid.tsx` - Product listing grid with loading/error states
- `frontend/src/components/merch/ProductCard.tsx` - Terminal-style product card with Link navigation
- `frontend/src/components/merch/CartDrawer.tsx` - Slide-in cart panel with checkout button
- `frontend/src/pages/Merch.tsx` - Merch catalog page wrapper
- `frontend/src/pages/ProductDetail.tsx` - Full product detail with variant selector and add-to-cart
- `frontend/src/App.tsx` - Added merch/product routes and cart restore on init
- `frontend/src/components/layout/Nav.tsx` - Cart count badge in navigation
- `frontend/src/components/slip/BetSlip.tsx` - Wager dropdown uses Shopify products
- `frontend/src/stores/slip.ts` - Wager field comment updated for Shopify variant ID
- `frontend/.env.example` - Shopify environment variable template

## Decisions Made
- Mock data fallback when no Shopify token -- allows development without store setup
- Cart ID only persisted to localStorage (not full cart) -- Shopify is source of truth on restore
- Checkout redirects to Shopify hosted checkout -- no custom payment processing needed
- COMM-07 (order confirmation emails) handled natively by Shopify -- zero custom code

## Deviations from Plan

None - plan executed exactly as written.

## User Setup Required

**External services require manual configuration.** Shopify store setup needed for production:
- Copy `frontend/.env.example` to `frontend/.env` and fill in Shopify credentials
- Create Shopify store with products, collections, and Storefront API access token
- See plan frontmatter `user_setup` section for detailed steps

## Next Phase Readiness
- Commerce frontend complete -- product browsing, cart, checkout all wired
- Backend API (01-03) already completed with discount code generation
- Phase 1 fully complete, ready for Phase 2 (Team & Match Visuals)

## Self-Check: PASSED

- All key files verified present on disk
- Task 1 commit `9d65719` verified in git history

---
*Phase: 01-commerce-foundation*
*Completed: 2026-03-22*
