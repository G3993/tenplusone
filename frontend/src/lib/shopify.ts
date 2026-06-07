import { createStorefrontApiClient } from '@shopify/storefront-api-client';
import { MERCH } from '../data/matches';
import { MOCK_PRODUCTS, type MockProduct } from '../data/merch';

/**
 * Shopify's CDN resizes on demand via a `width` query param. Printify mockups
 * are uploaded at 2048px but rendered far smaller, so request a fit size
 * (~2x the display box for retina) to cut image transfer ~10x. Non-Shopify
 * URLs (mock catalog) are returned untouched.
 */
export function sizedImage(url: string | undefined, width: number): string | undefined {
  if (!url || !url.includes('cdn.shopify.com')) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}width=${width}`;
}

/** Adapt MOCK_PRODUCTS (data/merch.ts — the 207-piece World Cup catalog) into
 *  the ShopifyProduct shape the grid + card components consume. Used as the
 *  fallback whenever live Shopify returns an empty catalog. */
function mockToShopifyProduct(m: MockProduct): ShopifyProduct {
  const cheapest = m.variants.reduce(
    (lo, v) => (parseFloat(v.price) < parseFloat(lo.price) ? v : lo),
    m.variants[0],
  );
  return {
    id: m.id,
    title: m.title,
    handle: m.handle,
    description: m.description,
    short: m.description,
    priceRange: { minVariantPrice: { amount: cheapest.price, currencyCode: 'USD' } },
    images: { edges: m.images.map((img) => ({ node: { url: img.url, altText: img.altText } })) },
    variants: {
      edges: m.variants.map((v) => ({
        node: { id: v.id, title: v.title, price: { amount: v.price } },
      })),
    },
  };
}

function buildMerchMockProducts(): ShopifyProduct[] {
  return MOCK_PRODUCTS.map(mockToShopifyProduct);
}

// --- Types ---

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  /** Omitted from the slim grid query; present on the product detail page. */
  description?: string;
  /** Short blurb for product cards. Falls back to first line of description. */
  short?: string;
  /** Structured spec table for the product detail page. */
  specs?: Array<{ label: string; value: string }>;
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  images: { edges: Array<{ node: { url: string; altText: string | null } }> };
  /** Shopify product type (e.g. "T-Shirt", "Hoodie") — used for the category/default filter. */
  productType?: string;
  /** Omitted from the slim grid query (fetched per product on the detail page). */
  variants?: { edges: Array<{ node: { id: string; title: string; price: { amount: string }; availableForSale?: boolean; image?: { url: string; altText: string | null } | null; selectedOptions?: Array<{ name: string; value: string }> } }> };
  /** Variant option sets (e.g. Color, Size) — used for shop filtering. */
  options?: Array<{ name: string; values: string[] }>;
  tags?: string[];
}

export interface CartLine {
  id: string;
  quantity: number;
  merchandise: { id: string; title: string; product: { title: string } };
  cost: { totalAmount: { amount: string; currencyCode: string } };
}

export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  lines: { edges: Array<{ node: CartLine }> };
  cost: { totalAmount: { amount: string; currencyCode: string } };
}

// --- Mock mode detection ---

const SHOPIFY_TOKEN = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN;
const SHOPIFY_DOMAIN = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN;
const isMockMode = !SHOPIFY_TOKEN || SHOPIFY_TOKEN === 'your-storefront-api-public-access-token';

// --- Client (only created when real token is available) ---

const shopifyClient = isMockMode
  ? null
  : createStorefrontApiClient({
      storeDomain: `https://${SHOPIFY_DOMAIN}`,
      apiVersion: '2025-10',
      publicAccessToken: SHOPIFY_TOKEN,
    });

export { shopifyClient };

// --- GraphQL Queries ---

// Slim catalog query for the SHOP GRID. Omits variants(first: 50) and
// description — the grid only needs title/handle/price/images/options/tags.
// Dropping variants cuts the payload ~15-20x and avoids Storefront cost
// throttling. Full variant data is fetched per product on the detail page.
const PRODUCTS_GRID_QUERY = `#graphql
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

const PRODUCT_BY_HANDLE_QUERY = `#graphql
  query ProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      title
      handle
      description
      priceRange { minVariantPrice { amount currencyCode } }
      images(first: 10) { edges { node { url altText } } }
      variants(first: 100) {
        edges {
          node {
            id
            title
            price { amount }
            availableForSale
            selectedOptions { name value }
          }
        }
      }
    }
  }
`;

const CART_CREATE_MUTATION = `#graphql
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        lines(first: 50) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  product { title }
                }
              }
              cost { totalAmount { amount currencyCode } }
            }
          }
        }
        cost { totalAmount { amount currencyCode } }
      }
      userErrors { field message }
    }
  }
`;

const CART_LINES_ADD_MUTATION = `#graphql
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl
        lines(first: 50) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  product { title }
                }
              }
              cost { totalAmount { amount currencyCode } }
            }
          }
        }
        cost { totalAmount { amount currencyCode } }
      }
      userErrors { field message }
    }
  }
`;

const CART_QUERY = `#graphql
  query Cart($cartId: ID!) {
    cart(id: $cartId) {
      id
      checkoutUrl
      lines(first: 50) {
        edges {
          node {
            id
            quantity
            merchandise {
              ... on ProductVariant {
                id
                title
                product { title }
              }
            }
            cost { totalAmount { amount currencyCode } }
          }
        }
      }
      cost { totalAmount { amount currencyCode } }
    }
  }
`;

// --- Mock data (fallback when no Shopify token) ---

/** Build size variants for apparel (each priced at base); single Default for everything else. */
function variantsFor(id: string, name: string, basePrice: string) {
  const apparel = /(tee|jersey|cap|scarf|hoodie|short|sock|beanie)/i.test(name);
  if (apparel) {
    const sizes = name.toLowerCase().includes('cap') || name.toLowerCase().includes('scarf')
      ? ['One Size']
      : ['S', 'M', 'L', 'XL'];
    return sizes.map((size, i) => ({
      node: {
        id: `gid://shopify/ProductVariant/${id}-v${i + 1}`,
        title: size,
        price: { amount: basePrice },
      },
    }));
  }
  return [
    {
      node: {
        id: `gid://shopify/ProductVariant/${id}-default`,
        title: 'Default',
        price: { amount: basePrice },
      },
    },
  ];
}

function buildMockProducts(): ShopifyProduct[] {
  return MERCH.map((m) => {
    const basePrice = (m.price / 100).toFixed(2);
    return {
      id: `gid://shopify/Product/${m.id}`,
      title: m.name,
      handle: m.id,
      description: m.desc,
      short: m.short,
      specs: m.specs,
      priceRange: {
        minVariantPrice: { amount: basePrice, currencyCode: 'USD' },
      },
      images: { edges: [] },
      variants: { edges: variantsFor(m.id, m.name, basePrice) },
    };
  });
}

function buildMockCart(variantId: string, quantity: number): ShopifyCart {
  const mock = buildMockProducts().find((p) =>
    (p.variants?.edges ?? []).some((v) => v.node.id === variantId)
  );
  const variant = mock?.variants?.edges.find((v) => v.node.id === variantId)?.node;
  const amount = variant ? (parseFloat(variant.price.amount) * quantity).toFixed(2) : '0.00';

  return {
    id: `mock-cart-${Date.now()}`,
    checkoutUrl: '',
    lines: {
      edges: [
        {
          node: {
            id: `mock-line-${Date.now()}`,
            quantity,
            merchandise: {
              id: variantId,
              title: variant?.title ?? 'Default',
              product: { title: mock?.title ?? 'Unknown' },
            },
            cost: { totalAmount: { amount, currencyCode: 'USD' } },
          },
        },
      ],
    },
    cost: { totalAmount: { amount, currencyCode: 'USD' } },
  };
}

// Mutable mock cart state for accumulation
let mockCartState: ShopifyCart | null = null;

// --- Collection Query ---

// --- API Functions ---

/** Products for one nation's closet. This store has no per-team collections —
 *  every product is tagged with its team slug (e.g. "south-africa") and code
 *  (e.g. "rsa"). So we filter the edge-cached catalog by tag rather than
 *  querying a collection handle (which doesn't exist and returns nothing). */
export async function fetchProductsByTeam(teamSlug: string): Promise<ShopifyProduct[]> {
  if (isMockMode) return buildMockProducts();

  const slug = teamSlug.toLowerCase();
  const all = await fetchProducts();
  return all.filter((p) => (p.tags ?? []).some((t) => t.toLowerCase() === slug));
}

// In-memory catalog cache for the session. The shop catalog rarely changes, so
// once we've fetched it, repeat visits to /merch (and team pages) are instant
// instead of re-fetching + re-parsing ~190KB every navigation. Cleared on full
// page reload (which is also when a fresh deploy lands).
let catalogCache: ShopifyProduct[] | null = null;

export async function fetchProducts(): Promise<ShopifyProduct[]> {
  if (isMockMode) return buildMerchMockProducts();
  if (catalogCache) return catalogCache;

  // Primary path: the edge-cached slim catalog (/api/products). One request,
  // cached at Vercel, so shoppers don't each re-paginate the catalog against
  // Shopify. In local dev /api/products returns index.html (SPA rewrite) —
  // JSON.parse throws and we fall through to the direct path.
  try {
    const res = await fetch('/api/products');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.products) && data.products.length) {
        catalogCache = data.products as ShopifyProduct[];
        return catalogCache;
      }
    }
  } catch {
    /* fall through to the direct Storefront query */
  }

  // Fallback: paginate the Storefront API directly with the SLIM grid query
  // (no per-variant data) so the grid and team filter still see everything.
  try {
    const all: ShopifyProduct[] = [];
    let after: string | null = null;
    for (let page = 0; page < 30; page++) {
      const res = await shopifyClient!.request(PRODUCTS_GRID_QUERY, {
        variables: { first: 250, after },
      });
      const conn: any = res?.data?.products;
      if (!conn) break;
      all.push(...conn.edges.map((e: { node: ShopifyProduct }) => e.node));
      if (!conn.pageInfo?.hasNextPage) break;
      after = conn.pageInfo.endCursor;
    }
    catalogCache = all;
    return all;
  } catch (err) {
    console.warn('[shopify] fetchProducts failed:', err);
    return [];
  }
}

export async function fetchProductByHandle(handle: string): Promise<ShopifyProduct | null> {
  if (isMockMode) {
    return (
      buildMockProducts().find((p) => p.handle === handle)
      ?? buildMerchMockProducts().find((p) => p.handle === handle)
      ?? null
    );
  }

  try {
    const { data } = await shopifyClient!.request(PRODUCT_BY_HANDLE_QUERY, {
      variables: { handle },
    });
    return data.product ?? null;
  } catch (err) {
    console.warn('[shopify] fetchProductByHandle failed:', err);
    return null;
  }
}

export async function createCart(variantId: string, quantity: number): Promise<ShopifyCart> {
  if (isMockMode) {
    mockCartState = buildMockCart(variantId, quantity);
    return mockCartState;
  }

  const { data } = await shopifyClient!.request(CART_CREATE_MUTATION, {
    variables: {
      input: {
        lines: [{ merchandiseId: variantId, quantity }],
      },
    },
  });
  return data.cartCreate.cart;
}

export async function addToCart(cartId: string, variantId: string, quantity: number): Promise<ShopifyCart> {
  if (isMockMode) {
    // Append to mock cart
    const newLine = buildMockCart(variantId, quantity).lines.edges[0];
    if (mockCartState) {
      mockCartState.lines.edges.push(newLine);
      const total = mockCartState.lines.edges.reduce(
        (sum, e) => sum + parseFloat(e.node.cost.totalAmount.amount),
        0
      );
      mockCartState.cost.totalAmount.amount = total.toFixed(2);
    } else {
      mockCartState = buildMockCart(variantId, quantity);
      mockCartState.id = cartId;
    }
    return mockCartState;
  }

  const { data } = await shopifyClient!.request(CART_LINES_ADD_MUTATION, {
    variables: {
      cartId,
      lines: [{ merchandiseId: variantId, quantity }],
    },
  });
  return data.cartLinesAdd.cart;
}

export async function fetchCart(cartId: string): Promise<ShopifyCart | null> {
  if (isMockMode) {
    if (mockCartState && mockCartState.id === cartId) return mockCartState;
    return null;
  }

  const { data } = await shopifyClient!.request(CART_QUERY, {
    variables: { cartId },
  });
  return data.cart ?? null;
}
