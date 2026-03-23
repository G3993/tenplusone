import { createStorefrontApiClient } from '@shopify/storefront-api-client';
import { MERCH } from '../data/matches';

// --- Types ---

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  images: { edges: Array<{ node: { url: string; altText: string | null } }> };
  variants: { edges: Array<{ node: { id: string; title: string; price: { amount: string } } }> };
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

const PRODUCT_BY_HANDLE_QUERY = `#graphql
  query ProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      title
      handle
      description
      priceRange { minVariantPrice { amount currencyCode } }
      images(first: 10) { edges { node { url altText } } }
      variants(first: 20) { edges { node { id title price { amount } } } }
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

function buildMockProducts(): ShopifyProduct[] {
  return MERCH.map((m) => ({
    id: `gid://shopify/Product/${m.id}`,
    title: m.name,
    handle: m.id,
    description: m.desc,
    priceRange: {
      minVariantPrice: {
        amount: (m.price / 100).toFixed(2),
        currencyCode: 'USD',
      },
    },
    images: { edges: [] },
    variants: {
      edges: [
        {
          node: {
            id: `gid://shopify/ProductVariant/${m.id}-default`,
            title: 'Default',
            price: { amount: (m.price / 100).toFixed(2) },
          },
        },
      ],
    },
  }));
}

function buildMockCart(variantId: string, quantity: number): ShopifyCart {
  const mock = buildMockProducts().find((p) =>
    p.variants.edges.some((v) => v.node.id === variantId)
  );
  const variant = mock?.variants.edges.find((v) => v.node.id === variantId)?.node;
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

const COLLECTION_PRODUCTS_QUERY = `#graphql
  query CollectionProducts($handle: String!, $first: Int!) {
    collection(handle: $handle) {
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
  }
`;

// --- API Functions ---

export async function fetchProductsByCollection(collectionHandle: string): Promise<ShopifyProduct[]> {
  if (isMockMode) return buildMockProducts();

  const { data } = await shopifyClient!.request(COLLECTION_PRODUCTS_QUERY, {
    variables: { handle: collectionHandle, first: 20 },
  });
  return data.collection?.products.edges.map((e: { node: ShopifyProduct }) => e.node) ?? [];
}

export async function fetchProducts(): Promise<ShopifyProduct[]> {
  if (isMockMode) return buildMockProducts();

  const { data } = await shopifyClient!.request(PRODUCTS_QUERY, {
    variables: { first: 50 },
  });
  return data.products.edges.map((e: { node: ShopifyProduct }) => e.node);
}

export async function fetchProductByHandle(handle: string): Promise<ShopifyProduct | null> {
  if (isMockMode) {
    const products = buildMockProducts();
    return products.find((p) => p.handle === handle) ?? null;
  }

  const { data } = await shopifyClient!.request(PRODUCT_BY_HANDLE_QUERY, {
    variables: { handle },
  });
  return data.product ?? null;
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
