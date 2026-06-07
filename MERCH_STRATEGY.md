# iFC Merch Strategy & Voice Guide
**Internet Soccer Club — internetfc.com — World Cup 2026**
_Research + writing deliverable. No code, Printify, or Shopify changes were made. Date: 2026-06-03._

---

## 0. TL;DR (decision-ready)

1. **Voice:** Stop sounding like a spec sheet. iFC is internet-native football culture + generative data-art. Every description should sell the *idea* (a crest born from a real match) before the garment. Templates in §2.
2. **Collections:** 48 country smart-collections (tag-driven, auto-aggregating) + ~6 motif smart-collections + a few merch-type collections. ~57 collections total. Clean, no manual curation. §3.
3. **Multi-motif:** Motifs are **separate products** grouped by **collections and tags (`motif:3d`)**, *not* Shopify variants and *not* a combinatorial product-per-motif-per-type explosion you manage by hand. Title/handle convention disambiguates. §4.
4. **THE BIG ONE:** For **World Cup 2026 (finite, 48 teams)** — keep a **curated bulk catalog**, but cap it hard (don't pre-build all 8,000). For the **future generative/per-match vision** — you *must* move to **mockup-on-demand**: render mockup images for the catalog, and only create the real Printify product at order time via webhook. Pre-creating per-match SKUs is mathematically impossible. Full architecture in §5.

---

## 1. Competitor Voice Analysis

I looked at how premium and culture-led football retailers actually write. Five distinct registers emerged. iFC should steal from the **culture/heritage** end and reject the **POD-boilerplate** end.

### 1.1 What the leaders sound like

**Nike Football (federation kits)** — myth-making, identity-forward, almost no fabric talk up top:
- > "A unified approach guides Nike's 2026 federation collections, which offer a deep exploration of each federation's heritage, culture and identity — bringing forward a striking sense of optimism and future-facing inspiration."
- > "Home kits are anchored in each federation's DNA, while away kits are designed as future classics."
- > "These players carry a nation on their backs, and their kits travel with football culture far beyond the pitch."
- Note the device: **the flag/identity rendered as a system** ("distorted stripes and gradient effects reference the flag in motion," "a bespoke grid-star knit pattern"). This is *exactly* iFC's pixel-grid story — Nike literally sells "the flag in motion as a pattern." iFC sells "the match in motion as a crest."

**U.S. Soccer / federation stores** — the crest as a shared emotional object:
- > "A national team jersey represents the pride of wearing the crest, not just for players on the field, but also for the fans who support them every step of the way."
- > "By wearing the crest, supporters across the country can stand behind the teams."
- Device: **"wearing the crest" = belonging.** iFC's entire product *is* a crest. Lean in hard.

**Classic Football Shirts** — heritage, authentication, obsessive specificity, "by fans, for fans":
- > "Founded by fans, for fans."
- > "Since 2006, football shirts have been our obsession."
- > "the deepest archive of retro World Cup classics anywhere online, with every shirt expertly authenticated."
- Device: **provenance and obsession.** Every shirt has a story, a year, a sponsor. iFC's equivalent: every crest has a *match* — a date, a scoreline, a set of stats that generated it.

**KITH × adidas Football** — streetwear elevation; sport vocabulary as fashion:
- > "redefines the intersection of sport and lifestyle… taking football aesthetics and elevating them with streetwear sophistication."
- Device: **football as wearable culture, not just match-day gear.** iFC tees should read like a drop, not a souvenir.

**COPA90** — the fan/internet voice; "reclaiming the game"; memes + reverence:
- "the home of global football culture," built to "tell the stories outside of the 90 minutes," content that "spans football and culture, memes and video games… mostly funny snippets… packaged in absurd graphics and intriguing headlines."
- Device: **irreverent, terminally-online, but in love with the game.** This is iFC's native tone. iFC is more COPA90 than Nike.

### 1.2 SEO / naming patterns observed
- **Region split.** US retailers (soccer.com, Fanatics, U.S. Soccer) say **"jersey"** and **"soccer."** UK/heritage sites (Classic Football Shirts, Cult Kits, Vintage Football Shirts) say **"shirt"** and **"football."** "Kit" is universal for the full strip.
- For pure apparel that *isn't* a replica jersey (a graphic tee, a hoodie), everyone uses **"tee," "t-shirt," "hoodie," "crewneck"** — *not* "jersey." Calling a graphic tee a "jersey" hurts trust and search intent.
- Collections are named by **{Nation} + category** ("USA Soccer Jersey," "National Team Jerseys") or **{Collab} + season** ("Kith for adidas Football Spring 2025").
- **iFC SEO takeaway:** Because the US is the host market and the audience is global-but-online, **dual-key your copy: "tee/t-shirt" for the garment + "soccer"/"football"/"World Cup 2026"/"{nation}" for discovery.** Use "jersey/shirt/kit" *metaphorically* in body copy for emotional resonance, but the product noun stays accurate (tee, hoodie, mug).

**Sources:** Nike Newsroom (about.nike.com, 2026 federation kits); U.S. Soccer store & stories (ussoccer.com); Classic Football Shirts (classicfootballshirts.com); KITH (kith.com / SoccerBible); COPA90 (Digiday, Urban Pitch, grokipedia). Full URLs in §7.

---

## 2. iFC Voice Guide + Description Templates

### 2.1 The iFC voice in one paragraph
iFC is what happens when football culture grows up online. We don't print souvenirs — we **render** them. Every iFC crest lives on a 45×45 pixel grid, and in the full system each one is *generated from a real match*: the goals, the cards, the xG, the tempo, all of it pushed through code until the badge looks like the game felt. The voice is **terminally-online but reverent**: confident, a little playful, never corporate, never "official partner" PR-speak. Short punchy lines. Specific, not generic. We talk to people who love the game *and* love a good system.

### 2.2 Rules
- **Lead with the idea, not the blank.** First sentence sells the generative crest; later sentences cover fit/use.
- **Be specific.** Pixels, grids, match data, scorelines. Never "high-quality premium apparel."
- **Right noun.** A tee is a tee. Use "jersey/kit/shirt" only as a wink in body copy.
- **No inherited Printify boilerplate.** Kill "This product is made just for you as soon as you place an order."
- **One human detail per product** (the feel, the weight, the way the grid reads at arm's length).
- **Placeholders:** `{team}`, `{code}` (3-letter), `{motif}` (default / 3D / spectrum / pattern / lines / nets), `{motif_line}` (a one-liner per motif, table below).

### 2.3 Motif one-liners (`{motif_line}`)
| motif | `{motif_line}` |
|---|---|
| default (black/white) | rendered in clean iFC black-on-white — the original grid, no noise |
| 3D | built from stacked color cubes so the badge reads with real depth |
| spectrum | flooded with a full-spectrum gradient mapped across the grid |
| pattern | tiled into a repeating pattern pulled from the crest's own geometry |
| lines | redrawn as pure linework — the crest reduced to its skeleton |
| nets | woven into a goal-net mesh that catches light across the pixels |

### 2.4 Templates

**TEE / T-SHIRT**
> **{team} Pixel Crest Tee — iFC World Cup 2026**
> The {team} crest, {motif_line}, dropped onto a 45×45 grid. In the full iFC system every crest is generated from a real match — the scoreline, the chaos, the late winner — so the badge you wear is the game, rendered. Soft mid-weight cotton tee, true-to-size, prints crisp enough that the grid actually reads from across the room. Football for people who live online. Printed to order, shipped worldwide. _{code} · {motif}_

**HOODIE**
> **{team} Pixel Crest Hoodie — iFC World Cup 2026**
> {team}, {motif_line}. The iFC crest isn't a logo we drew once — in the full system it's generated from match data, so the grid shifts with the game it came from. Heavyweight fleece hoodie with a soft brushed inside, roomy hood, ribbed cuffs that hold. Wear your nation like a kit you'd never get on the pitch. Made to order. _{code} · {motif}_

**CREWNECK**
> **{team} Pixel Crest Crewneck — iFC World Cup 2026**
> The {team} badge, {motif_line}, sitting clean on the chest. Same generative crest, no hood — just heavyweight cotton-blend fleece and a ribbed crew collar that keeps its shape. Terrace-ready, group-chat-approved. Printed on demand for World Cup 2026. _{code} · {motif}_

**TANK**
> **{team} Pixel Crest Tank — iFC World Cup 2026**
> {team} on the grid, {motif_line}. Built for July heat and 90 minutes of standing. Lightweight, breathable, the crest rendered big and bold across the front. The match, worn loud. Made to order. _{code} · {motif}_

**CROP TOP**
> **{team} Pixel Crest Crop — iFC World Cup 2026**
> The {team} crest, {motif_line}, cropped and clean. Soft stretch cotton, fitted, the grid reading sharp across the front. Match-day fit, off-pitch energy. Printed to order for the 2026 World Cup. _{code} · {motif}_

**CAP**
> **{team} Pixel Crest Cap — iFC World Cup 2026**
> {team} stitched-look crest on the grid, {motif_line}, sitting front and center. Structured six-panel, curved brim, adjustable back. The smallest way to fly your flag — and the crest still reads at 45×45. Made to order. _{code} · {motif}_

**MUG**
> **{team} Pixel Crest Mug — iFC World Cup 2026**
> Your {team} crest, {motif_line}, wrapped around 11oz of ceramic. The same generative badge that lives across the iFC line — match-day in your hands at 7am. Dishwasher- and microwave-safe. Printed to order. _{code} · {motif}_

**PHONE CASE**
> **{team} Pixel Crest Case — iFC World Cup 2026**
> {team} on the grid, {motif_line}, snapped to your phone. The crest that's generated from the match, now the thing you check 200 times a day. Slim, impact-resistant, precise cutouts. Made to order. _{code} · {motif}_

**WALL ART / POSTER**
> **{team} Pixel Crest Print — iFC World Cup 2026**
> The {team} crest, {motif_line}, blown up so every cell on the 45×45 grid lands. In the full iFC system this badge is generated from a single match — frame the game, not just the team. Museum-grade matte paper, giclée-sharp. Printed to order, shipped flat or rolled. _{code} · {motif}_

**TOTE**
> **{team} Pixel Crest Tote — iFC World Cup 2026**
> {team} on the grid, {motif_line}, carried. Heavyweight natural canvas, long handles, the crest printed big. Match-day shop run to airport gate. Made to order. _{code} · {motif}_

### 2.5 Before / After (one example)

**BEFORE (current, generic):**
> Official iFC World Cup 2026 hoodie, Brazil edition. Crest rendered on the iFC 45×45 pixel grid. Printed on demand.

**AFTER (iFC voice):**
> **Brazil Pixel Crest Hoodie — iFC World Cup 2026**
> Brazil, rendered in clean iFC black-on-white — the original grid, no noise. The iFC crest isn't a logo we drew once — in the full system it's generated from match data, so the grid shifts with the game it came from. Heavyweight fleece, brushed inside, ribbed cuffs that hold. Wear your nation like a kit you'd never get on the pitch. Made to order. _BRA · default_

Same facts. One reads like a parts bin; one reads like a brand people screenshot.

---

## 3. Shopify Per-Country Collections Plan

**Goal:** every nation has its own collection, zero manual curation, products self-file by tag. Products are already tagged with team slug + 3-letter code — perfect for **smart (automated) collections**.

### 3.1 The 48 country collections
- **Type:** Smart collection.
- **Rule:** `Product tag is equal to {code}` (e.g. `BRA`). Single-condition, "all conditions." Use the 3-letter code as the canonical key (shorter, collision-free vs. slugs like "korea-republic").
- **Title:** `{Team} — iFC World Cup 2026` (e.g. `Brazil — iFC World Cup 2026`).
- **Handle:** `{team-slug}` (e.g. `brazil`) → `internetfc.com/collections/brazil`. Clean, memorable, shareable, SEO-friendly.
- **SEO title / meta:** `{Team} Soccer Tees, Hoodies & Gear — iFC World Cup 2026` — front-loads nation + garment nouns + "soccer"/"World Cup" for search intent.
- **Sort:** Manual featured first (push hero tee/hoodie), then best-selling.

### 3.2 Motif collections (≈6)
- **Type:** Smart collection.
- **Rule:** `Product tag is equal to motif:{motif}` (e.g. `motif:3d`).
- **Titles/handles:** `3D Cube Crests` → `/collections/3d`, `Spectrum Crests` → `/collections/spectrum`, `Pattern`, `Lines`, `Nets`, and `Originals` (the default black/white) → `/collections/originals`.
- Purpose: let a buyer browse *aesthetic-first* ("show me everything in 3D") across all nations.

### 3.3 Merch-type collections (optional, ~5–10)
- Smart collections on Shopify **product type** (`Tee`, `Hoodie`, `Mug`, `Wall Art`, …). Cheap to add, helps "all tees" browsing and SEO. Add only the high-traffic ones.

### 3.4 Coexistence
The three families are **orthogonal tag axes** — a product simply carries all of them:
`tags: BRA, brazil, motif:3d, type:hoodie` → it auto-appears in **Brazil**, **3D Cube Crests**, and **Hoodies** collections simultaneously. No product lives in a manual list; nothing breaks when you add SKUs.

### 3.5 Count
- 48 country + 6 motif + ~6 type ≈ **~60 collections**, all rule-based. Shopify has no meaningful cap here and smart collections cost zero maintenance.

### 3.6 Tagging discipline (the load-bearing rule)
Every product **must** be created with: `{CODE}`, `{team-slug}`, `motif:{motif}`, `type:{type}`. This is the single source of truth that makes the whole collection system automatic. Enforce it in whatever script creates products — a missing tag = an invisible product.

---

## 4. Multi-Motif Product Architecture

The user wants 6 parallel motif worlds per team. Naive math: 48 × 28 × 6 ≈ **8,064 products**. The danger is *confusion*, not just count. Here's how to model it cleanly.

### 4.1 Decision: motifs are SEPARATE PRODUCTS, grouped by tags/collections — NOT Shopify variants
**Why not variants?**
- Shopify allows max **3 options** per product and (since Oct 2025) up to 2,048 variants. You technically *could* make "Motif" an option alongside Size and Color. **Don't.**
- Each motif needs **its own artwork file and its own mockup images** in Printify. Shopify variants share one media pool and one Printify blueprint mapping; Printify's Shopify sync models each *design* as a product, not a variant dimension. Forcing motif into a variant fights the POD pipeline and muddies per-motif imagery.
- Motifs are a **browsing/identity axis** (people want "Brazil in 3D" as a thing), which is a *collection* job, not a buried dropdown.

**Why not a flat 8,064-product free-for-all?** That's the bloat trap — see §5. The answer is: separate products, yes, but **don't pre-build all six motifs for all teams. Build motifs on demand / on validation.**

### 4.2 Within a single product, what ARE the variants?
Size (and Color where the blank supports it). That's the natural variant axis and what Printify expects. So one product = one {team}×{motif}×{type}, with size/color variants inside it.

### 4.3 Naming & handle convention (disambiguation)
- **Default motif (black/white):** no motif token — it's the canonical product.
 - Title: `Brazil Pixel Crest Hoodie — iFC World Cup 2026`
 - Handle: `bra-hoodie` (or `brazil-hoodie`)
- **Non-default motifs:** motif token in title and handle.
 - Title: `Brazil 3D Pixel Crest Hoodie — iFC World Cup 2026`
 - Handle: `bra-hoodie-3d`
- **Handle pattern:** `{code}-{type}[-{motif}]` → predictable, scriptable, never collides, and `motif` omitted = default. This also makes on-demand creation (§5) trivially deterministic: given a desired SKU you can compute its handle.

### 4.4 Tagging (the real grouping mechanism)
Every product carries: `{CODE}`, `{team-slug}`, `motif:{motif}`, `type:{type}`. The default product gets `motif:original`. This drives all collections in §3 with no manual work.

### 4.5 Rollout to avoid combinatorial chaos
- **Phase 1 (now):** ship **default motif only** for all 48 teams × core types. That's the current ~1,344 and it's the right scope to *launch*.
- **Phase 2:** add motifs **for demand-proven teams only** (the 8–12 nations that actually sell), or add **one motif at a time** across all teams (e.g. ship "3D" globally as a hyped drop). Treat each motif as a *collection launch*, not a silent SKU dump.
- **Phase 3:** anything beyond curated motifs → **on-demand** (§5).

---

## 5. THE BIG STRATEGIC RECOMMENDATION

**Question:** Keep bulk-creating real Printify products (today ~1,344, heading to ~8,000+ across 6 motifs), or move to **mockup-on-demand** (catalog = mockup images only; create the real Printify product only when an order arrives, then fulfill)?

**Answer:**
- **NOW (World Cup 2026, finite 48 teams):** Keep **real products**, but **curated and capped** — do *not* pre-build all 8,000. Default motif fully built; extra motifs only where validated.
- **FUTURE (generative / per-match crests):** **Mockup-on-demand is mandatory.** It is the only model that survives a near-infinite, per-match SKU space. Start building this pipeline now, behind the WC2026 catalog.

### 5.1 Why pre-creating everything breaks in the generative future
The vision is: *every crest is unique to a specific match* — colors, symbols, motion driven by that match's stats. A single World Cup is 104 matches in 2026; a full season of generative crests across competitions is thousands of matches × 48+ teams × 28 product types × 6 motifs. That's **hundreds of thousands to millions of theoretical SKUs**. You cannot pre-create them:
- **Catalog bloat:** an admin with hundreds of thousands of dead products is unsearchable, unmaintainable, and slow. (Shopify performance degrades well before its soft ceiling around ~50k products on Basic; you'd blow past that with one season of match-crests.)
- **Printify rate limits make bulk creation slow:** global **600 req/min**, **catalog 100 req/min per integration**, and **product publishing capped at 200 requests / 30 min**. At ~200 publishes per half-hour, publishing *just* 8,000 products is ~20 hours of pure publish calls, not counting create/upload/sync. Hundreds of thousands is structurally impossible to keep fresh.
- **Maintenance:** every blank price change, provider swap, or mockup refresh becomes an N-product migration. N must stay small.
- **The crests don't exist yet:** per-match crests are generated *after* the match. You literally cannot pre-build a product for a match that hasn't been played.

So the generative vision and bulk pre-creation are **incompatible by definition.** On-demand isn't an optimization — it's the only thing that works.

### 5.2 The tradeoffs, honestly

| Factor | Bulk real products | Mockup-on-demand |
|---|---|---|
| **Catalog bloat** | Severe at scale | None — catalog = lightweight mockups/metadata |
| **Printify rate limits** | Bottleneck on creation & every refresh | One create call *per actual order* — trivial volume |
| **Shopify product cap** | Hits practical limits (~50k Basic) fast in generative future | Stays tiny (only what you choose to surface) |
| **Maintenance** | O(N) for every change | O(catalog-you-chose) — small |
| **SEO / discoverability** | Real product/collection pages rank well | **Weakest point** — see §5.4 |
| **Conversion** | Proven, instant add-to-cart | Slightly higher risk if "create" feels slow; mitigated by pre-rendered mockups |
| **Fulfillment latency** | Same as normal POD | +seconds at order time (create product + submit order); production/shipping unchanged |
| **Risk** | Wasted SKUs, slow ops | Order-time API failure must be handled (queue + retry) |

### 5.3 How on-demand creation actually works (Printify API at order time)
The flow when a customer orders an SKU that isn't yet a real Printify product:

1. **Catalog:** Shopify (or a custom storefront on internetfc.com) lists a **mockup-only listing** — a product page backed by a pre-rendered mockup image and metadata (team, motif, type, match id). The artwork may not exist as a Printify product yet.
2. **Order placed →** Shopify `orders/create` webhook (or your storefront's checkout) fires to your service.
3. **Your service:**
 a. Resolves the SKU → `{team, motif, type, match_id}`.
 b. **Generates/locates the print-ready artwork** (the generative crest PNG for that match+motif), uploads via Printify **uploads** endpoint.
 c. **Creates the product** against the right blueprint + print provider + variant (`POST /v1/shops/{shop_id}/products`), respecting limits (600/min global, publishing 200/30min — fine for per-order volume).
 d. **Submits the order** to Printify (`POST .../orders`) with the customer's address and the chosen variant.
4. **Webhooks** (`order_created`, `order_shipped`, `order_failed`) sync status + tracking back to Shopify/customer.
5. **Optional cache/promotion:** if an SKU sells more than _k_ times, **promote** it to a permanent real product so it gets a durable, indexable page.

### 5.4 The one real weakness of on-demand: SEO/discoverability — and the fix
A pure on-demand catalog can be invisible to search (no durable product pages, thin content). Fixes:
- Keep **durable real product+collection pages for the finite, high-value set** (the 48 nations × core types × curated motifs). These carry SEO.
- Render **per-match crests as on-demand**, but give each *match* a durable, indexable **editorial/landing page** ("Brazil 2–1 Argentina — the crest of this match") that links to the on-demand buy. You index *matches and teams* (finite, evergreen), not the infinite SKU grid.
- Pre-generate mockup images at high quality so listings look real and convert.

### 5.5 RECOMMENDATION

**(a) NOW — World Cup 2026 (finite 48 teams):**
- Keep **real Printify products** for the **default motif across all 48 teams × core types** (your current ~1,344). This is the right launch catalog: durable pages, full SEO, instant conversion, manageable maintenance.
- Add extra motifs **selectively** (validated teams, or one-motif-at-a-time hyped drops) — **do not pre-build all ~8,000.**
- **Build the on-demand pipeline now in parallel** (steps in §5.3) and use it to back any motif/team beyond the curated core. The World Cup is your low-risk proving ground for the order-time create→fulfill loop.

**(b) FUTURE — generative / per-match system:**
- **Mockup-on-demand becomes the default model.** Catalog = generative mockups + match metadata; real Printify products are created at order time only. Per-match crests are *only ever* on-demand.
- **Hybrid permanence:** auto-promote any SKU with repeat sales into a durable real product for SEO/conversion. Best of both: tiny live catalog, infinite addressable space, durable pages for the winners.

### 5.6 Proposed architecture for the on-demand generative pipeline

```
 ┌──────────────────────────────────────────────────────────────┐
 │ MATCH DATA SOURCE (xG, goals, cards, tempo, lineups, etc.) │
 └───────────────┬──────────────────────────────────────────────┘
 │ match event / final whistle
 ▼
 ┌─────────────────────────────┐
 │ CREST GENERATOR (the sauce) │ → renders {team×motif×match} crest
 │ params → 45×45 grid art │ outputs: print PNG + mockup PNG
 └───────────┬─────────────────┘
 │ store artifacts + metadata
 ▼
 ┌─────────────────────────────┐ ┌───────────────────────────┐
 │ CATALOG / METADATA STORE │◄──────┤ MOCKUP RENDERER │
 │ sku = {code,motif,type,match}│ │ (garment mockups for PDP) │
 └───────────┬─────────────────┘ └───────────────────────────┘
 │ surfaces listings
 ▼
 ┌─────────────────────────────┐
 │ STOREFRONT (internetfc.com) │ mockup-only PDPs + match landing pages
 │ + Shopify for durable SKUs │ (SEO: teams + matches, not infinite grid)
 └───────────┬─────────────────┘
 │ order placed → webhook
 ▼
 ┌─────────────────────────────┐ idempotent, queued, retried
 │ ON-DEMAND FULFILLMENT SVC │ 1. resolve sku→{team,motif,type,match}
 │ (your service / worker) │ 2. upload art → Printify
 │ │ 3. create product (blueprint+provider)
 │ │ 4. submit order
 │ │ 5. handle order_* webhooks → tracking
 │ │ 6. if sales ≥ k → promote to durable SKU
 └───────────┬─────────────────┘
 │
 ▼
 PRINTIFY (print + ship) ──► customer
```

**Engineering guardrails:**
- **Idempotency keys** on order-time create+submit (don't double-create on webhook retries).
- **Job queue + retry** so a transient Printify 429/5xx never loses an order; surface "processing" to the customer, not an error.
- **Pre-warm** popular {team×motif×type} blueprint mappings so order-time work is just art upload + create + submit.
- **Respect limits:** per-order volume is far under 600/min and 200-publishes/30min, but batch promotions and any bulk refresh must be throttled.
- **Promotion threshold (k):** start k=3–5 repeat sales → promote to durable Shopify/Printify product with a real indexable page.

---

## 6. Suggested next steps (not executed)
1. Rewrite the 48 default-motif product type descriptions using §2 templates (script the `{team}/{motif}` fill).
2. Create the ~60 smart collections in §3 (all rule-based; one-time setup).
3. Enforce the 4-tag discipline (`CODE`, `slug`, `motif:*`, `type:*`) in the product-creation script.
4. Stand up the on-demand fulfillment service (§5.6) and dogfood it on a single non-core motif during WC2026.

---

## 7. Sources
- Nike Newsroom — 2026 federation kits: https://about.nike.com/en/newsroom/collections/nike-football-unveils-2026-federation-kits-featuring-aero-fit-performance-cooling-technology
- Nike Newsroom — 2022 national team collections: https://about.nike.com/en/newsroom/releases/introducing-nike-s-2022-men-s-national-team-collections
- U.S. Soccer — 2026 kits & "Heartbeat" fan kit: https://www.ussoccer.com/stories/2026/03/nike-unveils-new-national-team-stars-stripes-jerseys-kits-fifa-world-cup ; https://www.ussoccer.com/stories/2025/05/us-soccer-unveils-2025-national-team-kits-fusion-heritage-fashion-uswnt-usmnt
- U.S. Soccer store (jersey naming): https://store.ussoccer.com/collections/jerseys
- soccer.com fan / US national team: https://www.soccer.com/shop/fan ; https://www.soccer.com/shop/fan/teams/us-national-team
- Classic Football Shirts ("by fans, for fans," authentication, heritage): https://www.classicfootballshirts.com/
- KITH × adidas Football SS25 (streetwear elevation): https://kith.com/collections/kith-for-adidas-football-spring-2025 ; https://kith.com/blogs/discover/a-closer-look-at-kith-for-adidas-football-spring-2025
- COPA90 voice (fan-first, internet-native): https://digiday.com/media/day-life-social-voice-copa90-communicates-10-million-football-fans/ ; https://urbanpitch.com/copa90s-search-for-the-next-great-football-storytellers/
- Printify API (rate limits, webhooks, product/order endpoints): https://developers.printify.com/
- Shopify limits 2026 (2,048 variants since Oct 2025, 3 options, ~50k product practical ceiling): https://craftshift.com/shopify-limits-2026-complete-guide/ ; https://www.getverveai.com/blog/shopify-variant-limit
