# Phase 1: Commerce Foundation - Research

**Researched:** 2026-03-22
**Domain:** Vite + React SPA scaffold, Shopify headless commerce, wagering/prediction backend, football data integration
**Confidence:** HIGH

## Summary

Phase 1 builds the entire commerce and wagering backbone of ten+1: a Vite + React + TypeScript SPA with terminal-aesthetic UI, headless Shopify integration for product browsing/cart/checkout, and a Cloudflare Workers backend for match data polling, prediction tracking, and discount code generation via the Shopify Admin API.

The existing prototype (index.html with React via CDN + Babel standalone, grid.html with Three.js) provides validated UI patterns -- the terminal line-number layout, odds buttons, bet slip, group filtering, and nav structure. The migration to Vite + React is mechanical: extract CSS to modules, convert inline JSX to proper components, replace CDN React with npm React 19. The hardcoded match/merch/group data becomes API-driven (Shopify for merch, API-Football for matches, Zustand for state).

The critical architecture constraint is the two-API Shopify pattern: the browser talks to the Storefront API (public token) for product reads and cart management, while the backend (Cloudflare Workers) talks to the Admin API (secret token) for discount code creation. This is not optional -- the Storefront API cannot create discounts. The backend also owns match data polling, wager storage (Cloudflare D1 / SQLite), and prediction resolution logic.

**Primary recommendation:** Build the SPA scaffold first (plan 01-01), then wire Shopify Storefront API for merch browsing/cart/checkout (plan 01-02), then build the Workers backend for wagering + discount generation (plan 01-03). Each plan produces a shippable increment.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| COMM-01 | Browse World Cup matches with odds in terminal UI | Prototype has complete match browser UI. Migrate to Vite SPA, replace hardcoded MATCHES data with API-Football integration via backend proxy. |
| COMM-02 | Add match predictions to bet slip | Prototype has working bet slip UX (toggleBet, removeBet, setWager). Migrate to Zustand store. |
| COMM-03 | Select merch to wager on each prediction | Extend bet slip store to associate a Shopify product variant with each prediction. |
| COMM-04 | Browse merch catalog organized by team | Shopify Storefront API products query with collection-based organization. Replace hardcoded MERCH array. |
| COMM-05 | View product details (mockup images, sizing, materials) | Storefront API product query returns images, variants, descriptions. Standard product detail page component. |
| COMM-06 | Add merch to cart and checkout via Shopify | Storefront API cartCreate/cartLinesAdd mutations -> checkoutUrl redirect. See code examples below. |
| COMM-07 | Order confirmation and tracking via Shopify emails | Shopify handles this natively. No custom code needed -- just ensure Shopify store email settings are configured. |
| COMM-08 | Winning prediction unlocks 50% discount code | Backend Workers handler: on match finish, query wagers, call Admin API discountCodeBasicCreate with percentage: 0.5, usageLimit: 1. |
| COMM-09 | Losing prediction unlocks consolation reward | Same Admin API flow but with reduced percentage (e.g., 15%) or fixed amount discount. |
| COMM-10 | Discount codes dynamically generated via Admin API | discountCodeBasicCreate mutation with unique codes, single-use, expiration window, product-scoped. See code examples. |
| FRNT-01 | Terminal/code-editor aesthetic (Geist Mono, line numbers, black/white) | Prototype CSS is the reference implementation. Migrate to CSS Modules preserving exact values. |
| FRNT-02 | Green reserved for hover states only | Already implemented in prototype (--green: #4ade80, used only on :hover). Enforce via CSS convention. |
| FRNT-03 | Mobile-responsive layout maintaining terminal aesthetic | Prototype has @media (max-width: 560px) responsive rules. Extend to full mobile breakpoint system. |
| FRNT-04 | Consistent nav bar across terminal and grid pages | Prototype nav exists in both index.html and grid.html. Unify into shared React component with React Router. |
| INFR-01 | Shopify store with products, collections, Storefront API access | Manual setup: create Shopify store, add products, create Storefront API access token, configure collections by team. |
| INFR-02 | Backend API (Cloudflare Workers) for discount codes, match resolution, design pipeline | Hono + Cloudflare Workers + D1 for SQLite. Three route groups: /api/matches, /api/wagers, /api/admin. |
| INFR-03 | Football data API integration (API-Football) for schedules, odds, results | Workers cron trigger polls API-Football v3 /fixtures endpoint. Cache in D1 or KV. Proxy to frontend via /api/matches. |
| INFR-04 | Wager database tracking predictions, outcomes, discount codes | D1 SQLite schema: wagers, matches, match_events tables. See schema in Architecture Patterns. |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vite | 8.0.1 | Build tool + dev server | Zero-config React+TS, instant HMR, static dist/ output. Smallest step from prototype. |
| React | 19.2.4 | UI framework | Already in prototype (via CDN). Moving to proper JSX compilation. Stable since Dec 2024. |
| TypeScript | 5.9.3 | Type safety | Shopify GraphQL schema + complex state (cart, bets, matches) benefits from types. |
| React Router | 7.13.1 | Client-side routing | SPA needs routes: /, /matches, /merch, /merch/:handle, /teams, /slip. Latest stable. |
| @shopify/storefront-api-client | 1.0.10 | Shopify Storefront API | Official headless client. Typed GraphQL, cart mutations, checkout URLs. Replaces deprecated JS Buy SDK. |
| @shopify/admin-api-client | 1.1.2 | Shopify Admin API (server-side) | Used in Workers for discount code creation. Official client. |
| Zustand | 5.0.12 | Client state management | ~1KB, works outside React (needed for Three.js later), no boilerplate. Cart + bet slip + UI state. |
| Hono | 4.12.8 | Workers API framework | Express-like API for Cloudflare Workers. First-class D1 support. Official Cloudflare recommendation. |
| Wrangler | 4.76.0 | Workers CLI + local dev | Deploy Workers, manage D1, local development with miniflare. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| CSS Modules (via Vite) | built-in | Scoped component styles | All component styling. Preserves prototype's intentional terminal CSS. |
| Geist font (npm) | latest | Terminal typography | `@import url('https://fonts.googleapis.com/css2?family=Geist+Mono:...')` or self-host via npm geist package. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| React Router | TanStack Router | TanStack has better type safety but smaller ecosystem. React Router is more proven and sufficient here. |
| Hono | itty-router | itty is smaller but Hono has better D1 integration, middleware, and documentation. |
| D1 (SQLite) | KV | KV is key-value only. D1 gives relational queries needed for wager resolution (JOIN wagers ON matches). |
| CSS Modules | Tailwind | Terminal aesthetic has exact typographic specs (14px Geist Mono, 1.85 line-height) that fight utility classes. |

**Installation:**

```bash
# Frontend SPA
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install react react-dom react-router @shopify/storefront-api-client zustand
npm install -D typescript @types/react @types/react-dom

# Backend Workers
npm create cloudflare@latest api -- --template hello-world
cd api
npm install hono @shopify/admin-api-client
```

## Architecture Patterns

### Recommended Project Structure

```
tenplusone/
├── frontend/                    # Vite + React SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/          # Nav, Line, Editor (terminal primitives)
│   │   │   ├── matches/         # MatchList, MatchCard, OddsButton
│   │   │   ├── merch/           # ProductGrid, ProductDetail, CartDrawer
│   │   │   └── slip/            # BetSlip, SlipItem
│   │   ├── stores/              # Zustand stores
│   │   │   ├── cart.ts          # Shopify cart state
│   │   │   ├── slip.ts          # Bet slip state
│   │   │   └── matches.ts       # Match data cache
│   │   ├── lib/
│   │   │   ├── shopify.ts       # Storefront API client + queries
│   │   │   └── api.ts           # Backend API client
│   │   ├── pages/               # Route-level components
│   │   │   ├── Matches.tsx
│   │   │   ├── Groups.tsx
│   │   │   ├── Merch.tsx
│   │   │   ├── ProductDetail.tsx
│   │   │   └── BetSlip.tsx
│   │   ├── styles/
│   │   │   ├── tokens.css       # CSS custom properties (from prototype :root)
│   │   │   └── global.css       # Base styles, font import
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── api/                         # Cloudflare Workers backend
│   ├── src/
│   │   ├── index.ts             # Hono app entry
│   │   ├── routes/
│   │   │   ├── matches.ts       # GET /api/matches, match data proxy
│   │   │   ├── wagers.ts        # POST/GET /api/wagers
│   │   │   └── admin.ts         # Internal: discount creation, match resolution
│   │   ├── services/
│   │   │   ├── football.ts      # API-Football client
│   │   │   ├── shopify-admin.ts # Shopify Admin API discount creation
│   │   │   └── resolver.ts      # Match resolution + wager settlement logic
│   │   └── db/
│   │       └── schema.sql       # D1 migration
│   ├── wrangler.toml
│   └── package.json
└── .planning/                   # Planning docs (existing)
```

### Pattern 1: Terminal UI Component System

**What:** Extract the prototype's terminal line-number layout into reusable React components.
**When to use:** Every page. The terminal aesthetic IS the product.

```typescript
// components/layout/Line.tsx
interface LineProps {
  n?: number;
  children: React.ReactNode;
  className?: string;
}

export function Line({ n, children, className = '' }: LineProps) {
  return (
    <div className={`L ${className}`}>
      <span className="Ln">{n ?? ''}</span>
      <span className="Lc">{children}</span>
    </div>
  );
}

// Auto-incrementing line counter hook
export function useLineCounter(start = 1) {
  const ref = useRef(start);
  ref.current = start;
  return () => ref.current++;
}
```

**Source:** Extracted from existing prototype index.html lines 376-387.

### Pattern 2: Two-API Shopify Integration

**What:** Browser uses Storefront API (public token) for product reads and cart. Server uses Admin API (secret token) for discount code creation.
**When to use:** Always. This is the only supported headless Shopify pattern.

```typescript
// Frontend: lib/shopify.ts
import { createStorefrontApiClient } from '@shopify/storefront-api-client';

const client = createStorefrontApiClient({
  storeDomain: 'https://tenplusone.myshopify.com',
  apiVersion: '2025-10',
  publicAccessToken: import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN,
});

// Product query
const PRODUCTS_QUERY = `#graphql
  query Products($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          handle
          description
          priceRange { minVariantPrice { amount currencyCode } }
          images(first: 1) { edges { node { url altText } } }
          variants(first: 10) { edges { node { id title price { amount } } } }
        }
      }
    }
  }
`;

// Cart creation
const CART_CREATE = `#graphql
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        lines(first: 10) { edges { node { id quantity merchandise { ... on ProductVariant { id title } } } } }
        cost { totalAmount { amount currencyCode } }
      }
      userErrors { field message }
    }
  }
`;

// Backend: services/shopify-admin.ts (in Workers)
import { createAdminApiClient } from '@shopify/admin-api-client';

const admin = createAdminApiClient({
  storeDomain: 'tenplusone.myshopify.com',
  apiVersion: '2025-10',
  accessToken: env.SHOPIFY_ADMIN_TOKEN, // Secret! Never in frontend.
});

// Create single-use 50% discount code
const CREATE_DISCOUNT = `#graphql
  mutation CreateDiscount($basicCodeDiscount: DiscountCodeBasicInput!) {
    discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
      codeDiscountNode { id }
      userErrors { field message }
    }
  }
`;

// Usage: generate unique code per wager
async function createWinnerDiscount(wagerEmail: string, matchId: string) {
  const code = `WIN-${matchId}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  await admin.request(CREATE_DISCOUNT, {
    variables: {
      basicCodeDiscount: {
        title: `Winner discount - Match ${matchId}`,
        code,
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 72h expiry
        customerSelection: { all: true },
        customerGets: {
          value: { percentage: 0.5 },
          items: { all: true },
        },
        usageLimit: 1,
        appliesOncePerCustomer: true,
      },
    },
  });
  return code;
}
```

**Source:** [Shopify Storefront API cart docs](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/cart/manage), [discountCodeBasicCreate mutation](https://shopify.dev/docs/api/admin-graphql/latest/mutations/discountcodebasiccreate)

### Pattern 3: D1 Database Schema for Wagers

**What:** Minimal SQLite schema for tracking predictions and match data.
**When to use:** Backend Workers.

```sql
-- api/src/db/schema.sql
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,              -- API-Football fixture ID
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  kickoff TEXT NOT NULL,            -- ISO 8601
  status TEXT DEFAULT 'SCHEDULED',  -- SCHEDULED | LIVE | FINISHED
  score_home INTEGER,
  score_away INTEGER,
  match_data TEXT,                  -- JSON blob for generative design (Phase 2)
  group_id TEXT,
  venue TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wagers (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_email TEXT NOT NULL,
  match_id TEXT NOT NULL REFERENCES matches(id),
  pick TEXT NOT NULL,               -- 'home' | 'away' | 'draw'
  product_id TEXT,                  -- Shopify product ID they want discounted
  status TEXT DEFAULT 'PENDING',    -- PENDING | WON | LOST | RESOLVED
  discount_code TEXT,
  discount_pct REAL,               -- 0.50 for winners, 0.15 for losers
  created_at TEXT DEFAULT (datetime('now')),
  resolved_at TEXT
);

CREATE INDEX idx_wagers_match ON wagers(match_id);
CREATE INDEX idx_wagers_email ON wagers(user_email);
CREATE INDEX idx_wagers_status ON wagers(status);
```

### Pattern 4: Workers API Structure with Hono

**What:** Hono-based REST API on Cloudflare Workers with D1 bindings.

```typescript
// api/src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { matchesRoute } from './routes/matches';
import { wagersRoute } from './routes/wagers';

type Bindings = {
  DB: D1Database;
  SHOPIFY_ADMIN_TOKEN: string;
  FOOTBALL_API_KEY: string;
  FOOTBALL_API_HOST: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('/*', cors({ origin: ['https://tenplusone.pages.dev', 'http://localhost:5173'] }));

app.route('/api/matches', matchesRoute);
app.route('/api/wagers', wagersRoute);

// Scheduled handler for match polling
export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Bindings) {
    // Poll API-Football for live match updates
    // Resolve finished matches -> generate discount codes
  },
};
```

```toml
# api/wrangler.toml
name = "tenplusone-api"
main = "src/index.ts"
compatibility_date = "2025-01-01"

[[d1_databases]]
binding = "DB"
database_name = "tenplusone-db"
database_id = "<auto-generated>"

[triggers]
crons = ["*/5 * * * *"]  # Poll every 5 minutes (increase during live matches)

[vars]
FOOTBALL_API_HOST = "v3.football.api-sports.io"
```

**Source:** [Cloudflare D1 + Hono tutorial](https://developers.cloudflare.com/d1/examples/d1-and-hono/), [Hono Workers docs](https://hono.dev/docs/getting-started/cloudflare-workers)

### Anti-Patterns to Avoid

- **Frontend-only architecture:** Storefront API cannot create discounts. A backend (Workers) is mandatory from day one for discount code generation, API key proxying, and wager tracking.
- **Duplicating Shopify data:** Store only Shopify product IDs in your wager DB. Query Shopify when you need product details. Shopify is the source of truth for products/orders.
- **Building user auth for v1:** Email-only identification for wagers. Shopify handles customer identity at checkout. No login, no registration, no passwords.
- **Real-time odds calculation:** Fixed discount tiers only. This is a merch platform with a betting theme, not a sportsbook.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Shopping cart | Custom cart state + persistence | Shopify Storefront API cart mutations | Shopify handles cart merging, inventory checks, price calculations, tax, shipping |
| Payment processing | Any payment form | Shopify hosted checkout (checkoutUrl redirect) | PCI compliance, fraud detection, Stripe/PayPal/Apple Pay built in |
| Discount code logic | Custom discount engine | Shopify Admin API discountCodeBasicCreate | Single-use enforcement, product scoping, expiration, usage tracking all handled |
| Email notifications | Custom email system | Shopify order confirmation emails | Already configured, includes tracking, localized |
| Database management | Self-hosted SQLite/Postgres | Cloudflare D1 | Managed, zero-config, integrated with Workers, automatic backups |

**Key insight:** Shopify handles the hardest parts of commerce (payments, taxes, shipping, inventory, fraud). The custom backend only handles what Shopify cannot: prediction tracking, match data, and discount code generation.

## Common Pitfalls

### Pitfall 1: Shopify Store Must Be Created Manually First
**What goes wrong:** Developers start coding the Storefront API integration without having a Shopify store configured. The API client requires a real store domain and access token.
**Why it happens:** It feels like "just a config" but Shopify store setup involves: creating the store, adding products, creating collections, configuring Storefront API access in the admin, and generating the public access token.
**How to avoid:** Create the Shopify store and add at least 3-5 placeholder products BEFORE writing any Storefront API code. This is a prerequisite for plan 01-02, not a task within it.
**Warning signs:** Using mock data past the first day of Shopify integration.

### Pitfall 2: Storefront API Version Mismatch
**What goes wrong:** Using an old or wrong API version string causes fields to be missing or mutations to fail. Shopify releases new API versions quarterly and sunsets old ones.
**Why it happens:** Copy-pasting from outdated tutorials.
**How to avoid:** Pin to `2025-10` (current stable). Check [Shopify API versioning](https://shopify.dev/docs/api/usage/versioning) for the latest release.
**Warning signs:** GraphQL queries returning null for fields that should exist.

### Pitfall 3: Cart State Lost on Page Reload
**What goes wrong:** Cart ID is stored only in React state. User refreshes, cart is gone.
**Why it happens:** Shopify carts are server-side objects with IDs. If you lose the ID, you lose the cart.
**How to avoid:** Persist cart ID in localStorage. On app init, check for existing cart ID and fetch cart state from Shopify. If cart is expired (carts expire after ~24h of inactivity), create new one.
**Warning signs:** Users complaining about empty carts after navigating away.

### Pitfall 4: Checkout Redirect UX Jarring
**What goes wrong:** Terminal dark UI suddenly redirects to Shopify's white checkout page. Users think they left the site.
**Why it happens:** Shopify's hosted checkout cannot be fully themed without Shopify Plus ($2300/month).
**How to avoid:** Add a "Proceeding to secure checkout..." transition screen. Accept the visual break for MVP. Consider Shopify Plus post-launch if conversion suffers.
**Warning signs:** High cart abandonment rate at checkout redirect.

### Pitfall 5: D1 Database Migrations
**What goes wrong:** Schema changes after initial deployment break the database.
**Why it happens:** D1 does not have automatic migration tooling like Prisma/Drizzle.
**How to avoid:** Use Wrangler's `d1 migrations` commands. Keep migration SQL files in `api/migrations/`. Run `wrangler d1 migrations apply` for deployment.
**Warning signs:** Manual SQL alterations in production.

### Pitfall 6: API-Football Free Tier Limits
**What goes wrong:** 100 requests/day on the free tier. During development with hot-reloading, this is consumed in minutes if every page load fetches from the API.
**Why it happens:** Not caching API responses locally.
**How to avoid:** Cache API-Football responses in D1 or KV with 5-minute TTL during development. Use a local JSON fixture file for development. Only hit the live API for integration testing.
**Warning signs:** Getting 429 rate limit responses during development.

## Code Examples

### Prototype CSS Token Migration

The prototype's CSS custom properties should be preserved exactly:

```css
/* styles/tokens.css - Extract from prototype :root */
:root {
  --bg: #000000;
  --white: #a0a0a0;
  --bright: #ffffff;
  --dim: #555555;
  --faint: #222222;
  --line-num: #333333;
  --green: #4ade80;
  --font: 'Geist Mono', 'SF Mono', 'Menlo', 'Consolas', monospace;
  --font-size: 14px;
  --line-height: 1.85;
  --letter-spacing: 0.01em;
}
```

### Zustand Cart Store

```typescript
// stores/cart.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { shopifyClient, CART_CREATE, CART_LINES_ADD } from '../lib/shopify';

interface CartStore {
  cartId: string | null;
  checkoutUrl: string | null;
  items: CartItem[];
  itemCount: number;
  total: string;
  createCart: (variantId: string, quantity: number) => Promise<void>;
  addItem: (variantId: string, quantity: number) => Promise<void>;
  clear: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cartId: null,
      checkoutUrl: null,
      items: [],
      itemCount: 0,
      total: '0.00',
      createCart: async (variantId, quantity) => {
        const { data } = await shopifyClient.request(CART_CREATE, {
          variables: { input: { lines: [{ merchandiseId: variantId, quantity }] } },
        });
        const cart = data.cartCreate.cart;
        set({ cartId: cart.id, checkoutUrl: cart.checkoutUrl, /* ... */ });
      },
      addItem: async (variantId, quantity) => {
        const { cartId } = get();
        if (!cartId) return get().createCart(variantId, quantity);
        // cartLinesAdd mutation...
      },
      clear: () => set({ cartId: null, checkoutUrl: null, items: [], itemCount: 0, total: '0.00' }),
    }),
    { name: 'tenplusone-cart', partialize: (s) => ({ cartId: s.cartId }) }
  )
);
```

### Zustand Bet Slip Store

```typescript
// stores/slip.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Bet {
  matchId: string;
  pick: 'home' | 'away' | 'draw';
  odds: number;
  homeTeam: string;
  awayTeam: string;
  productId?: string; // Shopify product to wager on
}

interface SlipStore {
  bets: Bet[];
  toggleBet: (bet: Omit<Bet, 'productId'>) => void;
  removeBet: (matchId: string) => void;
  setProduct: (matchId: string, productId: string) => void;
  clear: () => void;
}

export const useSlipStore = create<SlipStore>()(
  persist(
    (set) => ({
      bets: [],
      toggleBet: (bet) => set((s) => {
        const exists = s.bets.find((b) => b.matchId === bet.matchId && b.pick === bet.pick);
        if (exists) return { bets: s.bets.filter((b) => !(b.matchId === bet.matchId && b.pick === bet.pick)) };
        return { bets: [...s.bets.filter((b) => b.matchId !== bet.matchId), bet] };
      }),
      removeBet: (matchId) => set((s) => ({ bets: s.bets.filter((b) => b.matchId !== matchId) })),
      setProduct: (matchId, productId) => set((s) => ({
        bets: s.bets.map((b) => b.matchId === matchId ? { ...b, productId } : b),
      })),
      clear: () => set({ bets: [] }),
    }),
    { name: 'tenplusone-slip' }
  )
);
```

### API-Football Match Data Proxy

```typescript
// api/src/routes/matches.ts
import { Hono } from 'hono';

const app = new Hono<{ Bindings: { DB: D1Database; FOOTBALL_API_KEY: string } }>();

// GET /api/matches - returns cached match data
app.get('/', async (c) => {
  // Try cache first
  const cached = await c.env.DB.prepare(
    'SELECT * FROM matches WHERE status IN (?, ?) ORDER BY kickoff'
  ).bind('SCHEDULED', 'LIVE').all();

  return c.json({ matches: cached.results });
});

// POST /api/matches/sync - poll API-Football (called by cron)
app.post('/sync', async (c) => {
  const res = await fetch('https://v3.football.api-sports.io/fixtures?league=1&season=2026', {
    headers: { 'x-apisports-key': c.env.FOOTBALL_API_KEY },
  });
  const data = await res.json();

  // Upsert matches into D1
  for (const fixture of data.response) {
    await c.env.DB.prepare(`
      INSERT INTO matches (id, home_team, away_team, kickoff, status, score_home, score_away, group_id, venue)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET status=?, score_home=?, score_away=?
    `).bind(
      String(fixture.fixture.id),
      fixture.teams.home.name,
      fixture.teams.away.name,
      fixture.fixture.date,
      fixture.fixture.status.short,
      fixture.goals.home,
      fixture.goals.away,
      fixture.league.round,
      fixture.fixture.venue?.name,
      fixture.fixture.status.short,
      fixture.goals.home,
      fixture.goals.away,
    ).run();
  }

  return c.json({ synced: data.response.length });
});

export { app as matchesRoute };
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Shopify JS Buy SDK | @shopify/storefront-api-client | Jan 2025 (deprecated) | Must use new client. Buy SDK will stop working. |
| Shopify Checkout API | Shopify Cart API (Storefront) | 2021 | Cart API is the standard. Checkout API is legacy. |
| Workers KV for relational data | Cloudflare D1 (SQLite) | GA Oct 2024 | D1 gives SQL queries for JOIN/WHERE on wagers+matches. KV was insufficient. |
| Custom Workers routing | Hono framework | 2023+ adoption | Hono is Cloudflare's recommended web framework for Workers. |
| React via CDN + Babel standalone | Vite + React + TypeScript SPA | Always for production | CDN approach was for prototyping. Vite gives proper bundling, HMR, types. |

**Deprecated/outdated:**
- **Shopify JS Buy SDK:** Deprecated Jan 2025. Do not use. Use `@shopify/storefront-api-client` instead.
- **Shopify REST API for Storefront:** Being phased out in favor of GraphQL. Use GraphQL for all Storefront API calls.
- **Cloudflare Workers Sites:** Replaced by Cloudflare Pages. Use Pages for static hosting.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.x (integrated with Vite) |
| Config file | `frontend/vitest.config.ts` (Wave 0) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COMM-01 | Match list renders with odds | unit | `npx vitest run src/components/matches/MatchList.test.tsx` | Wave 0 |
| COMM-02 | Bet slip add/remove/toggle | unit | `npx vitest run src/stores/slip.test.ts` | Wave 0 |
| COMM-04 | Products load from Shopify | integration | `npx vitest run src/lib/shopify.test.ts` | Wave 0 |
| COMM-06 | Cart create + add items | integration | `npx vitest run src/stores/cart.test.ts` | Wave 0 |
| COMM-08 | Discount code created for winner | unit | `npx vitest run api/src/services/resolver.test.ts` | Wave 0 |
| COMM-10 | Admin API discount creation | integration | `npx vitest run api/src/services/shopify-admin.test.ts` | Wave 0 |
| FRNT-01 | Terminal Line component renders | unit | `npx vitest run src/components/layout/Line.test.tsx` | Wave 0 |
| FRNT-03 | Responsive layout breakpoints | manual-only | Visual inspection at 375px, 768px, 1024px widths | N/A |
| INFR-02 | Workers API responds to routes | integration | `npx vitest run api/src/index.test.ts` | Wave 0 |
| INFR-04 | Wager CRUD operations on D1 | unit | `npx vitest run api/src/routes/wagers.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose` (frontend and api)
- **Per wave merge:** Full suite + manual checkout flow test
- **Phase gate:** Full suite green + successful Shopify checkout test purchase

### Wave 0 Gaps
- [ ] `frontend/vitest.config.ts` -- Vitest configuration
- [ ] `frontend/src/test/setup.ts` -- Test setup with jsdom
- [ ] `api/vitest.config.ts` -- Vitest configuration for Workers
- [ ] Install: `npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom`

## Open Questions

1. **Shopify Store Creation**
   - What we know: Need a Shopify store with Storefront API access and Admin API access.
   - What's unclear: Which Shopify plan? Basic ($39/mo) is sufficient for Storefront + Admin API access. Plus ($2300/mo) only needed for checkout customization.
   - Recommendation: Start with Basic plan. Accept the checkout visual break. Upgrade to Plus only if conversion data warrants it.

2. **Legal Structure of Prediction Mechanic**
   - What we know: Prize + chance + consideration = illegal lottery. Must eliminate one element.
   - What's unclear: Whether the chosen model (sweepstakes with free entry, or promotional pricing where everyone gets a discount) has been finalized.
   - Recommendation: Implement the prediction system with the language "predict" not "bet/wager." Code the discount logic to be configurable (win % and lose % as env vars). Let the legal review drive the final mechanic.

3. **Email Delivery for Discount Codes**
   - What we know: Discount codes must reach the user after match resolution.
   - What's unclear: How? Options: (a) show in the UI if user returns, (b) send via email (requires email service), (c) Shopify email integration.
   - Recommendation: For v1, display discount codes in the UI (persisted in localStorage by email). Defer email delivery to v1.1. This avoids needing an email service (SendGrid, etc.) in Phase 1.

4. **API-Football Fixture IDs Availability**
   - What we know: API-Football covers World Cup 2026 and provides fixture endpoints.
   - What's unclear: Whether fixture IDs for WC 2026 are already available (matches not fully scheduled until playoff completion).
   - Recommendation: Start with hardcoded match data from the prototype (24 matches already defined). Switch to API-Football when fixtures are confirmed. Build the polling infrastructure against test/historical data.

## Sources

### Primary (HIGH confidence)
- [Shopify Storefront API - Cart Management](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/cart/manage) -- cartCreate, cartLinesAdd, checkoutUrl
- [Shopify Admin API - discountCodeBasicCreate](https://shopify.dev/docs/api/admin-graphql/latest/mutations/discountcodebasiccreate) -- discount code generation
- [@shopify/storefront-api-client (npm)](https://www.npmjs.com/package/@shopify/storefront-api-client) -- v1.0.10, official headless client
- [@shopify/admin-api-client (npm)](https://www.npmjs.com/package/@shopify/admin-api-client) -- v1.1.2, server-side admin operations
- [Cloudflare D1 Getting Started](https://developers.cloudflare.com/d1/get-started/) -- D1 setup, migrations, bindings
- [Cloudflare D1 + Hono Example](https://developers.cloudflare.com/d1/examples/d1-and-hono/) -- Hono with D1 bindings
- [Hono Cloudflare Workers Docs](https://hono.dev/docs/getting-started/cloudflare-workers) -- Hono framework setup
- [API-Football Documentation v3](https://www.api-football.com/documentation-v3) -- fixtures, odds, live scores

### Secondary (MEDIUM confidence)
- [Shopify Storefront API Learning Kit](https://github.com/Shopify/storefront-api-learning-kit) -- reference implementation
- [Shopify API Versioning](https://shopify.dev/docs/api/usage/versioning) -- quarterly release cycle
- npm registry version checks (all verified 2026-03-22)

### Tertiary (LOW confidence)
- API-Football World Cup 2026 fixture availability -- cannot verify until tournament draws finalize

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All packages verified against npm registry. Versions current as of 2026-03-22.
- Architecture: HIGH -- Two-API Shopify pattern is documented and standard. Hono + D1 is Cloudflare's recommended stack.
- Pitfalls: HIGH -- Verified against official Shopify docs (discount creation requires Admin API, cart persistence needs localStorage).

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (30 days -- stable stack, no fast-moving dependencies)
