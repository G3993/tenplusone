# Feature Landscape

**Domain:** Gamified sports merch commerce (betting-to-discount) with generative art
**Researched:** 2026-03-22

## Table Stakes

Features users expect. Missing = product feels incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Match browser with odds display | Core loop starts here -- users need to see what's happening and what they can bet on | Medium | Terminal-style list view. Needs live data from football API. Must show match time, teams, current odds |
| Bet placement flow (bet slip) | Without this the product has no hook. Sportsbook UX has trained users to expect tap-to-add, review, confirm | Medium | Not real money -- it's a "wager to unlock discount" flow. Must feel familiar to betting UX but legally distinct |
| "Always win" outcome resolution | Core value prop. User must clearly understand what they get whether their team wins or loses | Low | Win = 50% off merch. Lose = consolation (store credit, downgraded item, or smaller discount). Must be crystal clear |
| Product browsing (merch catalog) | It's a store -- users need to see what they're buying | Medium | Team-organized collections. T-shirts, hoodies, posters, hats. Shopify product data via Storefront API |
| Cart and checkout | Commerce doesn't work without it | Low | Shopify handles payments/checkout. Custom cart UI in terminal aesthetic, then redirect to Shopify checkout |
| Product detail pages | Users need to see mockups, sizing, materials before buying | Low | Print-on-demand mockup images. Size guide. Terminal-styled but clear product photography |
| Mobile-responsive layout | 60%+ of sports fans browse on mobile during matches | Medium | Terminal aesthetic needs to work on small screens. Monospace font is harder to read on mobile -- needs careful sizing |
| Match result tracking | Users need to know if they won or lost their bet | Low | Post-match status update. Email notification. Clear visual state change on their wager |
| Order tracking / confirmation | Standard e-commerce expectation | Low | Shopify handles this via order confirmation emails. Link back from custom UI |
| Team pages (48 teams) | Users browse by team loyalty. Missing their team = they leave | High | 48 pixelated logos needed. Each team page = interactive 3D logo + merch collection. Prototype has 2 (ARG, FRA) |

## Differentiators

Features that set ten+1 apart. Not expected, but create the magic.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Terminal/code-editor UI | Nobody else sells World Cup merch through a terminal interface. Instantly memorable, targets internet-native audience | High | Inspired by terminal.shop. Geist Mono, line numbers, green hover states. Entire brand identity lives here |
| Generative match-driven merch | Each match produces a one-of-one design from real match data. True scarcity, not artificial limited editions | Very High | Score, possession, shots, cards parameterize the design. 3D grid + shaders create visual variations. Post-match finalization |
| Interactive 3D pixel grid logos | Team identity as interactive WebGL art, not static images. The logo IS the experience | High | 32x32 grid of cubes/spheres. Fluid sim behind it. Already prototyped for ARG/FRA |
| Live match data driving visuals | Grid textures update in real-time during matches. Watching the art evolve IS the engagement | High | Football API integration for live stats. WebSocket or polling. Visual mapping of stats to grid parameters |
| Bet-to-discount model (not cash) | Legal simplicity (no gambling license). Always-winning psychology. Merch-first, not gambling-first | Medium | The key innovation. Users feel like they're playing, but always walk away with product. Fanatics does betting-to-merch-credit but requires a gambling license |
| Match-specific collectible prints | Post-match art becomes a limited physical product. Argentina vs France final = grail piece | Medium | Print-on-demand fulfillment of generative designs. Rarity tied to match significance (group stage vs final) |
| Consolation merch for losing bets | Nobody loses everything. Lose your bet, still get something | Low | Store credit, basic tee, or reduced discount. Softens the "loss" and still converts to a sale |

## Anti-Features

Features to explicitly NOT build. These are traps.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Real-money betting / cash payouts | Requires sportsbook licensing in every jurisdiction. Massive legal, compliance, and regulatory burden. Kills the project before it starts | Discount-on-merch model. The "bet" is a commitment to buy at a price determined by match outcome |
| User accounts with profiles/social | Adds complexity without adding commerce value in v1. Social features are a retention play, not a conversion play | Guest checkout via Shopify. Optional email for order tracking. Social can come later if there's traction |
| Chat / community features | Building community tools is a whole product. Distracts from commerce core | Link to Discord/Twitter for community. Don't build it in-house |
| Multi-sport support (v1) | Spreading thin across sports dilutes the World Cup moment. This is an event-driven product | World Cup 2026 only. If it works, template can expand to Olympics, Euro, etc. |
| Custom payment processing | PCI compliance, fraud, chargebacks -- let Shopify handle all of it | Shopify checkout redirect. Zero payment infrastructure to build or maintain |
| NFT/blockchain anything | Adds friction (wallets, gas fees), alienates normies, regulatory gray area. The generative art concept works without blockchain | Generative designs are unique by match data, not by token. Scarcity is real (one match = one design), doesn't need a chain to prove it |
| Native mobile app | Web works fine. App store review adds weeks. Two codebases to maintain | Responsive web. PWA if needed for home screen icon |
| Complex loyalty / points system | Fanatics does this because they're a billion-dollar ecosystem. ten+1 is one event | Simple: bet, get discount, buy merch. No points, no tiers, no FanCash equivalent |
| AI-generated designs | Tempting but undermines the craft. Generative art from match data is algorithmic, not AI slop | Hand-crafted shader/algorithm that takes match parameters as inputs. The art direction is human, the variation is data-driven |
| Inventory management | Holding inventory requires capital, warehousing, and demand forecasting | Print-on-demand only. Zero inventory risk. Infinite SKU variety |

## Feature Dependencies

```
Football API integration → Match browser with odds
Football API integration → Live match data driving visuals
Football API integration → Match result tracking
Match result tracking → Bet outcome resolution
Bet outcome resolution → Discount code generation
Discount code generation → Cart with applied discount

Shopify Storefront API → Product catalog
Shopify Storefront API → Cart and checkout
Shopify Storefront API → Discount code application

48 team pixel logos → Team pages
Team pages → Team-specific merch collections

3D pixel grid (WebGL) → Interactive team logos
3D pixel grid (WebGL) → Generative match designs
Generative match designs → Print-on-demand integration
Print-on-demand integration → Match-specific collectible prints

Bet placement flow → Match result tracking → Outcome resolution → Discount delivery
```

## MVP Recommendation

**Phase 1 -- Core commerce loop (must ship before World Cup starts June 11, 2026):**

1. Match browser with odds (terminal UI) -- the storefront
2. Bet placement flow -- the hook
3. Shopify integration (cart, checkout, products) -- the revenue
4. Team pages with 2-4 teams (expand from prototype ARG/FRA) -- the browse experience
5. Basic outcome resolution (win = 50% off code, lose = 15% off code) -- the payoff

**Phase 2 -- Visual magic (before knockout rounds, ~July 2026):**

6. Interactive 3D pixel grid on team pages
7. Generative match-driven designs (post-match art generation)
8. Print-on-demand integration for match-specific merch
9. Expand to all 48 teams

**Phase 3 -- Live experience (for knockout/finals):**

10. Live match data driving grid visuals in real-time
11. Match-specific collectible prints with rarity tiers
12. Mobile optimization pass

**Defer indefinitely:**
- User accounts / social features
- Multi-sport expansion
- Native apps
- Blockchain/NFT layer

## Sources

- [Sportsbook UX Trends 2026](https://altenar.com/blog/sportsbook-ux-trends-to-watch/)
- [UX in Sports Betting: Gamification](https://gamificationsummit.com/2025/10/01/ux-in-sports-betting-designing-for-speed-simplicity-and-gamification/)
- [Gamification in Sports Betting](https://tgmresearch.com/gamification-in-sports-betting.html)
- [Terminal.shop - Charm.sh](https://charm.land/blog/terminaldotshop/)
- [Shopify Print on Demand Guide](https://www.shopify.com/blog/print-on-demand)
- [Shopify Headless Cart API](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/cart)
- [Fanatics World Cup 2026 Retail](https://www.fanaticsinc.com/press-releases/fanatics-to-exclusively-operate-fifa-world-cup-2026-stadium-and-fan-festival-retail-experiencesnbsp)
- [Fanatics Sportsbook + FanCash](https://www.foxsports.com/stories/betting/sportsbook-promo-bonus)
- [fxhash Generative Art Platform](https://www.fxhash.xyz/)
- [Art Blocks Generative Art NFTs](https://nftevening.com/art-blocks-a-new-approach-to-nfts-with-generative-art/)
- [FIFA 2026 Fan Engagement Hub (Wyng)](https://www.wyng.com/blog/fifa-2026-marketing-ideas/)
- [Polymarket Platform Features](https://interexy.com/how-to-develop-platform-like-polymarket)
