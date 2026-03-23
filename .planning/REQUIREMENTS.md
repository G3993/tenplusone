# Requirements: ten+1

**Defined:** 2026-03-22
**Core Value:** Always-winning gambling — bet on a match to unlock merch at 50% off. Win or lose, you always walk away with something.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Commerce

- [x] **COMM-01**: User can browse World Cup 2026 matches with odds in a terminal-style UI
- [x] **COMM-02**: User can add match predictions to a bet slip (tap odds → add to slip)
- [x] **COMM-03**: User can select merch to wager on each prediction
- [x] **COMM-04**: User can browse merch catalog organized by team
- [x] **COMM-05**: User can view product details (mockup images, sizing, materials)
- [x] **COMM-06**: User can add merch to cart and checkout via Shopify
- [x] **COMM-07**: User receives order confirmation and tracking via Shopify emails
- [x] **COMM-08**: Winning prediction unlocks 50% discount code applied at checkout
- [x] **COMM-09**: Losing prediction unlocks consolation reward (store credit or reduced discount)
- [x] **COMM-10**: Discount codes are dynamically generated via Shopify Admin API after match resolution

### Team Experience

- [x] **TEAM-01**: Each of the 48 World Cup teams has a dedicated team page
- [x] **TEAM-02**: Team page displays interactive 3D pixel logo (32x32 grid) at the top
- [x] **TEAM-03**: Team page displays full merch collection ("closet") below the logo
- [x] **TEAM-04**: User can interact with the 3D pixel logo (rotate, zoom, fluid sim behind it)
- [x] **TEAM-05**: 48 pixelated team logos are available as pixel data for the grid

### Match Experience

- [ ] **MTCH-01**: User can see match result after a game finishes
- [ ] **MTCH-02**: User is notified whether their prediction won or lost
- [ ] **MTCH-03**: Match detail view shows both team logos in the 3D grid
- [ ] **MTCH-04**: Each match generates a one-of-one merch design driven by match data (score, stats, events)
- [ ] **MTCH-05**: Generative designs are finalized post-match and become purchasable as unique prints

### Fulfillment

- [ ] **FULF-01**: Print-on-demand integration (Printful) handles merch production
- [ ] **FULF-02**: Generative match designs are automatically uploaded to Printful as print-ready files
- [ ] **FULF-03**: POD orders are created automatically when a user purchases generative merch

### Frontend

- [x] **FRNT-01**: Terminal/code-editor aesthetic across all pages (Geist Mono, line numbers, black/white)
- [x] **FRNT-02**: Green reserved for hover states only — monochrome default
- [x] **FRNT-03**: Mobile-responsive layout that maintains terminal aesthetic
- [x] **FRNT-04**: Consistent nav bar across terminal and grid pages

### Infrastructure

- [x] **INFR-01**: Shopify store set up with products, collections, and Storefront API access
- [x] **INFR-02**: Backend API (Cloudflare Workers) for discount code generation, match resolution, and design pipeline
- [x] **INFR-03**: Football data API integration (API-Football) for match schedules, odds, and results
- [x] **INFR-04**: Wager database tracking user predictions, match outcomes, and discount codes

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Live Experience

- **LIVE-01**: Real-time match data drives 3D grid visuals during live matches via WebSocket
- **LIVE-02**: Match-specific collectible prints with rarity tiers (group stage vs final)
- **LIVE-03**: Live odds updates during matches

### Social

- **SOCL-01**: User accounts with saved predictions and order history
- **SOCL-02**: Leaderboard of top predictors
- **SOCL-03**: Share prediction/merch on social media

### Commerce Expansion

- **EXPN-01**: Store credit system for consolation rewards (save for later wagers)
- **EXPN-02**: Subscription model for recurring match predictions
- **EXPN-03**: Multi-sport expansion (Olympics, Euro, etc.)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-money betting / cash payouts | Requires sportsbook licensing — this is a discount mechanism, not gambling |
| NFT/blockchain | Adds friction, alienates normies, unnecessary for proving scarcity |
| Native mobile app | Web-first, responsive design sufficient |
| Custom payment processing | Shopify handles all payment infrastructure |
| User accounts with profiles (v1) | Guest checkout via Shopify sufficient; accounts are a v2 retention play |
| Chat/community features | Link to Discord/Twitter instead; building community tools is a separate product |
| AI-generated designs | Generative art is algorithmic from match data, not AI slop |
| Inventory holding | Print-on-demand only — zero inventory risk |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| COMM-01 | Phase 1 | Complete |
| COMM-02 | Phase 1 | Complete |
| COMM-03 | Phase 1 | Complete |
| COMM-04 | Phase 1 | Complete |
| COMM-05 | Phase 1 | Complete |
| COMM-06 | Phase 1 | Complete |
| COMM-07 | Phase 1 | Complete |
| COMM-08 | Phase 1 | Complete |
| COMM-09 | Phase 1 | Complete |
| COMM-10 | Phase 1 | Complete |
| TEAM-01 | Phase 2 | Complete |
| TEAM-02 | Phase 2 | Complete |
| TEAM-03 | Phase 2 | Complete |
| TEAM-04 | Phase 2 | Complete |
| TEAM-05 | Phase 2 | Complete |
| MTCH-01 | Phase 2 | Pending |
| MTCH-02 | Phase 2 | Pending |
| MTCH-03 | Phase 2 | Pending |
| MTCH-04 | Phase 2 | Pending |
| MTCH-05 | Phase 2 | Pending |
| FULF-01 | Phase 3 | Pending |
| FULF-02 | Phase 3 | Pending |
| FULF-03 | Phase 3 | Pending |
| FRNT-01 | Phase 1 | Complete |
| FRNT-02 | Phase 1 | Complete |
| FRNT-03 | Phase 1 | Complete |
| FRNT-04 | Phase 1 | Complete |
| INFR-01 | Phase 1 | Complete |
| INFR-02 | Phase 1 | Complete |
| INFR-03 | Phase 1 | Complete |
| INFR-04 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 31 total
- Mapped to phases: 31
- Unmapped: 0

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-03-22 after roadmap creation*
