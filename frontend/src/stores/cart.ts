import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  createCart,
  addToCart,
  fetchCart,
  updateCartLine,
  removeCartLine,
  type ShopifyCart,
  type CartLine,
} from '../lib/shopify';

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
  /** Cart drawer visibility — global so the nav, product page, and drawer share it. */
  open: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateLine: (lineId: string, quantity: number) => Promise<void>;
  removeLine: (lineId: string) => Promise<void>;
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
      open: false,

      openCart: () => set({ open: true }),
      closeCart: () => set({ open: false }),

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

      updateLine: async (lineId, quantity) => {
        const { cartId } = get();
        if (!cartId) return;
        if (quantity < 1) return get().removeLine(lineId);
        set({ loading: true });
        try {
          const cart = await updateCartLine(cartId, lineId, quantity);
          set({ ...extractCartState(cart), loading: false });
        } catch (err) {
          console.error('Failed to update cart line:', err);
          set({ loading: false });
        }
      },

      removeLine: async (lineId) => {
        const { cartId } = get();
        if (!cartId) return;
        set({ loading: true });
        try {
          const cart = await removeCartLine(cartId, lineId);
          set({ ...extractCartState(cart), loading: false });
        } catch (err) {
          console.error('Failed to remove cart line:', err);
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
          return;
        }
        // Mock mode: no Shopify wired yet. Surface a non-blocking toast
        // rather than the old alert() so the demo flow stays clean.
        const banner = document.createElement('div');
        banner.textContent = 'preview mode · live checkout opens once Shopify is connected';
        banner.style.cssText = [
          'position:fixed', 'left:50%', 'bottom:24px', 'transform:translateX(-50%)',
          'background:var(--surface)', 'color:var(--bright)',
          'border:1px solid var(--hairline)', 'padding:10px 16px',
          'font:13px var(--font)', 'border-radius:999px', 'z-index:9999',
        ].join(';');
        document.body.appendChild(banner);
        setTimeout(() => banner.remove(), 4500);
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
