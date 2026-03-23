# Phase 3: Fulfillment Pipeline - Research

**Researched:** 2026-03-22
**Domain:** Print-on-demand integration (Printful API + Shopify), automated order fulfillment
**Confidence:** MEDIUM-HIGH

## Summary

Phase 3 connects the generative design pipeline (built in Phase 2) to Printful for actual print-on-demand production and shipping. The phase has only 3 requirements (FULF-01, FULF-02, FULF-03) and the scope is narrow: upload designs to Printful, create synced products, and ensure orders auto-fulfill.

The critical architectural finding is that **Printful does NOT support creating sync products on a Shopify-connected store via API**. Products created via the Shopify API do not automatically appear in Printful's sync store. This means the project needs a hybrid approach: use the Printful API to create products (which Printful then auto-pushes to Shopify), rather than creating Shopify products first and expecting Printful to pick them up. The existing `designs.ts` endpoint currently creates Shopify products directly -- this flow must be restructured to go through Printful first, letting Printful's native Shopify integration handle the Shopify product creation.

For order fulfillment (FULF-03), the Printful Shopify app handles this automatically with zero custom code -- when a customer buys a Printful-synced product on Shopify, the order routes to Printful for production and shipping. Tracking info syncs back to Shopify automatically. The only requirement is that Printful is set as the fulfillment location for these products and auto-import is enabled.

**Primary recommendation:** Use the Printful API to create products with design files (via URL), let Printful's native Shopify integration sync products to Shopify and auto-fulfill orders. Store design images in Cloudflare R2 (not base64 in D1) so Printful can fetch them by URL.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FULF-01 | Print-on-demand integration (Printful) handles merch production | Printful Shopify app for auto-fulfillment + Printful API for programmatic product creation. App handles production routing, tracking sync, and shipping. |
| FULF-02 | Generative match designs are automatically uploaded to Printful as print-ready files | Printful API `POST /store/products` creates sync products with print files specified by URL. Design images must be hosted at publicly accessible URLs (R2). Print files must be PNG, 150-300 DPI, sRGB color profile. Existing 3600x4800 export meets t-shirt requirements. |
| FULF-03 | POD orders are created automatically when a user purchases generative merch | Printful Shopify app auto-imports paid orders with synced products. No custom code needed -- configure "Automatically import orders" in Printful dashboard. Tracking syncs back to Shopify. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Printful API v1 | Stable | Product creation, file upload, order management | v1 is stable and production-ready. v2 is still beta -- avoid for launch-critical pipeline. |
| Printful Shopify App | N/A | Order auto-fulfillment, product sync to Shopify | Native integration handles order routing, tracking, inventory. Zero custom code for fulfillment. |
| Cloudflare R2 | Current | Design image storage | Publicly accessible URLs for Printful to fetch. Free egress. Workers binding for upload. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Hono | (existing) | API routes for Printful integration | Already in use. Add new route for Printful product creation. |
| @shopify/admin-api-client | (existing) | Product updates after Printful sync | May need to update product tags/collections after Printful creates the Shopify listing. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Printful API v1 | Printful API v2 (beta) | v2 has multi-layer design support but is beta with potential breaking changes. Use v1 for reliability. |
| Printful | Printify | Printify has better API docs and programmatic support, but Printful has stronger Shopify integration and quality reputation. Stick with Printful per project decisions. |
| R2 for image storage | D1 base64 (current) | Current approach stores base64 in D1 which bloats the database and can't provide public URLs for Printful. R2 is the correct solution. |

**Installation:**
```bash
# No new npm packages needed -- Printful API is plain REST (fetch)
# R2 bucket configured via wrangler.toml
```

## Architecture Patterns

### Recommended Flow Change

The current flow (Phase 2) creates Shopify products directly:
```
Design PNG -> base64 in D1 -> Shopify Admin API productCreate -> manual image upload
```

The new flow must go through Printful:
```
Design PNG -> R2 upload (public URL) -> Printful API POST /store/products -> Printful auto-syncs to Shopify -> orders auto-fulfill
```

### Recommended Project Structure
```
api/src/
  routes/
    designs.ts       # MODIFY: upload to R2, create Printful product instead of Shopify product
  services/
    printful.ts      # NEW: Printful API client (create product, upload file, check status)
    shopify-admin.ts # existing: may need minor updates for product tagging
```

### Pattern 1: Printful Product Creation via API
**What:** Create a sync product in Printful's Manual/API store with the design image URL and catalog variant IDs
**When to use:** After every match design is generated and exported
**Example:**
```typescript
// Source: Printful API docs (developers.printful.com/docs/)
const PRINTFUL_API = 'https://api.printful.com';

async function createPrintfulProduct(
  apiToken: string,
  title: string,
  imageUrl: string, // R2 public URL
  catalogVariantIds: number[] // e.g., Bella+Canvas 3001 size variants
): Promise<{ id: number; external_id: string }> {
  const body = {
    sync_product: {
      name: title,
      thumbnail: imageUrl,
    },
    sync_variants: catalogVariantIds.map(variantId => ({
      variant_id: variantId,
      retail_price: '34.99',
      files: [
        {
          type: 'front', // or 'default' for posters
          url: imageUrl,
        }
      ],
    })),
  };

  const res = await fetch(`${PRINTFUL_API}/store/products`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return data.result;
}
```

### Pattern 2: R2 Image Upload from Worker
**What:** Store design PNG in R2 with a public URL instead of base64 in D1
**When to use:** When the admin generate page exports a design
**Example:**
```typescript
// wrangler.toml addition:
// [[r2_buckets]]
// binding = "DESIGNS_BUCKET"
// bucket_name = "tenplusone-designs"

async function uploadDesignToR2(
  bucket: R2Bucket,
  designId: string,
  imageData: ArrayBuffer
): Promise<string> {
  const key = `designs/${designId}.png`;
  await bucket.put(key, imageData, {
    httpMetadata: { contentType: 'image/png' },
  });
  // Public URL format depends on custom domain or R2.dev subdomain
  return `https://designs.tenplusone.com/${key}`;
}
```

### Pattern 3: Printful-First Product Creation (Not Shopify-First)
**What:** Create the product in Printful, let Printful push to Shopify, then update the Shopify product with tags/collections
**When to use:** For all generative merch products
**Why:** Printful does not sync products created via the Shopify API. The product must originate in Printful.

```
1. Export design PNG from admin page
2. Upload PNG to R2 (get public URL)
3. POST to Printful API: create sync product with design URL + variant IDs
4. Printful auto-creates Shopify product (title, mockups, variants)
5. (Optional) Use Shopify Admin API to add tags, collections, description
6. Store Printful product ID + Shopify product ID in D1
```

### Anti-Patterns to Avoid
- **Creating Shopify products first, then trying to sync with Printful:** This does NOT work. Printful ignores Shopify products created outside its integration. The existing `designs.ts` does this and must be refactored.
- **Storing design images as base64 in D1:** Bloats the database, can't provide public URLs for Printful to fetch. Use R2.
- **Building custom order fulfillment logic:** The Printful Shopify app handles this automatically. Do not build webhook handlers for order routing -- just configure the app settings.
- **Using Printful API v2 for production:** v2 is still in beta. Use v1 for stability.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Order fulfillment routing | Webhook listener that forwards Shopify orders to Printful | Printful Shopify app auto-import | The app handles order detection, product matching, shipping calculation, tracking sync -- hundreds of edge cases. |
| Mockup generation | Custom Three.js mockup renders | Printful Mockup Generator API | Printful generates product mockups (t-shirt photos with design applied) automatically when you create a product. Use these for the Shopify listing. |
| Shipping rate calculation | Custom shipping logic | Printful handles via Shopify | Printful sets shipping rates through the Shopify integration. |
| Print file validation | Custom resolution/DPI checker | Printful's validation on upload | Printful validates files on product creation and returns errors if files don't meet requirements. |

**Key insight:** The entire fulfillment side (order detection, production, shipping, tracking) is handled by the Printful Shopify app with zero custom code. The only custom code needed is the product creation pipeline (design -> R2 -> Printful API).

## Common Pitfalls

### Pitfall 1: Printful Cannot Sync Shopify-API-Created Products
**What goes wrong:** You create a Shopify product via Admin API (as the current code does), but Printful has no knowledge of it. When a customer orders, Printful doesn't fulfill because the product isn't in their system.
**Why it happens:** Printful's Shopify integration only syncs products created FROM Printful TO Shopify, not the reverse.
**How to avoid:** Always create products through the Printful API first. Printful then auto-creates the Shopify product.
**Warning signs:** Products appear in Shopify but not in the Printful dashboard.

### Pitfall 2: Design Image Must Be Publicly Accessible
**What goes wrong:** Printful API rejects the product creation because it can't fetch the design file.
**Why it happens:** The current code stores images as base64 data URLs in D1 -- these are not fetchable URLs.
**How to avoid:** Upload design PNGs to R2 with public access enabled. Use the R2 public URL in the Printful API call.
**Warning signs:** Printful API returns file download errors.

### Pitfall 3: Wrong Catalog Variant IDs
**What goes wrong:** Product creation fails or creates the wrong product type.
**Why it happens:** Printful uses variant_id (not product_id) to identify specific size/color combinations. Using a product ID where a variant ID is expected creates a completely different item.
**How to avoid:** Use `GET /products/{id}` to browse the Printful catalog and find the correct variant IDs for your chosen blank product (e.g., Bella+Canvas 3001 Unisex T-Shirt). Hard-code the variant IDs for your standard product offerings.
**Warning signs:** Orders arrive with wrong sizes/colors, or product creation returns "invalid variant" errors.

### Pitfall 4: Print Area vs Export Resolution Mismatch
**What goes wrong:** Design looks cropped or scaled poorly on the printed product.
**Why it happens:** Each Printful product has specific print area dimensions (e.g., 12"x16" for standard t-shirt front). The design must match or be proportioned to fit.
**How to avoid:** Check `GET /products/variant/{id}/printfiles` for exact print area pixel dimensions. The current 3600x4800 export is 12"x16" at 300 DPI which matches standard t-shirt front placement. Verify with a test print ($15-25).
**Warning signs:** Printful warnings about file dimensions or quality.

### Pitfall 5: Printful Rate Limits and Processing Time
**What goes wrong:** Bulk product creation after multiple matches fails or times out.
**Why it happens:** Printful API has rate limits and product creation is not instant (mockup generation takes 5-30 seconds).
**How to avoid:** Create products one at a time (only 64 matches total in the World Cup). Add retry logic with exponential backoff. Don't block on mockup generation.
**Warning signs:** 429 responses from Printful API.

## Code Examples

### Example 1: Complete Design Upload + Printful Product Creation
```typescript
// Source: Printful API docs + Cloudflare R2 docs

interface PrintfulProductResult {
  printfulProductId: number;
  shopifyProductId: string; // Printful creates this automatically
  mockupUrl: string;
}

async function publishDesignToPrintful(
  env: {
    DESIGNS_BUCKET: R2Bucket;
    DB: D1Database;
    PRINTFUL_API_TOKEN: string;
  },
  designId: string,
  matchId: string,
  title: string,
  imageData: ArrayBuffer
): Promise<PrintfulProductResult> {
  // 1. Upload to R2
  const key = `designs/${designId}.png`;
  await env.DESIGNS_BUCKET.put(key, imageData, {
    httpMetadata: { contentType: 'image/png' },
  });
  const imageUrl = `https://designs.tenplusone.com/${key}`;

  // 2. Create Printful sync product
  // Bella+Canvas 3001 variant IDs for sizes S-2XL in Black
  const TSHIRT_VARIANTS = [4012, 4013, 4014, 4015, 4017]; // S, M, L, XL, 2XL

  const res = await fetch('https://api.printful.com/store/products', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.PRINTFUL_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sync_product: {
        name: title,
        thumbnail: imageUrl,
      },
      sync_variants: TSHIRT_VARIANTS.map(vid => ({
        variant_id: vid,
        retail_price: '34.99',
        files: [{
          type: 'front',
          url: imageUrl,
        }],
      })),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Printful product creation failed: ${err}`);
  }

  const data = await res.json();
  const printfulProduct = data.result;

  // 3. Store in D1
  await env.DB.prepare(`
    UPDATE designs
    SET image_url = ?, printful_product_id = ?
    WHERE id = ?
  `).bind(imageUrl, String(printfulProduct.id), designId).run();

  return {
    printfulProductId: printfulProduct.id,
    shopifyProductId: '', // Printful syncs this async -- check later
    mockupUrl: imageUrl,
  };
}
```

### Example 2: R2 Bucket Configuration
```toml
# wrangler.toml additions
[[r2_buckets]]
binding = "DESIGNS_BUCKET"
bucket_name = "tenplusone-designs"
```

### Example 3: Updated Designs Table Schema
```sql
-- Add printful columns to existing designs table
ALTER TABLE designs ADD COLUMN printful_product_id TEXT;
ALTER TABLE designs ADD COLUMN printful_sync_status TEXT DEFAULT 'pending';
-- image_url changes from base64 data URL to R2 public URL
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Printful API v1 only | v1 stable + v2 beta available | 2024 | Use v1 for production. v2 adds multi-layer designs but is unstable. |
| Shopify product -> Printful sync | Printful product -> Shopify sync | Always (this is how it works) | Must create products in Printful first. Cannot reverse-sync. |
| Manual image upload to Shopify | Printful auto-generates mockups | Native feature | Printful creates product photos with design on garment. No manual upload needed. |
| DTG standard print area | DTG "front_large" placement | May 2025 | Larger print area available. Use `front_large` in API calls for newer products. |

**Deprecated/outdated:**
- Base64 image storage in D1 (Phase 2 approach): Replace with R2 public URLs
- Direct Shopify product creation for POD items: Must go through Printful instead

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual verification + curl commands |
| Config file | None (API integration tests) |
| Quick run command | `curl http://localhost:8787/api/health` |
| Full suite command | Manual end-to-end: generate design -> upload -> verify Printful product -> verify Shopify listing |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FULF-01 | Printful integration configured and products creatable | integration | `curl -X POST http://localhost:8787/api/designs/upload ...` | Exists (needs modification) |
| FULF-02 | Design PNG uploaded to R2 and Printful product created with correct print file | integration | `curl https://api.printful.com/store/products -H "Authorization: Bearer $TOKEN"` (verify product exists) | Wave 0 |
| FULF-03 | Order auto-fulfills when customer purchases | manual-only | Place test order on Shopify, verify Printful receives it | N/A -- Printful Shopify app handles this |

### Sampling Rate
- **Per task commit:** Verify R2 upload works, verify Printful API responds
- **Per wave merge:** End-to-end: generate design -> R2 -> Printful -> verify Shopify product appears
- **Phase gate:** Place a real test order ($15-25 budget) to verify full pipeline

### Wave 0 Gaps
- [ ] `api/src/services/printful.ts` -- Printful API client
- [ ] R2 bucket creation: `wrangler r2 bucket create tenplusone-designs`
- [ ] R2 public access configuration (custom domain or r2.dev subdomain)
- [ ] Printful API token generation (Printful dashboard -> Settings -> API Access)
- [ ] Printful Shopify app installation and configuration
- [ ] Identify correct Bella+Canvas 3001 variant IDs via `GET /products/71` (or chosen blank)

## Open Questions

1. **Printful Store Type: Shopify-connected vs Manual/API**
   - What we know: Shopify-connected stores cannot create products via API. Manual/API stores can.
   - What's unclear: If we use a Manual/API store for product creation, does the auto-fulfillment from Shopify still work? Or do we need a Shopify-connected store for that?
   - Recommendation: Connect Printful to Shopify via the app for auto-fulfillment, then test whether the `POST /store/products` API endpoint works on the Shopify-connected store. If it does, great. If not, create an API-only store for product creation and use `POST /orders` directly (bypassing Shopify auto-import) for fulfillment, with a Shopify webhook that triggers Printful order creation via our backend.

2. **R2 Public Access Method**
   - What we know: R2 supports public access via custom domain or r2.dev subdomain
   - What's unclear: Which method is simpler for this use case
   - Recommendation: Use r2.dev subdomain for MVP (zero DNS config), switch to custom domain later if needed.

3. **Exact Catalog Variant IDs**
   - What we know: Need variant_id (not product_id) for each size/color combo
   - What's unclear: Which specific blank product to use (Bella+Canvas 3001 is popular but need to verify availability and pricing)
   - Recommendation: Query `GET /products` during implementation to browse catalog and select. Hard-code chosen IDs.

4. **Printful API Token Scope**
   - What we know: Private tokens authenticate API calls
   - What's unclear: Whether account-level or store-level tokens are needed for a Shopify-connected store
   - Recommendation: Generate a store-level token for the Shopify-connected store. Test during implementation.

## Sources

### Primary (HIGH confidence)
- [Printful API Documentation](https://developers.printful.com/docs/) -- endpoints for products, orders, files, mockups
- [Printful Shopify Integration](https://www.printful.com/integrations/shopify) -- how auto-sync and auto-fulfillment work
- [Printful Order Processing in Shopify](https://help.printful.com/hc/en-us/articles/6148086204316) -- auto-fulfillment configuration
- [Printful Print File Requirements](https://www.printful.com/blog/everything-you-need-to-know-to-prepare-the-perfect-printfile) -- DPI, resolution, format specs
- [Cloudflare R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-usage/) -- R2 bucket binding and upload

### Secondary (MEDIUM confidence)
- [Printful API v2 Beta](https://developers.printful.com/docs/v2-beta/) -- v2 exists but beta, use v1 for production
- [Shopify Community: Printful sync limitation](https://community.shopify.com/c/shopify-apps/push-products-to-printful-syc-store-from-shopify-api/m-p/2041311) -- confirms products created via Shopify API don't sync to Printful
- [Printful DTG print placement update](https://help.printful.com/hc/en-us/articles/19074453565852) -- front_large placement for API customers

### Tertiary (LOW confidence)
- Exact Bella+Canvas 3001 variant IDs -- need to verify via API during implementation
- R2.dev public URL format -- need to verify during R2 bucket setup
- Whether POST /store/products works on Shopify-connected stores -- conflicting information, needs hands-on testing

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Printful API v1 is stable, Shopify app integration is well-documented
- Architecture: MEDIUM - The Printful sync limitation is confirmed but the exact workaround (API store vs Shopify-connected store) needs hands-on testing
- Pitfalls: HIGH - The "can't reverse-sync" limitation is verified by multiple sources including Shopify community threads

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (Printful API v1 is stable, unlikely to change)
