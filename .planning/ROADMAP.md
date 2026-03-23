# Roadmap: ten+1

## Overview

ten+1 ships in three phases: first a working terminal-aesthetic merch store with Shopify integration and the prediction/wagering engine (the commerce backbone), then the differentiating 3D visual experience with team pages, match views, and generative designs, and finally the print-on-demand pipeline that closes the loop from match result to one-of-one merch in the user's hands. The existing prototype (terminal landing + 3D pixel grid) provides a head start on Phases 1 and 2.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Commerce Foundation** - Terminal merch store with Shopify integration, prediction wagering, and discount delivery
- [ ] **Phase 2: Team & Match Visuals** - Interactive 3D pixel grid team pages, match experience, and generative match-driven designs
- [ ] **Phase 3: Fulfillment Pipeline** - Print-on-demand integration to produce and ship one-of-one generative merch

## Phase Details

### Phase 1: Commerce Foundation
**Goal**: Users can browse World Cup matches, place predictions, browse and purchase merch through a terminal-aesthetic storefront backed by Shopify, and receive discount codes after match resolution
**Depends on**: Nothing (first phase)
**Requirements**: COMM-01, COMM-02, COMM-03, COMM-04, COMM-05, COMM-06, COMM-07, COMM-08, COMM-09, COMM-10, FRNT-01, FRNT-02, FRNT-03, FRNT-04, INFR-01, INFR-02, INFR-03, INFR-04
**Success Criteria** (what must be TRUE):
  1. User can browse a list of World Cup 2026 matches with odds in a terminal-style interface and add predictions to a bet slip
  2. User can browse team merch catalogs, view product details, add items to cart, and complete checkout through Shopify
  3. User receives a discount code after a match resolves -- 50% off for correct predictions, consolation reward for incorrect ones
  4. The entire experience maintains terminal/code-editor aesthetic (Geist Mono, line numbers, monochrome with green hover states) and works on mobile
  5. Backend API handles match data polling, wager tracking, and discount code generation via Shopify Admin API
**Plans**: TBD

Plans:
- [ ] 01-01: Vite + React + TypeScript SPA scaffold with terminal UI system (layout, nav, typography, responsive)
- [ ] 01-02: Shopify integration (Storefront API for products/cart/checkout) and merch browsing experience
- [ ] 01-03: Wagering engine (backend API, match data, prediction tracking, discount code generation)

### Phase 2: Team & Match Visuals
**Goal**: Each team has an interactive 3D pixel logo page, match detail views show both teams with visual effects, and post-match generative designs create one-of-one merch artwork from match data
**Depends on**: Phase 1
**Requirements**: TEAM-01, TEAM-02, TEAM-03, TEAM-04, TEAM-05, MTCH-01, MTCH-02, MTCH-03, MTCH-04, MTCH-05
**Success Criteria** (what must be TRUE):
  1. User can visit any of the 48 team pages and see an interactive 3D pixel logo (rotate, zoom) with fluid simulation, plus the team's merch collection below
  2. User can view a match detail page showing both team logos rendered in the 3D grid with match result and prediction outcome
  3. After a match finishes, a unique merch design is generated from match data (score, stats, events) and appears as a purchasable product
  4. 48 pixelated team logos are available and render correctly in the 32x32 grid
**Plans**: TBD

Plans:
- [ ] 02-01: Team pages with interactive 3D pixel grid, 48-team logo library, and merch closet integration
- [ ] 02-02: Match experience and generative design pipeline (match views, result tracking, data-driven artwork generation)

### Phase 3: Fulfillment Pipeline
**Goal**: Generative match designs flow automatically from creation to print-ready files to Printful, and orders are fulfilled without manual intervention
**Depends on**: Phase 2
**Requirements**: FULF-01, FULF-02, FULF-03
**Success Criteria** (what must be TRUE):
  1. Generative match designs are automatically uploaded to Printful as print-ready files (correct resolution for the product type)
  2. When a user purchases generative merch, a print-on-demand order is created automatically in Printful via the Shopify-Printful integration
  3. The end-to-end pipeline works: match ends, design generates, product appears in store, user buys, order routes to Printful for production and shipping
**Plans**: TBD

Plans:
- [ ] 03-01: Printful integration (design upload, product sync, automated order fulfillment)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Commerce Foundation | 0/3 | Not started | - |
| 2. Team & Match Visuals | 0/2 | Not started | - |
| 3. Fulfillment Pipeline | 0/1 | Not started | - |
