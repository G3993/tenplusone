import { describe, it, expect } from 'vitest';
import {
  fetchProducts,
  fetchProductByHandle,
  fetchProductsByTeam,
  createCart,
  addToCart,
  fetchCart,
} from './shopify';

// With no VITE_SHOPIFY_* env vars set, the library runs in mock mode and
// must still behave exactly like the real Shopify path (same shapes), so
// the storefront, cart, and checkout flow work end to end the moment a
// real token is added.

describe('shopify storefront library (mock mode)', () => {
  it('fetchProducts returns a well-formed catalog', async () => {
    const products = await fetchProducts();
    expect(products.length).toBeGreaterThan(0);
    for (const p of products) {
      expect(p.id).toBeTruthy();
      expect(p.title).toBeTruthy();
      expect(p.handle).toBeTruthy();
      expect(Number(p.priceRange.minVariantPrice.amount)).toBeGreaterThan(0);
      expect(p.variants!.edges[0].node.id).toBeTruthy();
    }
  });

  it('fetchProductByHandle resolves a known product and rejects unknown', async () => {
    const [first] = await fetchProducts();
    const found = await fetchProductByHandle(first.handle);
    expect(found?.handle).toBe(first.handle);
    expect(await fetchProductByHandle('definitely-not-real')).toBeNull();
  });

  it('fetchProductsByTeam returns products', async () => {
    const byTeam = await fetchProductsByTeam('brazil');
    expect(Array.isArray(byTeam)).toBe(true);
    expect(byTeam.length).toBeGreaterThan(0);
  });

  it('createCart then addToCart accumulates lines and totals', async () => {
    const products = await fetchProducts();
    const v1 = products[0].variants!.edges[0].node;
    const v2 = products[1].variants!.edges[0].node;

    const cart = await createCart(v1.id, 2);
    expect(cart.id).toBeTruthy();
    expect(cart.lines.edges).toHaveLength(1);
    expect(cart.lines.edges[0].node.quantity).toBe(2);

    const expected1 = parseFloat(v1.price.amount) * 2;
    expect(parseFloat(cart.cost.totalAmount.amount)).toBeCloseTo(expected1, 2);

    const cart2 = await addToCart(cart.id, v2.id, 1);
    expect(cart2.lines.edges.length).toBe(2);
    const expectedTotal = expected1 + parseFloat(v2.price.amount) * 1;
    expect(parseFloat(cart2.cost.totalAmount.amount)).toBeCloseTo(expectedTotal, 2);
  });

  it('fetchCart returns the active cart by id', async () => {
    const products = await fetchProducts();
    const created = await createCart(products[0].variants!.edges[0].node.id, 1);
    const fetched = await fetchCart(created.id);
    expect(fetched?.id).toBe(created.id);
  });
});
