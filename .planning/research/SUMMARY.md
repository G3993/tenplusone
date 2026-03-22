# Project Research Summary

**Project:** ten+1 (World Cup 2026 merch betting platform)
**Domain:** Headless commerce + wagering/discount engine + print-on-demand + live sports data + generative 3D visuals
**Researched:** 2026-03-22
**Confidence:** MEDIUM-HIGH

## Executive Summary

ten+1 is a headless Shopify commerce platform with a terminal/code-editor aesthetic, where users "predict" World Cup match outcomes to unlock merch discounts. The product integrates five distinct systems: a Vite + React SPA frontend with Three.js generative visuals, Shopify for commerce and payments, a custom backend for wagering logic and discount generation, live football data APIs, and Printful for print-on-demand fulfillment of one-of-one match-driven designs. The recommended stack is well-established (Vite, React 19, TypeScript, vanilla Three.js, Zustand, Cloudflare Workers/Pages) with high confidence across all core technologies. The decision to skip Hydrogen/Next.js in favor of a pure SPA is correct -- SSR adds complexity with zero benefit for WebGL-heavy client-rendered pages.

The most critical risk is legal: the "bet to get a discount" mechanic contains all three elements of an illegal lottery (prize + chance + consideration). This must be resolved before any code is written by either eliminating the purchase requirement (sweepstakes model with free entry) or reframing so the match outcome affects the design received, not the discount amount. A $2-5K promotional compliance legal review is a non-negotiable pre-development expense. The second major risk is architectural: Shopify's Storefront API cannot create discount codes. A backend server with Admin API access is mandatory from day one, not optional. Teams that plan a "headless frontend only" architecture will hit a wall when they try to generate per-user discount codes post-match.

The product is event-driven and seasonal (World Cup runs June 11 - July 19, 2026), which means the build timeline is fixed and unforgiving. The recommended approach is to ship a working merch store with basic wagering by June 11, layer on generative visuals and POD integration before knockout rounds (~July), and polish the live match experience for the finals. Over-architecting for scale is a trap -- this is hundreds to low thousands of concurrent users, not millions. SQLite is sufficient. The 48-team pixel logo library (50-150 hours of design work) is the longest-lead creative asset and must start immediately.

## Key Findings

### Recommended Stack

The stack centers on Vite + React 19 + TypeScript as a static SPA, deployed to Cloudflare Pages with Cloudflare Workers for serverless backend logic. This is the simplest architecture that supports all requirements -- no SSR, no server runtime for the frontend, deploy to any CDN.

**Core technologies:**
- **Vite 6 + React 19 + TypeScript 5.7**: SPA build toolchain -- smallest step up from the existing prototype, instant HMR, zero-config
- **@shopify/storefront-api-client**: Official headless Shopify client (replaces deprecated JS Buy SDK) -- typed GraphQL, cart mutations, checkout URLs
- **Three.js r183 (vanilla, not R3F)**: 3D rendering for the pixel grid, fluid sim, and generative visuals -- prototype already works in vanilla Three.js, R3F adds indirection for custom shader work
- **Zustand 5**: Lightweight state management (~1KB) -- works outside React (critical for Three.js reading state without re-renders)
- **Cloudflare Workers + KV**: Serverless backend for API key proxying, webhook handling, wagering logic, and match data polling -- 0ms cold starts, free tier sufficient for MVP
- **Cloudflare Pages**: Static hosting with native Workers integration -- `vite build` produces dist/, git-based deploys
- **CSS Modules**: Component-scoped styles without runtime CSS-in-JS -- preserves the prototype's intentional terminal typography (Geist Mono, exact color values)

**Flag:** Cloudflare Workers may hit CPU time limits (50ms free, 30s paid) for the generative design pipeline if heavy image processing is needed. May require Cloudflare Queues for longer-running tasks.

### Expected Features

**Must have (table stakes):**
- Match browser with odds in terminal UI -- the storefront entry point
- Bet/prediction placement flow (bet slip UX) -- the engagement hook
- "Always win" outcome resolution -- win = 50% off, lose = consolation discount
- Product browsing, detail pages, cart, and checkout via Shopify
- Mobile-responsive layout (60%+ of sports fans browse on mobile)
- Match result tracking and order confirmation
- Team pages (start with 2-4, expand to 48)

**Should have (differentiators):**
- Terminal/code-editor UI -- nobody else sells World Cup merch through a terminal interface
- Generative match-driven merch designs -- one-of-one prints from real match data
- Interactive 3D pixel grid logos on team pages
- Live match data driving grid visuals in real-time
- Match-specific collectible prints with rarity tiers

**Defer indefinitely:**
- User accounts / social features / chat
- Multi-sport support
- Native mobile app
- NFT/blockchain layer
- AI-generated designs (keep it algorithmic, not AI slop)
- Complex loyalty/points system
- Custom payment processing
- Inventory management (POD only)

### Architecture Approach

The system has five logical concerns (frontend, commerce, wagering, live data, design pipeline) served by two deployments (SPA frontend + backend API) plus three external SaaS services (Shopify, Printful, API-Football). The frontend talks to Shopify Storefront API directly for reads (products, cart) and to the custom backend for wagering, live data, and discount delivery. The backend talks to Shopify Admin API for discount code creation and product management, to API-Football for match data polling, and to Printful for design uploads. Shopify and Printful connect via native integration for order fulfillment.

**Major components:**
1. **Frontend (Vite SPA)** -- Terminal UI, match browsing, bet placement, Three.js visuals, team pages. Communicates with backend via REST + WebSocket.
2. **Backend API (Cloudflare Workers or Node.js)** -- Wagering logic, discount code generation (Shopify Admin API), match data polling/caching, design pipeline orchestration, Printful product creation.
3. **Shopify (SaaS)** -- Product catalog, cart, checkout, payments, order management, discount codes. Source of truth for all commerce data.
4. **Printful (SaaS)** -- Print fulfillment, mockup generation, shipping. Auto-syncs with Shopify for order routing.
5. **API-Football (SaaS)** -- Match schedules, live scores, match events/stats. Polled every 10-15s during live matches, cached and broadcast via WebSocket.

**Key architectural decisions:**
- Deferred discounts: users do NOT get discounts at checkout. They predict, match resolves, then they receive a discount code for a future purchase. Simpler, prevents gaming, keeps Shopify checkout standard.
- Client-side generative render (v1): Three.js renders the match-driven design in the browser (admin trigger), exports high-res PNG, uploads to backend. Server-side (Puppeteer) deferred to v2.
- SQLite for v1 database: tiny data volume (64 matches, few thousand wagers). Zero-config. Migrate to Postgres only if needed.
- Email-only identification for wagers (no user accounts in v1). Match to Shopify customer by email.

### Critical Pitfalls

1. **Illegal lottery classification** -- The "bet for a discount" mechanic hits all three elements of an illegal lottery (prize + chance + consideration). Must either offer a free-entry path (sweepstakes model) or reframe so match outcome affects the design, not the price. Get a promotional compliance attorney before launch. Budget $2-5K. This is a project-killer if ignored.

2. **Storefront API cannot create discounts** -- Discount code creation requires the Admin API (server-side, secret token). A backend service is mandatory from day one. Do not plan a frontend-only architecture.

3. **Print resolution gap** -- Screen renders (1024px) are 20x too small for print (3600x4800px for t-shirts at 300 DPI). Must build the offscreen high-res render pipeline from the start, not retrofit it. Order test prints early ($50-100 budget).

4. **POD fulfillment timing** -- Print-on-demand takes 2-7 business days for production plus shipping. Match-driven designs are generated post-match, so total delivery is 2-4 weeks. Set expectations aggressively ("ships 7-14 days after the match"), automate the entire design-to-order pipeline (target < 1 hour from final whistle to Printful submission), and pre-generate design templates before matches.

5. **48-team pixel art library** -- Each 32x32 pixel logo takes 1-3 hours of design work. 48 teams = 50-150 hours. This is the longest-lead creative asset. Start immediately, use algorithmic SVG-to-grid conversion + hand refinement, prioritize by opening match schedule.

## Implications for Roadmap

### Phase 1: Commerce Foundation + Wagering Core
**Rationale:** Everything depends on having a working store and the legal/business model validated. Commerce + wagering are the two foundational systems. The legal structure of the prediction mechanic must be settled before any discount logic is written.
**Delivers:** A functional terminal-aesthetic merch store with Shopify integration (browse, cart, checkout) and a basic prediction/wagering system with post-match discount code delivery. Working for 2-4 teams.
**Addresses:** Match browser, bet placement, outcome resolution, product browsing, cart/checkout, team pages (2-4 teams)
**Avoids:** Pitfall 1 (legal -- resolve before writing discount logic), Pitfall 2 (backend for Admin API -- architect from day one)
**Stack:** Vite + React + TS, Shopify Storefront + Admin API, Cloudflare Workers, Zustand, SQLite, CSS Modules

### Phase 2: Generative Visuals + POD Pipeline
**Rationale:** With commerce working, layer on the differentiating features: the 3D pixel grid, generative match-driven designs, and automated Printful integration. This is the creative core that makes ten+1 unique.
**Delivers:** Interactive Three.js team logos on team pages, post-match generative design pipeline (high-res render -> Printful upload -> Shopify product creation), expanded team coverage (16-48 teams).
**Addresses:** Interactive 3D pixel grid, generative match-driven merch, print-on-demand integration, match-specific collectible prints, team expansion
**Avoids:** Pitfall 3 (build high-res render pipeline from start), Pitfall 4 (automate design-to-order pipeline), Pitfall 8 (prioritize pixel art by match schedule)
**Stack:** Three.js r183, GLSL shaders, Printful API v2, html-to-image/sharp, Cloudflare Queues (if needed for image processing)

### Phase 3: Live Experience + Polish
**Rationale:** Live match data driving real-time visuals is the premium experience for knockout rounds and finals. This phase also handles mobile optimization, checkout UX polish, and SEO basics.
**Delivers:** Real-time match data feeding Three.js visuals via WebSocket, mobile performance optimization (fallback rendering tiers), checkout transition UX, rarity tiers for collectible prints.
**Addresses:** Live match data driving visuals, mobile responsiveness, match-specific collectibles with rarity, SEO basics
**Avoids:** Pitfall 5 (paid API tier for reliable live data), Pitfall 6 (checkout transition messaging), Pitfall 11 (mobile performance tiers)
**Stack:** WebSocket server, API-Football paid tier, CSS fallbacks for low-end devices

### Phase Ordering Rationale

- **Phase 1 must come first** because Shopify integration and the wagering backend are dependencies for everything else. You cannot test discount delivery without a store. You cannot test prediction flows without match data.
- **Phase 2 groups visual + POD work** because the generative design pipeline is the bridge between Three.js (client) and Printful (fulfillment). These are tightly coupled -- the render resolution, export format, and Printful upload are one integrated system.
- **Phase 3 defers live data** because it requires real World Cup matches to test properly. Group stage matches (June 11+) provide the testing ground. The live visual experience is impressive but not required for commerce to function.
- **The 48-team pixel art is a parallel workstream** that spans Phase 1 and Phase 2. It is design work, not engineering, and should start immediately regardless of phase.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Legal structure of the prediction/discount mechanic -- needs attorney consultation, not more internet research. The Shopify Admin API discount creation flow also needs hands-on validation (code generation, single-use enforcement, expiration).
- **Phase 2:** Printful API v2 (still in beta) for the automated design upload pipeline. The generative design -> high-res export -> Printful product creation flow is the least documented part of the system. Needs prototyping.
- **Phase 2:** Cloudflare Workers CPU limits for image processing. If sharp/Canvas API processing exceeds Worker limits, need to evaluate Cloudflare Queues or an alternative compute platform for the design pipeline.

Phases with standard patterns (skip research-phase):
- **Phase 1 (commerce):** Shopify Storefront API headless integration is thoroughly documented with official examples.
- **Phase 1 (frontend):** Vite + React + TypeScript SPA is the most common frontend stack in 2025/2026. No research needed.
- **Phase 3 (WebSocket):** Polling + caching + WebSocket broadcast for live data is a well-established pattern.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All core technologies are current stable releases with official documentation. Vite, React 19, Three.js r183, Zustand 5 are mainstream. |
| Features | HIGH | Table stakes are well-defined from sportsbook UX research and e-commerce norms. Differentiators are validated by the existing prototype. |
| Architecture | MEDIUM-HIGH | The two-API Shopify pattern and polling architecture are standard. The generative design pipeline (client-side render -> POD upload) is less proven and needs prototyping. |
| Pitfalls | HIGH | Legal risk is well-documented with specific statutes cited. Technical pitfalls (API limitations, resolution gaps) are verified against official API docs. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Legal structure validation:** The sweepstakes/promotional pricing model needs attorney review. Research identifies the risk clearly but cannot provide legal advice. This is a pre-development blocker.
- **Printful API v2 beta stability:** The generative design upload pipeline depends on Printful's v2 API which is still in beta. Fallback is v1 (stable, less capable). Needs hands-on testing early in Phase 2.
- **World Cup 2026 data availability:** Football APIs claim coverage but actual live data for WC 2026 cannot be verified until the tournament starts. football-data.org as fallback mitigates this.
- **Cloudflare Workers compute limits:** The design pipeline may exceed Workers' CPU time limits for image processing. Need to validate during Phase 2 whether Workers, Queues, or an alternative compute service is needed.
- **Shopify Plus requirement:** Checkout customization (matching the terminal aesthetic) requires Shopify Plus ($2300/month). For MVP, accept the visual break to Shopify's standard checkout. Decision point for post-MVP.
- **FIFA exclusive betting data rights:** Stats Perform holds exclusive betting data rights for WC 2026. For scores and basic stats (not odds), third-party APIs are fine. If official odds data is ever needed, Stats Perform is the only legal source.

## Sources

### Primary (HIGH confidence)
- [Shopify Storefront API Reference](https://shopify.dev/docs/api/storefront/latest) -- cart, checkout, product queries
- [Shopify Admin API - discountCodeBasicCreate](https://shopify.dev/docs/api/admin-graphql/latest/mutations/discountCodeBasicCreate) -- discount creation
- [@shopify/storefront-api-client on npm](https://www.npmjs.com/package/@shopify/storefront-api-client) -- official headless client
- [Three.js releases (r183)](https://github.com/mrdoob/three.js/releases) -- current stable
- [Vite documentation](https://vite.dev/guide/) -- build toolchain
- [Printful API documentation](https://developers.printful.com/docs/) -- fulfillment integration
- [API-Football documentation v3](https://www.api-football.com/documentation-v3) -- match data

### Secondary (MEDIUM confidence)
- [Sweepstakes 101: Prize, Chance & Consideration](https://ussweeps.com/about-us/blog/sweepstakes-law/sweepstakes-101/) -- legal framework for prediction mechanic
- [NY Senate Bill S5935](https://is-this-legal.com/is-polymarket-legal-in-new-york/) -- gambling classification precedent
- [Printful File Preparation Guide](https://www.printful.com/blog/everything-you-need-to-know-to-prepare-the-perfect-printfile) -- print resolution requirements
- [FIFA Stats Perform exclusive betting data rights](https://inside.fifa.com/media-releases/stats-perform-official-worldwide-betting-data-streaming-rights-distributor-world-cup) -- data licensing

### Tertiary (LOW confidence)
- Printful API v2 beta -- needs hands-on validation, beta status means breaking changes possible
- World Cup 2026 API coverage claims -- cannot verify until tournament starts

---
*Research completed: 2026-03-22*
*Ready for roadmap: yes*
