# Architecture Patterns

**Domain:** Headless commerce + wagering engine + print-on-demand + live sports data + generative visuals
**Researched:** 2026-03-22

## System Overview

ten+1 has five distinct concerns that must integrate cleanly:

1. **Frontend** -- Terminal-aesthetic UI with Three.js generative visuals
2. **Commerce Backend** -- Shopify (headless) for products, cart, checkout, payments
3. **Wagering Engine** -- Custom server that manages bets, generates discount codes, resolves outcomes
4. **Live Data Ingestion** -- Polling soccer APIs during matches, feeding data to visuals and wagering
5. **Design Pipeline** -- Three.js renders match-driven designs, exports high-res images, pushes to Printful

These are NOT five microservices. They are **four logical layers** served by two deployments (frontend + backend API) plus three external services (Shopify, Printful, football API).

## Recommended Architecture

```
                                    +------------------+
                                    |   Shopify Admin   |
                                    |   (Products,      |
                                    |    Discounts,     |
                                    |    Orders)        |
                                    +--------+---------+
                                             |
                                             | Admin GraphQL API
                                             | (server-to-server)
                                             |
+-------------+    Storefront API    +-------+--------+     Printful REST API    +------------+
|             | <------------------> |                 | ----------------------> |            |
|  Frontend   |                      |  Backend API    |                         |  Printful  |
|  (Browser)  | <--- WebSocket ----> |  (Node.js)      | <--- Webhooks -------- |  (PoD)     |
|             |                      |                 |                         |            |
+------+------+                      +-------+---------+                         +------------+
       |                                     |
       |  Three.js renders                   |  Polls every 10-15s during matches
       |  (client-side)                      |
       |                                     v
       |                             +-------+---------+
       +--- high-res PNG upload ---> |  Football API   |
            (via backend)            |  (API-Football   |
                                     |   or Sportmonks) |
                                     +-----------------+
```

### Component Boundaries

| Component | Responsibility | Communicates With | Deployment |
|-----------|---------------|-------------------|------------|
| **Frontend** | Terminal UI, match browsing, bet placement, Three.js visuals, team pages | Backend API (REST + WebSocket), Shopify Storefront API (cart/checkout) | Vercel / static host |
| **Backend API** | Wagering logic, discount code generation, match data polling, design finalization, Printful product creation | Shopify Admin API, Printful API, Football API, Frontend (WebSocket) | Railway / Fly.io / VPS |
| **Shopify** | Product catalog, cart, checkout, payments, order management, discount codes | Backend API (Admin GraphQL), Frontend (Storefront GraphQL) | Shopify-hosted (SaaS) |
| **Printful** | Print fulfillment, shipping, mockup generation | Backend API (REST), Shopify (order sync via app integration) | Printful-hosted (SaaS) |
| **Football API** | Match schedules, live scores, match events, team data | Backend API (REST polling) | Third-party (SaaS) |

## Data Flow

### Flow 1: User Places a Wager

```
1. User browses matches on Frontend (data from Backend API cache)
2. User selects team + match + merch item
3. Frontend POST /api/wagers { matchId, teamId, productId }
4. Backend API:
   a. Validates match hasn't started / is still open for betting
   b. Creates wager record in database (SQLite/Postgres)
   c. Returns wager confirmation + wager ID
5. User proceeds to Shopify checkout at FULL PRICE
   (discount applied AFTER match resolution, not before)
```

### Flow 2: Match Resolution + Discount Fulfillment

```
1. Backend API polls Football API every 10-15s during live match
2. Match ends -> Backend receives final score
3. For each wager on this match:
   a. IF user's team won:
      - Call Shopify Admin API: discountCodeBasicCreate (50% off, single-use, tied to user)
      - Send discount code to user (email / shown in UI)
   b. IF user's team lost:
      - Generate consolation: store credit or downgraded merch discount (e.g., 15% off)
      - Call Shopify Admin API: create appropriate discount code
   c. Mark wager as RESOLVED
4. Frontend updates via WebSocket push
```

### Flow 3: Generative Merch Design Pipeline

```
1. Match ends -> Backend has full match data (score, stats, events, timeline)
2. Backend sends match data to Frontend via API (or dedicated render worker)
3. Three.js scene renders with match parameters:
   - Score drives grid layout/colors
   - Possession % drives texture blending
   - Key events (goals, cards) become visual elements
   - Team logos form the base composition
4. Renderer exports high-res PNG (4096x4096+ for print quality):
   - WebGLRenderer with preserveDrawingBuffer: true
   - Render to offscreen canvas at print resolution
   - canvas.toBlob() -> upload to Backend API
5. Backend API:
   a. Uploads design image to Printful via File API
   b. Creates product via Printful Products API (with design placement)
   c. Syncs product to Shopify (Printful-Shopify native integration handles this)
   d. Links product to match record in database
```

**Important design decision:** The generative render happens client-side (browser) because the Three.js scene + shaders already exist there. A headless server-side render (puppeteer/playwright) is the alternative but adds complexity for v1. Client-side render triggered by an admin or automated post-match flow is simpler.

### Flow 4: Live Match Visuals

```
1. Backend API polls Football API every 10-15s
2. Backend pushes match updates to connected Frontend clients via WebSocket
3. Frontend updates Three.js scene in real-time:
   - Grid cells change color/shape based on score changes
   - Fluid simulation intensity maps to match momentum
   - Goal events trigger visual bursts
4. This is purely cosmetic during the match -- the design is only "finalized" post-match
```

### Flow 5: Standard Commerce (No Betting)

```
1. User browses merch catalog (Frontend queries Shopify Storefront API directly)
2. User adds to cart (Storefront API cartCreate / cartLinesAdd)
3. User checks out (Shopify-hosted checkout or Storefront API checkout)
4. Order flows to Printful via native Shopify-Printful integration
5. Printful fulfills and ships
```

## Database Schema (Backend API)

The backend needs minimal persistent state. Shopify handles products/orders, Printful handles fulfillment. The backend only tracks:

```
wagers
  id            UUID
  user_email    TEXT          -- identifier (no accounts v1, just email)
  match_id      TEXT          -- football API match ID
  team_id       TEXT          -- which team they picked
  product_id    TEXT          -- Shopify product ID they wagered on
  status        ENUM         -- PENDING | WON | LOST | RESOLVED
  discount_code TEXT          -- generated Shopify discount code (after resolution)
  created_at    TIMESTAMP
  resolved_at   TIMESTAMP

matches
  id            TEXT          -- football API match ID
  home_team     TEXT
  away_team     TEXT
  kickoff       TIMESTAMP
  status        ENUM         -- SCHEDULED | LIVE | FINISHED
  score_home    INT
  score_away    INT
  match_data    JSON         -- full stats blob for generative design
  design_url    TEXT         -- finalized design image URL
  product_id    TEXT         -- Shopify product ID for generated merch

match_events
  id            UUID
  match_id      TEXT
  event_type    TEXT          -- GOAL | CARD | SUBSTITUTION | etc.
  minute        INT
  data          JSON
  created_at    TIMESTAMP
```

**Use SQLite (via better-sqlite3) for v1.** The data volume is tiny -- 64 matches in a World Cup, maybe a few thousand wagers. SQLite is zero-config, embedded, and more than sufficient. Migrate to Postgres only if you need concurrent write scaling.

## Patterns to Follow

### Pattern 1: Two-API Shopify Integration

**What:** Use Storefront API from the browser for reads (products, collections, cart) and Admin API from the server for writes (discount codes, product creation).

**Why:** Storefront API is designed for public-facing usage with limited permissions. Admin API requires secret tokens and must stay server-side. This is the standard headless Shopify pattern.

```
Frontend (browser):
  - Storefront API (public token, read-only-ish)
  - Browse products, manage cart, initiate checkout

Backend (server):
  - Admin API (secret token, full access)
  - Create discount codes, create products, manage inventory
```

### Pattern 2: Polling with Smart Caching for Sports Data

**What:** Poll the football API at intervals, cache results, broadcast to clients via WebSocket.

**Why:** Football APIs are REST-only (no WebSocket). Polling every 10-15s during live matches is the standard approach. Cache aggressively -- hundreds of connected clients should NOT each trigger API calls.

```typescript
// Backend pseudo-pattern
const POLL_INTERVAL_LIVE = 10_000;   // 10s during live matches
const POLL_INTERVAL_IDLE = 300_000;  // 5min when no live matches

async function pollMatchData() {
  const liveMatches = await footballApi.getLiveMatches();
  for (const match of liveMatches) {
    cache.set(`match:${match.id}`, match);
    wsServer.broadcast(`match:${match.id}`, match);
  }
}
```

### Pattern 3: Event-Driven Wager Resolution

**What:** When a match transitions to FINISHED, trigger wager resolution as a discrete event, not inline with the polling loop.

**Why:** Separation of concerns. The poll updates data; a separate handler resolves wagers, generates discounts, triggers design pipeline. This prevents a failed discount creation from blocking match data updates.

```
Poll detects match FINISHED
  -> emit('match:finished', matchData)
     -> handler: resolveWagers(matchId)
     -> handler: triggerDesignPipeline(matchId, matchData)
     -> handler: notifyUsers(matchId)
```

### Pattern 4: Deferred Discount (Not Pre-Applied)

**What:** Users check out at full price. Discount codes are generated AFTER match resolution and sent to winning users for future purchase or refund.

**Why:** This avoids the complexity of holding carts open, prevents gaming (placing bets after kickoff), and keeps Shopify checkout flow standard. The "wager" is a separate action from "purchase."

**Alternative considered and rejected:** Pre-checkout discount that gets revoked if the user loses. This creates terrible UX (charge the full amount later?) and Shopify doesn't support revoking applied discounts after checkout.

**Revised simpler model:** User places wager (free, no purchase yet). Match resolves. Winner gets 50% discount code. Loser gets consolation discount. Both can then shop with their codes. This is cleaner than trying to tie wagers to specific cart items.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Treating Shopify as a Dumb Database

**What:** Trying to replicate Shopify's product/order data in your own database and keeping them in sync.

**Why bad:** You'll fight data consistency forever. Shopify is the source of truth for products, orders, inventory, and payments. Your backend should reference Shopify IDs, not duplicate Shopify data.

**Instead:** Store only references (Shopify product IDs, order IDs) in your wager database. Query Shopify when you need product details.

### Anti-Pattern 2: Server-Side Three.js Rendering for v1

**What:** Running headless Chrome/Puppeteer on the server to render Three.js scenes for design generation.

**Why bad for v1:** Adds massive infrastructure complexity (headless browser in production), memory-hungry, hard to debug. The Three.js scene already runs in the browser.

**Instead:** For v1, trigger the render client-side (admin panel or automated post-match page), export the canvas as PNG, upload to backend. Move to server-side rendering in v2 if you need to fully automate the pipeline without any browser involvement.

### Anti-Pattern 3: Real-Time Odds Calculation

**What:** Building a dynamic odds engine that adjusts based on betting volume.

**Why bad:** This IS gambling infrastructure. It requires licensing, compliance, and algorithmic complexity that's completely out of scope. ten+1 is a merch platform with a betting *theme*, not an actual sportsbook.

**Instead:** Fixed discount tiers. Bet on the favorite? 50% off if they win. Bet on the underdog? Maybe 60% off. Simple, static, no odds engine needed.

### Anti-Pattern 4: Building Auth for v1

**What:** Full user account system with login, registration, profiles.

**Why bad:** The project spec explicitly says no user accounts for v1. Adding auth multiplies complexity (session management, password reset, data privacy).

**Instead:** Email-only identification for wagers. Shopify handles customer identity at checkout. If you need to associate wagers with purchases later, match by email.

## Component Build Order

Build order is driven by dependencies -- each layer needs the one before it.

```
Phase 1: Foundation
  [Frontend Shell] -----> [Shopify Integration]
  Terminal UI, routing     Storefront API: products, cart, checkout

  These have NO dependency on betting or live data.
  You get a working merch store at the end of Phase 1.

Phase 2: Live Data + Visuals
  [Football API Client] -----> [WebSocket Server] -----> [Frontend Live Updates]
  Polling, caching              Push to clients           Three.js match visuals

  Depends on: Phase 1 frontend shell exists
  Independent of: Shopify integration

Phase 3: Wagering Engine
  [Wager Database] -----> [Wager API] -----> [Match Resolution] -----> [Discount Generation]
  SQLite schema            POST/GET endpoints  Event-driven             Shopify Admin API

  Depends on: Phase 1 (Shopify for discounts), Phase 2 (match data for resolution)

Phase 4: Design Pipeline
  [Generative Renderer] -----> [Image Export] -----> [Printful Product Creation]
  Three.js + match params       High-res PNG          API upload + sync to Shopify

  Depends on: Phase 2 (match data), Phase 1 (Shopify products)
  Can be partially parallel with Phase 3
```

**Critical path:** Phase 1 must come first because everything depends on having a frontend and commerce backbone. Phase 2 and the beginning of Phase 3 can overlap. Phase 4 is the most independent -- it can be built whenever Three.js visuals exist.

## Scalability Considerations

| Concern | During World Cup (peak) | Post-World Cup | Notes |
|---------|------------------------|----------------|-------|
| Concurrent users | Hundreds to low thousands during matches | Near zero | WebSocket connections are the bottleneck |
| API rate limits | Football API: ~300 req/min on paid tier | N/A | Single poller with cache, not per-user polling |
| Shopify API limits | 50 req/s (Admin), uncapped (Storefront, mostly) | Low | Discount code creation is batched post-match |
| Printful API limits | Low volume -- 64 matches = 64 products max | N/A | Not a concern |
| Database | Thousands of wager rows total | Static archive | SQLite is more than sufficient |

This is a **seasonal, event-driven product**. It peaks during the World Cup (June-July 2026) and is essentially dormant otherwise. Do not over-architect for scale that will never materialize.

## Technology Boundaries Summary

| Boundary | Left Side | Right Side | Interface |
|----------|-----------|------------|-----------|
| Browser <-> Backend | Frontend (Three.js, terminal UI) | Node.js API server | REST API + WebSocket |
| Backend <-> Shopify | Node.js API server | Shopify | Admin GraphQL API (server), Storefront GraphQL API (browser) |
| Backend <-> Football | Node.js API server | API-Football / Sportmonks | REST polling (10-15s live, 5min idle) |
| Backend <-> Printful | Node.js API server | Printful | REST API (product creation, image upload) |
| Shopify <-> Printful | Shopify (orders) | Printful (fulfillment) | Native Shopify app integration (automatic) |

## Sources

- [Shopify Storefront API Reference](https://shopify.dev/docs/api/storefront/latest)
- [Shopify discountCodeBasicCreate Mutation](https://shopify.dev/docs/api/admin-graphql/latest/mutations/discountCodeBasicCreate)
- [Shopify cartDiscountCodesUpdate Mutation](https://shopify.dev/docs/api/storefront/latest/mutations/cartDiscountCodesUpdate)
- [Printful API Documentation](https://developers.printful.com/docs/)
- [Printful Shopify Integration](https://www.printful.com/integrations/shopify)
- [football-data.org API Reference](https://www.football-data.org/documentation/api)
- [API-Football](https://www.api-football.com/)
- [Sportmonks World Cup 2026 API Guide](https://www.sportmonks.com/blogs/world-cup-2026-api-guide-coverage-endpoints-data-types/)
- [Vercel: Building Ecommerce with Next.js and Shopify](https://vercel.com/kb/guide/building-ecommerce-sites-with-next-js-and-shopify)
- [Three.js Canvas Export Discussion](https://discourse.threejs.org/t/how-to-save-rendering-scene-to-img/41858)
