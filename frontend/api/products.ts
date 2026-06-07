/**
 * Catalog proxy + edge cache for the shop grid.
 *
 * Paginates the Shopify Storefront API server-side with a SLIM projection
 * (no per-variant data — the grid only needs title/handle/price/images/
 * options/tags; variants are fetched on the product detail page). Returns the
 * whole catalog as one JSON blob, cached at the Vercel edge so individual
 * shoppers don't each re-paginate ~1,400 products against Shopify (which also
 * dodges Storefront API cost-throttling).
 *
 * Runs on the Vercel Edge runtime — Web APIs only.
 */
export const config = { runtime: 'edge' };

const DOMAIN = process.env.VITE_SHOPIFY_STORE_DOMAIN || 'internet-soccer-club.myshopify.com';
// Public storefront token (also shipped in the client bundle) — safe to embed.
const TOKEN = process.env.VITE_SHOPIFY_STOREFRONT_TOKEN || 'd8f0d03cc9590f558daa900d75b4036b';
const ENDPOINT = `https://${DOMAIN}/api/2025-10/graphql.json`;

// Slim grid query — deliberately omits variants(first:50) and description.
const QUERY = `#graphql
  query GridProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          id
          title
          handle
          productType
          priceRange { minVariantPrice { amount currencyCode } }
          images(first: 4) { edges { node { url altText } } }
          options { name values }
          tags
        }
      }
    }
  }
`;

export default async function handler(): Promise<Response> {
  try {
    const all: unknown[] = [];
    let after: string | null = null;
    for (let page = 0; page < 30; page++) {
      const r = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'X-Shopify-Storefront-Access-Token': TOKEN,
        },
        body: JSON.stringify({ query: QUERY, variables: { first: 250, after } }),
      });
      if (!r.ok) break;
      const j = await r.json();
      const conn = j?.data?.products;
      if (!conn) break;
      for (const e of conn.edges) all.push(e.node);
      if (!conn.pageInfo?.hasNextPage) break;
      after = conn.pageInfo.endCursor;
    }

    // If we somehow got nothing, don't cache an empty catalog.
    // Catalog changes rarely (only when we edit products + redeploy), and the
    // store is low-traffic — so cache hard at the edge to avoid cold synchronous
    // regenerations on each visit. s-maxage 1h, serve stale for a day while
    // revalidating in the background. A redeploy / product edit busts it.
    const cache = all.length
      ? 'public, s-maxage=3600, stale-while-revalidate=86400'
      : 'no-store';

    return new Response(JSON.stringify({ updatedAt: Date.now(), count: all.length, products: all }), {
      status: 200,
      headers: { 'content-type': 'application/json', 'cache-control': cache },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err), products: [] }), {
      status: 200,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    });
  }
}
