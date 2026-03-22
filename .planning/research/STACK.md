# Technology Stack

**Project:** ten+1 (World Cup 2026 merch betting platform)
**Researched:** 2026-03-22

## Decision: Skip Hydrogen, Go Vite + React SPA

Hydrogen is Shopify's official headless framework, but it is wrong for this project. Hydrogen is built on React Router with SSR via Oxygen (Shopify's edge runtime). ten+1 needs:

1. A terminal/code-editor aesthetic with heavy WebGL (fluid sim, 3D pixel grid) -- SSR adds complexity with zero benefit for WebGL-heavy pages
2. Custom shader rendering and Three.js scenes that are purely client-side
3. Minimal infrastructure -- deploy to any CDN, no server runtime needed
4. Full creative control over the DOM -- Hydrogen's commerce primitives (cart components, analytics hooks) would constrain the terminal UI

The Storefront API is framework-agnostic. Use `@shopify/storefront-api-client` to talk to Shopify directly from a Vite + React SPA. Checkout redirects to Shopify's hosted checkout (PCI-compliant, zero payment handling on our side).

**Confidence: HIGH** -- Shopify explicitly documents and supports this path. The JS Buy SDK is deprecated (Jan 2025); Storefront API Client is the recommended replacement.

---

## Recommended Stack

### Build & Dev

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vite | ^6.x | Build tool & dev server | Instant HMR, zero-config React+TS, produces static dist/ folder. No SSR complexity. The prototype is vanilla HTML -- Vite is the smallest step up that gives module bundling, env vars, and dev tooling. |
| React | ^19.x | UI framework | Already in the prototype (via CDN/Babel). Moving to proper JSX compilation. React 19 is stable as of Dec 2024. |
| TypeScript | ^5.7 | Type safety | Shopify's GraphQL schema + complex state (cart, bets, match data) benefit enormously from types. Catches integration bugs early. |

**Confidence: HIGH** -- Vite + React is the most common SPA stack in 2025/2026. Well-documented, massive ecosystem.

### Commerce (Shopify)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @shopify/storefront-api-client | ^1.0.10 | Shopify API client | Official lightweight client for headless storefronts without Hydrogen. Manages auth, provides typed GraphQL methods. Active maintenance (last publish: ~March 2026). |
| Shopify Storefront API | 2026-01 | Product/cart/checkout data | GraphQL API for products, collections, cart mutations, checkout URLs. REST API is being deprecated -- GraphQL only going forward. |
| Shopify hosted checkout | -- | Payment processing | Cart API returns `checkoutUrl` -- redirect user there. PCI compliant, handles payments, shipping, taxes. No payment code on our side. |

**Checkout flow:** User adds items to cart via Storefront API `cartCreate`/`cartLinesAdd` mutations -> cart state managed client-side -> "Checkout" redirects to `cart.checkoutUrl` on Shopify's hosted checkout -> Shopify handles payment -> webhook notifies our backend of completed order.

**Confidence: HIGH** -- This is Shopify's documented headless pattern. JS Buy SDK deprecated Jan 2025; `@shopify/storefront-api-client` is the official replacement.

### Print-on-Demand

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Printful API v2 | 2.0 (beta) | Merch fulfillment + mockup generation | Largest POD catalog (apparel, accessories, home). Free signup, no monthly fees. Shopify integration handles order routing automatically. API v2 adds multi-layer design support -- critical for generative merch. |
| Printful Shopify integration | -- | Order routing | Printful's Shopify app auto-fulfills orders. When Shopify receives a paid order, Printful produces and ships it. Zero manual intervention. |

**Generative merch pipeline:** Match ends -> our server generates design image from match data (score, events, stats) -> Printful API `POST /v2/mockup-tasks` creates mockup -> design uploaded to Printful product template -> Shopify product created/updated via Admin API -> available for purchase.

**Why Printful over Printify/Gooten:** Printful has the most mature API (v2 with multi-layer design support), best mockup generation API, and highest print quality reputation. Printify has more print providers but less API sophistication for programmatic design uploads.

**Confidence: MEDIUM** -- Printful API v2 is still in beta. The generative design upload pipeline needs validation during implementation. Fallback: Printful API v1 is stable and production-proven.

### Soccer Data

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| API-Football (via RapidAPI) | v3 | Match data, live scores, stats | Covers World Cup 2026 explicitly. Free tier includes all endpoints (limited seasons). Live score updates every 15 seconds. 100 requests/day on free tier -- sufficient for development, $10/mo for 7,500 req/day in production. |
| football-data.org | v4 | Fallback / supplementary | Free forever for top competitions. Simpler API, less data depth. Good fallback if API-Football has issues. |

**Why API-Football over football-data.org as primary:** API-Football provides richer match statistics (possession, shots, cards, key events per minute) which feed directly into the generative merch engine. football-data.org is simpler but lacks the granular event data needed to parameterize unique designs.

**Why not Sportmonks:** More expensive, overkill data depth. API-Football's free tier is generous enough for MVP.

**Confidence: MEDIUM** -- World Cup 2026 is June-July 2026. APIs claim coverage but actual live data availability needs verification closer to tournament start. football-data.org as fallback mitigates risk.

### 3D / WebGL

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Three.js | ^0.183.x (r183) | 3D rendering engine | Already in the prototype (r128). Upgrade to current r183. Handles the 32x32 pixel grid, fluid simulation, and generative visuals. Use vanilla Three.js, NOT React Three Fiber. |
| Custom GLSL shaders | -- | Fluid sim + generative visuals | The prototype already has custom fragment/vertex shaders. Keep writing raw GLSL -- R3F's declarative model adds overhead for custom shader work with no benefit. |

**Why vanilla Three.js over React Three Fiber:** The 3D scenes in ten+1 are bespoke -- custom fluid simulation, 32x32 cube grid with flip animations, generative textures from match data. R3F's declarative component model is great for composing scenes from standard geometries but adds indirection for custom shader-heavy work. The prototype already works in vanilla Three.js. Keep it.

**Why upgrade from r128 to r183:** r128 is from 2021. Since then: WebGPU renderer (r171+), improved shader compilation, better memory management, new post-processing. r183 is current (March 2026). The upgrade path is straightforward for ShaderMaterial/RawShaderMaterial usage.

**Confidence: HIGH** -- Three.js r183 is the current stable release. Vanilla Three.js for custom shader work is the standard approach.

### Styling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| CSS Modules (via Vite) | -- | Component-scoped styles | The terminal aesthetic is CSS-heavy (Geist Mono, line numbers, monospace grid). CSS Modules give scoping without a runtime CSS-in-JS library. Zero bundle overhead. Vite supports them natively. |
| CSS custom properties | -- | Design tokens | Already in the prototype (--bg, --white, --green, etc). Keep this pattern. |

**Why not Tailwind:** The terminal UI is highly custom with specific typographic choices (Geist Mono at 14px, 1.85 line-height, exact color values). Tailwind's utility classes would fight this aesthetic rather than help it. The prototype's CSS is clean and intentional -- CSS Modules preserve that approach with scoping.

**Why not styled-components/emotion:** Runtime CSS-in-JS adds bundle weight and hydration complexity. The terminal aesthetic doesn't need dynamic theming -- it's one look, always dark.

**Confidence: HIGH** -- CSS Modules is the simplest path that adds scoping to the existing CSS approach.

### State Management

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Zustand | ^5.x | Client state (cart, bets, UI) | Lightweight (~1KB), no boilerplate, works outside React components (important for Three.js scenes that need to read state). Perfect for cart state, bet slip, match selections. |

**Why not Redux:** Overkill for this app's state complexity. Cart + bet slip + UI state = ~5 stores max. Redux's action/reducer ceremony is unnecessary.

**Why not React Context alone:** Context causes re-renders on every state change. The Three.js scenes need to read state without triggering React re-renders. Zustand's `getState()` and selectors solve this cleanly.

**Confidence: HIGH** -- Zustand is the dominant lightweight state library in 2025/2026 React ecosystem.

### Backend (Minimal)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Cloudflare Workers | -- | Serverless functions | API key proxying (hide Shopify/Printful/API-Football keys from client), webhook handlers (Shopify order completed -> trigger generative design), scheduled tasks (poll match data). Free tier: 100K requests/day. |
| Cloudflare KV | -- | Key-value storage | Cache match data, store bet records, session data. Low-latency reads. Free tier: 100K reads/day. |

**Why not a full backend (Express, Fastify, etc.):** ten+1 is commerce-first. Shopify IS the backend for products, inventory, orders, and payments. Printful IS the backend for fulfillment. The only custom backend logic is: (1) proxying API keys, (2) handling webhooks, (3) the generative design pipeline. Cloudflare Workers handle all three without managing servers.

**Why not Vercel/Netlify serverless:** Cloudflare Workers have 0ms cold starts (V8 isolates, not containers). For live match data polling and webhook handling, cold start latency matters. Also, KV + Workers is a cohesive platform vs. mixing Vercel functions with a separate database.

**Confidence: MEDIUM** -- The generative design pipeline (match ends -> generate design -> upload to Printful -> create Shopify product) is the most complex backend piece. If it needs heavy image processing (Canvas API, Sharp), Workers may hit CPU time limits (50ms on free, 30s on paid). May need to use Cloudflare Queues + a longer-running process. Flag for phase-specific research.

### Deployment

| Technology | Purpose | Why |
|------------|---------|-----|
| Cloudflare Pages | Static site hosting | Free, global CDN, integrates with Workers for API routes. `vite build` -> deploy `dist/`. Git-based deploys. |

**Why not Vercel:** Vercel is optimized for Next.js/SSR workloads. For a static SPA + Workers, Cloudflare Pages + Workers is a more natural fit and avoids vendor lock-in to Vercel's edge functions.

**Confidence: HIGH** -- Cloudflare Pages is a mature static hosting platform with native Workers integration.

---

## Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| graphql-request | ^7.x | Lightweight GraphQL client | If @shopify/storefront-api-client proves limiting for custom queries. Tiny, promise-based, no framework dependency. |
| html-to-image | ^1.x | Screenshot Three.js canvas | Capture the generative 3D scene as a PNG for merch design input. |
| sharp (in Workers/server) | ^0.33 | Image processing | Resize/compose the captured design into Printful's template dimensions. Runs server-side only. |
| lil-gui | ^0.19 | Dev-only parameter tweaking | Tune 3D scene parameters (fluid viscosity, grid spacing, animation curves) during development. Strip from production build. |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | Vite + React SPA | Shopify Hydrogen | SSR/Oxygen adds complexity with no benefit for WebGL-heavy client-rendered pages. Terminal UI needs full DOM control. |
| Framework | Vite + React SPA | Next.js | Same SSR problem. Also locks into Vercel ecosystem. |
| Framework | Vite + React SPA | Astro | Great for content sites, but ten+1 is an interactive app, not a content site. Astro's island architecture adds friction for full-page interactivity. |
| 3D | Vanilla Three.js | React Three Fiber | Custom shader work is more natural in vanilla Three.js. R3F adds indirection for bespoke WebGL. |
| Commerce client | @shopify/storefront-api-client | JS Buy SDK | Buy SDK deprecated Jan 2025. Dead end. |
| State | Zustand | Redux Toolkit | Overkill for ~5 stores. Zustand is simpler with better Three.js integration. |
| CSS | CSS Modules | Tailwind CSS | Terminal aesthetic has exact typographic specs that fight utility classes. |
| POD | Printful | Printify | Printify has more providers but weaker API for programmatic design uploads. |
| Soccer data | API-Football | Sportmonks | More expensive. API-Football's free tier sufficient for MVP. |
| Hosting | Cloudflare Pages + Workers | Vercel | CF Workers have 0ms cold starts. Pages + Workers is a cohesive platform for SPA + serverless. |

---

## Installation

```bash
# Initialize project
npm create vite@latest tenplusone -- --template react-ts
cd tenplusone

# Core dependencies
npm install react react-dom three @shopify/storefront-api-client zustand

# Dev dependencies
npm install -D typescript @types/react @types/react-dom @types/three vite lil-gui

# Optional (add when needed)
npm install graphql-request  # if storefront client is limiting
npm install html-to-image     # for design capture
```

---

## Key Integration Points

### Shopify Storefront API (GraphQL)

```typescript
import { createStorefrontApiClient } from '@shopify/storefront-api-client';

const client = createStorefrontApiClient({
  storeDomain: 'https://tenplusone.myshopify.com',
  apiVersion: '2026-01',
  publicAccessToken: import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN,
});

// Fetch products
const { data } = await client.request(PRODUCTS_QUERY);

// Create cart
const { data: cart } = await client.request(CART_CREATE_MUTATION, {
  variables: { input: { lines: [{ merchandiseId, quantity: 1 }] } }
});

// Redirect to checkout
window.location.href = cart.cartCreate.cart.checkoutUrl;
```

### API-Football (via proxy)

```typescript
// Client calls our Cloudflare Worker proxy (hides API key)
const matches = await fetch('/api/matches/world-cup-2026');

// Worker proxies to API-Football
// GET https://v3.football.api-sports.io/fixtures?league=1&season=2026
```

### Printful Design Pipeline

```
Match ends
  -> Worker receives webhook / polls API-Football
  -> Generates design parameters from match stats
  -> Captures 3D scene as PNG (or generates server-side)
  -> POST /v2/mockup-tasks to Printful
  -> Webhook: mockup_task_finished
  -> Create/update Shopify product via Admin API
  -> Product available for purchase
```

---

## Version Pinning Strategy

Pin major versions, float patches:
- `"three": "^0.183.0"` -- Three.js uses 0.x semver, minor = breaking
- `"react": "^19.0.0"` -- React 19 stable
- `"@shopify/storefront-api-client": "^1.0.0"` -- follow Shopify's releases
- `"zustand": "^5.0.0"` -- Zustand 5 is current

---

## Sources

- [Shopify Hydrogen framework](https://hydrogen.shopify.dev/)
- [Shopify Storefront API reference](https://shopify.dev/docs/api/storefront/latest)
- [@shopify/storefront-api-client on npm](https://www.npmjs.com/package/@shopify/storefront-api-client)
- [Shopify headless build options](https://shopify.dev/docs/storefronts/headless/getting-started/build-options)
- [JS Buy SDK deprecation notice](https://shopify.dev/docs/storefronts/headless/additional-sdks/js-buy)
- [Three.js releases (r183 current)](https://github.com/mrdoob/three.js/releases)
- [Three.js 2026 changes (WebGPU)](https://www.utsubo.com/blog/threejs-2026-what-changed)
- [API-Football pricing](https://www.api-football.com/pricing)
- [API-Football documentation v3](https://www.api-football.com/documentation-v3)
- [football-data.org pricing](https://www.football-data.org/pricing)
- [Printful API v2 docs](https://developers.printful.com/docs/v2-beta/)
- [Printful Shopify integration](https://www.printful.com/integrations/shopify)
- [Vite getting started](https://vite.dev/guide/)
- [React Three Fiber vs vanilla Three.js](https://elkayal.me/article/react-three-fiber-vs-vanilla-three-js-what%E2%80%99s-right-for-your-project/)
