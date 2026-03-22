# Domain Pitfalls

**Domain:** Headless Shopify + Print-on-Demand + Sports Data + Custom Wagering/Discount Commerce
**Project:** ten+1 (World Cup 2026 merch betting platform)
**Researched:** 2026-03-22

---

## Critical Pitfalls

Mistakes that cause legal exposure, rewrites, or project failure.

### Pitfall 1: The Wagering Mechanic Crosses into Illegal Lottery Territory

**What goes wrong:** The "bet on a match, get a discount" mechanic contains all three elements of an illegal lottery: **prize** (discounted merch), **chance** (match outcome), and **consideration** (the purchase). US law (and most jurisdictions) requires you to eliminate at least one element. If users must buy something to participate, and the discount level depends on a chance outcome, regulators can classify this as an illegal lottery or unlicensed gambling.

**Why it happens:** The project explicitly frames itself as "not gambling" because there are no cash payouts. But the legal test is not about cash -- it is about prize + chance + consideration. A merchandise discount IS a prize. A match outcome IS chance. A required purchase IS consideration. New York's Senate Bill S5935 (enacted December 2025) specifically targets platforms using novel mechanics to mimic gambling, and enforcement is expanding beyond operators to platforms and payment partners.

**Consequences:** Cease-and-desist orders, fines, payment processor account termination (Stripe/Shopify Payments will freeze funds if flagged), inability to operate in key states.

**Warning signs:**
- Payment processor asks questions about the "betting" language on your site
- You cannot clearly articulate how this differs from a lottery in one sentence
- Legal counsel hesitates when you describe the mechanic

**Prevention:**
1. **Eliminate consideration:** Offer a "no purchase necessary" path. Users can "wager" without buying anything (e.g., free entry to earn a discount code). This is the sweepstakes model and it is well-established legally.
2. **Reframe as promotional pricing:** The discount is pre-set and guaranteed. The match outcome determines WHICH design you get, not WHETHER you get a discount. Everyone who participates gets 50% off -- winners get the "winner's edition" design, losers get the "heartbreak edition." The match outcome affects the product, not the price.
3. **Get a promotional compliance attorney** before launch, not after. Budget $2K-5K for a review of the mechanic and official rules.
4. **Avoid the word "bet/wager/gamble"** in any customer-facing copy, terms of service, or marketing. Use "predict," "pick," "call it."

**Detection:** Run the three-element test (prize + chance + consideration) against every user flow before shipping. If all three are present, redesign.

**Phase:** Must be resolved in Phase 1 (foundation). The entire business model depends on getting this right. Do not write a single line of discount logic until the legal structure is settled.

---

### Pitfall 2: Shopify Storefront API Cannot Create Dynamic Discounts

**What goes wrong:** The Storefront API can APPLY existing discount codes to carts, but it cannot CREATE discounts programmatically. The ten+1 model requires generating unique, per-user, per-match discounts based on match outcomes. Developers discover mid-build that the Storefront API alone cannot support this, forcing a backend rewrite.

**Why it happens:** Teams assume "headless Shopify" means full API access to all Shopify features. In reality, the Storefront API is a read-heavy, cart-focused API. Discount creation requires the Admin GraphQL API, and custom discount logic requires Shopify Functions (which replaced the deprecated Shopify Scripts as of August 2025).

**Consequences:** Architecture rework. You need a backend server that: (a) listens for match results, (b) calls the Admin API to create discount codes, (c) delivers codes to users. This is not a "headless frontend" anymore -- it is a full backend service.

**Warning signs:**
- Planning to handle discounts "in the frontend"
- No backend server in the architecture
- Assuming Storefront API = full Shopify API

**Prevention:**
1. **Plan for a backend service from day one.** The architecture needs: Custom Backend -> Shopify Admin API (discount creation) + Storefront API (cart/checkout). This is not optional.
2. **Use Shopify Functions** for the custom discount logic (e.g., "50% off product X if discount code matches pattern Y"). Functions run server-side inside Shopify's checkout. Maximum 25 active discount functions per store.
3. **Pre-generate discount codes** in batches per match. When a match concludes, your backend creates codes via `discountCodeBasicCreate` mutation and distributes them. Do not try to create codes in real-time during checkout.
4. **Handle code reuse/abuse:** Discount codes can be shared. Use single-use codes tied to user sessions, or use Shopify's "usage limit" settings.

**Detection:** If the architecture diagram shows the frontend talking directly to Shopify with no backend, the discount mechanic will not work.

**Phase:** Phase 1. The backend service for discount management is foundational infrastructure.

---

### Pitfall 3: Generative Designs Fail Print-on-Demand Quality Requirements

**What goes wrong:** The 3D pixel grid generates beautiful visuals on screen at 1024px (32x32 grid). But print-on-demand requires 300 DPI at print size. A t-shirt print area is typically 12x16 inches, requiring a 3600x4800 pixel image. The screen render is 20x too small. Upscaling produces blurry, pixelated prints that look cheap.

**Why it happens:** Web rendering and print production have fundamentally different resolution requirements. Developers build the generative system for screen display and only discover the resolution gap when the first test prints arrive looking terrible.

**Consequences:** The core value proposition (unique generative merch) looks unprofessional. Customers receive blurry prints and request refunds. The generative pipeline needs to be rebuilt for high-resolution output.

**Warning signs:**
- Design pipeline outputs images under 3000px on any dimension
- No test prints ordered during development
- Using `canvas.toDataURL()` from a screen-sized canvas

**Prevention:**
1. **Render to an offscreen canvas at print resolution** (3600x4800 for t-shirts, higher for posters). The Three.js renderer can target any resolution -- do not couple render size to screen size.
2. **Use vector elements where possible.** The pixel grid aesthetic actually works well as SVG (each "pixel" is a sharp rectangle at any size). Hybrid approach: vector grid + raster textures/effects.
3. **Output PNG with transparency** at 300 DPI. Printful and Printify both accept PNG. Use RGB color profile (POD platforms convert to CMYK internally).
4. **Order test prints in Phase 2.** Budget $50-100 for sample prints across product types. Do not wait until launch.
5. **Build the high-res render pipeline from the start.** Retrofitting resolution is much harder than designing for it.

**Detection:** Export a design file and check its dimensions. If it is under 3000px wide, it will not print well.

**Phase:** Phase 2 (generative design system). But the architecture decision (offscreen high-res rendering) must be made in Phase 1.

---

### Pitfall 4: Print-on-Demand Fulfillment Timing Destroys the Experience

**What goes wrong:** POD fulfillment takes 2-7 business days for production PLUS shipping. The ten+1 concept generates merch AFTER a match ends. If a user "bets" on a group stage match, the design is generated post-match, then sent to POD, then produced, then shipped. Total time: 2-4 weeks. By then the World Cup has moved on and the excitement is gone.

**Why it happens:** POD is designed for steady-state e-commerce, not event-driven spikes. During the World Cup, every match generates a batch of orders simultaneously. POD providers will be slammed with orders from many sellers, not just you.

**Consequences:** Customer complaints, refund requests, negative reviews. The "collectible" framing loses power when the item arrives weeks after the match. During knockout rounds, a customer's quarterfinal merch might arrive after the final.

**Warning signs:**
- No fulfillment timeline listed on the site
- Assuming POD is "next day"
- No communication plan for order status

**Prevention:**
1. **Set expectations aggressively.** "Your one-of-one match print ships 7-14 days after the match." Frame the wait as part of the collectibility -- "crafted after the final whistle."
2. **Pre-generate design templates** before matches. Only the final data-driven parameters (score, stats) get filled in post-match. This cuts design-to-upload time from hours to minutes.
3. **Use Printful's API for automated order submission.** Do not manually upload designs. The pipeline should be: match ends -> design generated -> file uploaded via API -> order created via API. Target < 1 hour from final whistle to order submission.
4. **Consider pre-printing base designs** for popular teams and adding match-specific elements as overlays. This is a hybrid approach between pure POD and inventory.
5. **Have a backup POD provider.** Printful and Printify have different fulfillment networks. If one is backed up, route to the other.

**Detection:** If you cannot describe the end-to-end flow from "match ends" to "order submitted to POD" in under 5 steps, the pipeline is too manual.

**Phase:** Phase 2 (POD integration). The automated pipeline is the core technical challenge.

---

## Moderate Pitfalls

### Pitfall 5: Sports Data API Costs and Reliability During Live Matches

**What goes wrong:** Free/cheap soccer APIs (football-data.org free tier) have low rate limits and no guaranteed uptime. During World Cup matches, you need reliable, fast data updates. The free tier of football-data.org allows 10 requests per minute. With 48 teams and potentially multiple simultaneous matches, this is insufficient.

**Prevention:**
1. **Budget for a paid API tier.** API-Football costs ~$20-80/month for adequate rate limits. Sportmonks and football-data.org have similar tiers. This is not a place to save money.
2. **Cache aggressively.** Match data does not change every second. Poll every 30-60 seconds and cache results. Serve cached data to all users.
3. **Have a fallback.** If the primary API goes down during a match, you need a secondary source or graceful degradation (show "data updating..." rather than errors).
4. **FIFA has granted exclusive betting data rights to Stats Perform** for World Cup 2026. If you need official real-time betting odds, you need Stats Perform. For scores and basic stats, third-party APIs are fine.

**Phase:** Phase 1 (data source selection and integration).

---

### Pitfall 6: Headless Checkout UX Causes Cart Abandonment

**What goes wrong:** The terminal/code-editor aesthetic is the brand differentiator, but checkout is where money changes hands. When users are redirected from a dark terminal UI to Shopify's standard white checkout page, the jarring context switch causes confusion and abandonment. Average cart abandonment is already 70%+.

**Prevention:**
1. **Use Shopify's native checkout** (do not build a custom one). Shopify's checkout loads in 1.1s vs 3.2s for custom. It handles PCI compliance, fraud detection, and payment processing. Building your own is a mistake.
2. **Customize the checkout via Shopify Checkout Extensions** (available on Shopify Plus, $2300/month) or accept the visual break. For an MVP, the visual break is acceptable.
3. **Add a clear "proceeding to secure checkout" transition** so users expect the UI change.
4. **Implement abandoned cart recovery emails** via Shopify's built-in tools. Note: headless stores have known issues with abandoned cart email links routing to Shopify's storefront instead of your custom frontend. Test this flow.

**Phase:** Phase 2 (commerce integration). The checkout redirect UX should be tested early.

---

### Pitfall 7: Discount Code Abuse and Sharing

**What goes wrong:** Users share discount codes on Reddit, Twitter, or deal sites. A code meant for one user who "bet" on a match gets used by thousands. Your margins evaporate.

**Prevention:**
1. **Single-use discount codes.** Every code generated should have `usageLimit: 1` via the Admin API.
2. **Short expiration windows.** Codes expire 48-72 hours after generation.
3. **Tie codes to specific products** (the match-specific merch), not store-wide discounts.
4. **Monitor redemption rates.** If a code is attempted more than once, flag the match for potential sharing.

**Phase:** Phase 2 (discount system implementation).

---

### Pitfall 8: The 48-Team Pixel Logo Library is a Massive Art Asset Undertaking

**What goes wrong:** The prototype has 2 teams (Argentina, France). The full product needs 48. Each requires a hand-crafted 32x32 pixel grid mapping that looks recognizable as the team's crest. This is not code work -- it is pixel art. At 1-3 hours per logo, that is 50-150 hours of design work.

**Prevention:**
1. **Start the pixel art pipeline immediately.** It is the longest-lead creative task.
2. **Consider algorithmic approaches.** Convert SVG logos to 32x32 grids programmatically, then hand-refine. This cuts time by 50-70%.
3. **Prioritize by group stage schedule.** You do not need all 48 on day one. Build the first 16 (opening round matches) first.
4. **Establish a pixel grid data format** early so art can be produced in parallel with engineering.

**Phase:** Phase 1 (starts immediately, continues through Phase 2).

---

## Minor Pitfalls

### Pitfall 9: Shopify API Versioning Breaks Your Integration

**What goes wrong:** Shopify releases new API versions quarterly. As of 2025-01, tax and duty fields were removed from the Storefront API cart object. If you pin to an old version and forget to migrate, your integration breaks when Shopify sunsets it.

**Prevention:**
- Pin to a specific API version but set a calendar reminder to review each quarterly release.
- Use Shopify's API version header explicitly in all requests.
- Subscribe to Shopify's developer changelog.

**Phase:** Ongoing from Phase 1.

---

### Pitfall 10: SEO is Invisible on a Headless SPA

**What goes wrong:** Client-side rendered SPAs are poorly crawled by search engines. Product pages, team pages, and match pages will not rank if rendered entirely in JavaScript.

**Prevention:**
- Use SSR or SSG for all product and content pages.
- Generate sitemaps programmatically.
- Add structured data (Product schema, Event schema) to all relevant pages.
- Note: for a World Cup event product, SEO may be secondary to social/viral marketing. Prioritize accordingly.

**Phase:** Phase 3 (polish/launch).

---

### Pitfall 11: WebGL/Three.js Performance on Mobile

**What goes wrong:** The 3D pixel grid with fluid simulation is GPU-intensive. Mobile devices (where most e-commerce happens -- 60%+ of traffic) may stutter or drain battery. Users leave.

**Prevention:**
- Implement a performance tier system: full 3D on desktop, simplified/static version on mobile.
- Profile on mid-range Android devices, not just iPhone 15 Pro.
- Consider fallback to CSS-animated pixel grids on low-end devices.

**Phase:** Phase 2 (when building production 3D components).

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Legal/business model (Phase 1) | Wagering mechanic classified as illegal lottery | Eliminate consideration (free entry path) or reframe as promotional pricing. Get legal review. |
| Commerce backend (Phase 1) | No backend server planned for discount creation | Architect a backend service from day one. Storefront API alone is insufficient. |
| Data sources (Phase 1) | Free API tier inadequate for live match load | Budget for paid API tier ($20-80/month). Cache aggressively. |
| Generative design (Phase 2) | Screen-resolution renders fail at print DPI | Build offscreen high-res render pipeline (3600x4800px minimum). |
| POD fulfillment (Phase 2) | 2-4 week delivery kills post-match excitement | Automate the entire design-to-order pipeline. Set clear expectations. |
| Discount system (Phase 2) | Codes shared/abused, margins destroyed | Single-use codes, short expiration, product-specific scoping. |
| Pixel art (Phase 1-2) | 48 logos is 50-150 hours of design work | Start early, use algorithmic conversion + hand refinement. Prioritize by schedule. |
| Checkout UX (Phase 2) | Terminal UI to Shopify checkout is jarring | Accept the break for MVP. Add transition messaging. Test abandoned cart flows. |
| 3D performance (Phase 2) | Mobile devices cannot run the fluid sim | Performance tiers. CSS fallback on low-end devices. |
| API versioning (Ongoing) | Shopify deprecates API fields quarterly | Pin version, monitor changelog, set migration reminders. |

---

## Sources

- [7 Costly Mistakes eCommerce Brands Make When Going Headless](https://www.xaicode.com/blog/7-costly-mistakes-ecommerce-brands-make-when-going-headless-and-how-to-avoid-them)
- [Shopify Storefront API - Discount Code Discussion](https://github.com/Shopify/storefront-api-feedback/discussions/22)
- [Using Shopify Functions for Custom Discount Logic](https://www.rootsyntax.com/blogs/news/using-shopify-s-functions-api-for-custom-discount-logic-2025-examples)
- [Shopify Discount Function API](https://shopify.dev/docs/api/functions/latest/discount)
- [Shopify About Discounts](https://shopify.dev/docs/apps/build/discounts)
- [Abandoned Cart Flow with Headless Store Issues](https://community.shopify.com/c/technical-q-a/abandoned-cart-flow-with-headless-store-issues/m-p/2291595)
- [Sweepstakes 101: Prize, Chance & Consideration](https://ussweeps.com/about-us/blog/sweepstakes-law/sweepstakes-101/)
- [No Purchase Necessary Laws and Your Sweepstakes](https://www.rtm.com/blog/no-purchase-necessary-laws-and-your-sweepstakes)
- [NY Senate Bill S5935 - Gambling Classification](https://is-this-legal.com/is-polymarket-legal-in-new-york/)
- [Legal Developments in Gaming Industry H2 2025](https://www.wilmerhale.com/en/insights/client-alerts/20260205-legal-developments-in-the-gaming-industry-second-half-of-2025)
- [FIFA Stats Perform Exclusive Betting Data Rights](https://inside.fifa.com/media-releases/stats-perform-official-worldwide-betting-data-streaming-rights-distributor-world-cup)
- [Printful File Preparation Guide](https://www.printful.com/blog/everything-you-need-to-know-to-prepare-the-perfect-printfile)
- [Printful API Documentation](https://developers.printful.com/docs/)
- [Printify File Requirements](https://help.printify.com/hc/en-us/articles/4483617936657-What-type-of-print-files-does-Printify-require)
- [Shopify Headless Checkout Best Practices](https://endertech.com/blog/best-practices-to-customize-shopify-checkout-process-in-headless-mode)
