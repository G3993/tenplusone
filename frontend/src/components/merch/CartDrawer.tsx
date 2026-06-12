import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useCartStore } from '../../stores/cart';
import { sizedImage } from '../../lib/shopify';
import styles from './CartDrawer.module.css';

/** Free US shipping threshold — keep in sync with the product-page trust copy. */
const FREE_SHIP = 75;

/** Slide-over cart. Visibility lives in the cart store so the nav badge and
 *  the product page "add to cart" can both open it. */
export function CartDrawer() {
  const open = useCartStore((s) => s.open);
  const closeCart = useCartStore((s) => s.closeCart);
  const items = useCartStore((s) => s.items);
  const itemCount = useCartStore((s) => s.itemCount);
  const total = useCartStore((s) => s.total);
  const loading = useCartStore((s) => s.loading);
  const updateLine = useCartStore((s) => s.updateLine);
  const removeLine = useCartStore((s) => s.removeLine);
  const checkout = useCartStore((s) => s.checkout);
  const [checkingOut, setCheckingOut] = useState(false);

  // Lock page scroll while the drawer is open; Esc closes.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeCart(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, closeCart]);

  if (!open) return null;

  const totalNum = parseFloat(total) || 0;
  const toFreeShip = Math.max(0, FREE_SHIP - totalNum);
  const shipPct = Math.min(100, (totalNum / FREE_SHIP) * 100);

  const handleCheckout = () => {
    setCheckingOut(true);
    checkout();
    setTimeout(() => setCheckingOut(false), 3000);
  };

  return (
    <div className={styles.overlay} onClick={closeCart}>
      <aside
        className={styles.drawer}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="shopping cart"
      >
        <header className={styles.head}>
          <span className={styles.title}>
            CART{itemCount > 0 && <span className={styles.count}> · {itemCount}</span>}
          </span>
          <button className={styles.close} onClick={closeCart} aria-label="close cart">×</button>
        </header>

        {items.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyText}>your cart is empty</p>
            <Link to="/merch" className={styles.emptyLink} onClick={closeCart}>
              browse the shop →
            </Link>
          </div>
        ) : (
          <>
            <div className={styles.shipMeter} aria-label="free shipping progress">
              <div className={styles.shipText}>
                {toFreeShip > 0
                  ? <>add <span className={styles.shipAccent}>${toFreeShip.toFixed(2)}</span> for free us shipping</>
                  : <span className={styles.shipAccent}>free us shipping unlocked ✓</span>}
              </div>
              <div className={styles.shipBar}>
                <div className={styles.shipFill} style={{ width: `${shipPct}%` }} />
              </div>
            </div>

            <ul className={styles.items}>
              {items.map((item) => {
                const handle = item.merchandise.product.handle;
                const img = item.merchandise.image;
                const variant = item.merchandise.title;
                return (
                  <li key={item.id} className={styles.item}>
                    <div className={styles.thumb}>
                      {img && <img src={sizedImage(img.url, 160)} alt={img.altText ?? ''} loading="lazy" />}
                    </div>
                    <div className={styles.itemInfo}>
                      {handle ? (
                        <Link to={`/merch/${handle}`} className={styles.itemTitle} onClick={closeCart}>
                          {item.merchandise.product.title}
                        </Link>
                      ) : (
                        <span className={styles.itemTitle}>{item.merchandise.product.title}</span>
                      )}
                      {variant && variant !== 'Default Title' && (
                        <span className={styles.itemVariant}>{variant}</span>
                      )}
                      <div className={styles.itemControls}>
                        <div className={styles.qty} role="group" aria-label="quantity">
                          <button
                            className={styles.qtyBtn}
                            onClick={() => updateLine(item.id, item.quantity - 1)}
                            disabled={loading}
                            aria-label="decrease quantity"
                          >−</button>
                          <span className={styles.qtyVal}>{item.quantity}</span>
                          <button
                            className={styles.qtyBtn}
                            onClick={() => updateLine(item.id, item.quantity + 1)}
                            disabled={loading}
                            aria-label="increase quantity"
                          >+</button>
                        </div>
                        <button
                          className={styles.remove}
                          onClick={() => removeLine(item.id)}
                          disabled={loading}
                        >
                          remove
                        </button>
                      </div>
                    </div>
                    <span className={styles.itemPrice}>
                      ${parseFloat(item.cost.totalAmount.amount).toFixed(2)}
                    </span>
                  </li>
                );
              })}
            </ul>

            <footer className={styles.foot}>
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>subtotal</span>
                <span className={styles.totalValue}>
                  {loading ? '…' : `$${totalNum.toFixed(2)}`}
                </span>
              </div>
              <div className={styles.totalNote}>shipping + taxes calculated at checkout</div>
              <button
                className={styles.checkout}
                onClick={handleCheckout}
                disabled={loading || checkingOut}
              >
                {checkingOut ? 'OPENING CHECKOUT…' : 'CHECKOUT'}
              </button>
              <button className={styles.keepShopping} onClick={closeCart}>
                ← keep shopping
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
