# iFC Shopify Integration

This is everything you need to flip the iFC site from its built-in
mock catalog over to a real Shopify + Printful store.

The frontend already speaks the Storefront API. When the two env vars
below are present, all product listings, collections, and the cart pull
from Shopify automatically — no code changes needed.

---

## 1. Create the Shopify store

You probably already have one (`internetfc.myshopify.com` or similar).
If not, sign up at [shopify.com](https://www.shopify.com/) on the Basic
plan. Pick a placeholder theme; iFC uses headless checkout so the
theme only matters for the post-purchase pages.

## 2. Create a Storefront API access token

1. Shopify admin → **Settings → Apps and sales channels**
2. Click **Develop apps → Create an app**
3. Name it `internetfc-storefront`
4. Open **Configuration → Storefront API access scopes** and enable:
   - `unauthenticated_read_product_listings`
   - `unauthenticated_read_product_inventory`
   - `unauthenticated_write_checkouts`
   - `unauthenticated_read_checkouts`
5. Click **Install app**
6. Open **API credentials** and copy the **Storefront API access token**

## 3. Add env vars to Vercel

From the project root:

```bash
cd /Users/lu/tenplusone
npx vercel env add VITE_SHOPIFY_STORE_DOMAIN production
# paste: internetfc.myshopify.com (no https://)
npx vercel env add VITE_SHOPIFY_STOREFRONT_TOKEN production
# paste: the token from step 2
npx vercel env add VITE_SHOPIFY_STORE_DOMAIN preview
npx vercel env add VITE_SHOPIFY_STOREFRONT_TOKEN preview
```

Then redeploy: `npx vercel deploy --prod --yes`.

The frontend detects the env vars in `src/lib/shopify.ts` — `isMockMode`
flips to `false` and the live client takes over.

---

## 4. Required naming conventions

The frontend expects this structure. Match it in Shopify and Printful and
no other wiring is needed.

### Product handles

`{team-slug}-{product-type}` — exactly the slugs in
`frontend/src/data/teams.ts`:

```
brazil-jersey       brazil-tee       brazil-scarf
mexico-jersey       mexico-tee       mexico-scarf
...
```

For non-team products, use the placeholder ids from `MERCH` in
`frontend/src/data/matches.ts` (`p1`, `p2`, etc.).

### Collection handles

One collection per team, handle = team slug. Used by
`fetchProductsByCollection(teamSlug)` on the Team page Closet view.

```
brazil   mexico   united-states   ...
```

Plus product-type collections used by the merch grid filter:

```
tshirt   crew   hoodie   shorts   cap   beanie   scarf   poster   mug
```

### Product metafields (recommended, not required)

If you want the iFC site to surface extra structured data, add these
metafields to every product (namespace = `ifc`):

| Key             | Type                       | Notes                                         |
|-----------------|----------------------------|-----------------------------------------------|
| `team_slug`     | single line text           | mirrors the team's slug                       |
| `product_type`  | single line text           | `tshirt`, `jersey`, etc.                      |
| `fixture_id`    | single line text           | only for match posters: `73`–`104` etc.       |
| `specs`         | rich text or list of pairs | structured spec rows (label/value)            |
| `material`      | single line text           | e.g. `100% combed ringspun cotton`            |
| `weight_oz`     | number                     | for apparel only                              |

These are optional — without them, the frontend uses the descriptions
that ship in `frontend/src/data/matches.ts` (the `MERCH` array, with
real per-product copy + specs).

### Product images

Square transparent PNGs at 1200×1200 work best with the iFC card grid.
Two images per product:

1. **Primary** — flat-lay or studio shot of the garment with the team
   crest visible.
2. **Detail** — a close-up of the print/embroidery on a 45×45 grid.

The iFC frontend currently uses brand-pixel icon mocks; once real
Shopify images flow in, they'll replace those automatically (see
`ProductCard.tsx` and `ProductDetail.tsx` — the `<img>` falls back to
`MerchIcon` only when no image is present).

---

## 5. Connect Printful

1. In Shopify admin → **Apps → Visit Shopify App Store**
2. Install **Printful**
3. Authorize Printful to read products
4. In Printful → **Stores → iFC → Add product**
5. Upload your `/logos/norm/white/{slug}.png` for each team as the print
   file (492×492 inside the 540 frame is the safe area)
6. Map each Printful product to a Shopify product handle that matches
   the convention above (`brazil-tee`, etc.)

Printful syncs inventory + fulfillment automatically; orders placed via
Shopify checkout drop into Printful's print queue.

---

## 6. Smoke test

Once the env vars are set and you've created at least one product:

```bash
# from /Users/lu/tenplusone
npx vercel deploy --prod --yes
```

Then in a fresh browser tab:

1. Visit `https://www.internetfc.com/merch` → should show your real Shopify products
2. Click any product → real description + variants + price
3. Click `buy now` → Shopify checkout opens in a new tab
4. Complete a $0.01 test order with Printful in draft mode

If something fails, the browser console will surface a Shopify error
with a `userErrors` payload. Check the network tab for the GraphQL request.

---

## 7. Local development

To test the real Shopify flow locally, add the two env vars to
`frontend/.env.local`:

```
VITE_SHOPIFY_STORE_DOMAIN=internetfc.myshopify.com
VITE_SHOPIFY_STOREFRONT_TOKEN=your_token_here
```

Then `cd frontend && npm run dev`.

To go back to mock mode for local development, just delete those lines.

---

## What stays mock

These features have no Shopify dependency and work the same in both modes:

- Match schedule, group standings, knockout bracket
- Synthetic prediction market on every match
- Newsletter subscribe (uses Vercel KV when env is set, falls back to localStorage)
- All editorial content (About, FAQ, Shipping, Privacy, Terms)
