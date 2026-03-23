import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createCart, addToCart, fetchCart, type ShopifyCart, type CartLine } from '../lib/shopify';

function extractCartState(cart: ShopifyCart) {
  const items = cart.lines.edges.map((e) => e.node);
  return {
    cartId: cart.id,
    checkoutUrl: cart.checkoutUrl,
    items,
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
    total: cart.cost.totalAmount.amount,
  };
}

interface CartStore {
  cartId: string | null;
  checkoutUrl: string | null;
  items: CartLine[];
  itemCount: number;
  total: string;
  loading: boolean;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  restoreCart: () => Promise<void>;
  checkout: () => void;
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
      loading: false,

      addItem: async (variantId, quantity = 1) => {
        set({ loading: true });
        try {
          const { cartId } = get();
          const cart = cartId
            ? await addToCart(cartId, variantId, quantity)
            : await createCart(variantId, quantity);
          set({ ...extractCartState(cart), loading: false });
        } catch (err) {
          console.error('Failed to add item to cart:', err);
          set({ loading: false });
        }
      },

      restoreCart: async () => {
        const { cartId } = get();
        if (!cartId) return;
        try {
          const cart = await fetchCart(cartId);
          if (!cart) {
            set({ cartId: null });
            return;
          }
          set(extractCartState(cart));
        } catch {
          set({ cartId: null, items: [], itemCount: 0, total: '0.00' });
        }
      },

      checkout: () => {
        const { checkoutUrl } = get();
        if (checkoutUrl) {
          window.location.href = checkoutUrl;
        } else {
          alert('Mock mode: no Shopify checkout URL available. Configure .env with real Shopify credentials.');
        }
      },

      clear: () =>
        set({
          cartId: null,
          checkoutUrl: null,
          items: [],
          itemCount: 0,
          total: '0.00',
        }),
    }),
    {
      name: 'tenplusone-cart',
      partialize: (s) => ({ cartId: s.cartId }),
    }
  )
);
