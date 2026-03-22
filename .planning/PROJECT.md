# ten+1

## What This Is

ten+1 is an Internet Football Club — a World Cup 2026 merch betting platform where users wager on matches to get custom merch at a discount. It's built for internet-native people who live in terminals and appreciate lo-fi, digital aesthetics. The frontend looks and feels like a code editor (inspired by Terminal Shop), backed by Shopify for commerce and print-on-demand for fulfillment.

## Core Value

Always-winning gambling: bet on a match to unlock merch at 50% off. Win or lose, you always walk away with something — the bet is the hook, the merch is the product.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can browse World Cup 2026 matches with odds (terminal-style UI)
- [ ] User can click a team to view their team page (interactive 3D pixel logo + merch collection)
- [ ] User can wager on a match outcome to unlock discounted merch (50% off if team wins)
- [ ] User who loses a wager gets downgraded merch or store credit (nobody loses everything)
- [ ] Each match generates one-of-one merch designs driven by match data (score, stats, events)
- [ ] User can browse and purchase merch at full price without betting
- [ ] Shopify integration handles cart, checkout, payments, and inventory
- [ ] Print-on-demand integration for custom/generative merch fulfillment
- [ ] 48-team pixelated logo library displayed in the 3D grid format
- [ ] Match detail view shows both team logos with interactive 3D grid + fluid sim
- [ ] Team page shows interactive logo at top + full merch "closet" below
- [ ] Live match data feeds into the grid to update textures/visuals during games

### Out of Scope

- Native mobile app — web-first, responsive
- Real-money gambling/sportsbook licensing — this is merch discounts, not cash payouts
- User accounts with social features (v1 is commerce-focused, not social)
- Multiple sports — World Cup 2026 only for v1

## Context

**Design references:**
- Terminal Shop (terminal.shop) — code editor aesthetic, Geist Mono font, line numbers, minimal black/white with green hover states
- The existing prototype has two pages: a React terminal landing (index.html) with match browsing, odds, and bet slip, and a Three.js 3D pixel grid (grid.html) with WebGL fluid simulation behind it
- Argentina and France are the two prototype teams with pixel logo data already built

**Technical landscape:**
- Shopify Storefront API for headless commerce (custom frontend, Shopify backend)
- Print-on-demand services (Printful, Printify, Gooten) integrate with Shopify
- Soccer data APIs (football-data.org, API-Football) for live match stats
- Current frontend: vanilla HTML/JS with React via CDN (Babel standalone) and Three.js r128
- The 3D grid is 32x32 (1024 cells), each cell is a cube/sphere that flips to form pixelated logos

**Generative merch concept:**
- Match data (score, possession, shots, cards, key events) parameterize the design
- The 3D grid + textures/shaders create visual variations per match
- Post-match, the design is finalized and becomes a one-of-one print
- Bigger matches and closer scores = rarer, more collectible pieces
- Creates genuine scarcity — each design is generated once, after the match, and never repeated

## Constraints

- **Commerce**: Shopify as the commerce backbone — no custom payment processing
- **Fulfillment**: Print-on-demand only — no inventory holding
- **Design**: Terminal/code-editor aesthetic must be maintained across all pages (Geist Mono, line numbers, black/white, green hover states)
- **Legal**: This is NOT gambling — it's a discount mechanism. No cash payouts, no sportsbook license needed. Users always receive merch.
- **Prototype teams**: Argentina and France for v1 prototype, expand to all 48 teams

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Shopify headless (Storefront API) | Custom terminal frontend incompatible with Shopify themes; need full control over UI | — Pending |
| Print-on-demand over inventory | Zero upfront cost, infinite SKU variety for generative designs | — Pending |
| "Always winning" model over traditional betting | Legal simplicity (no gambling license), better user psychology, merch-first business | — Pending |
| Terminal Shop aesthetic | Target audience is internet-native devs/creators; code editor UI is the differentiator | — Pending |
| 3D pixel grid as team identity | Each team's page features their interactive logo; doubles as generative canvas for match designs | — Pending |

---
*Last updated: 2026-03-22 after initialization*
