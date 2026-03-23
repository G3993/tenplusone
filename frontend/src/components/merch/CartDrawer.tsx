import { useState } from 'react';
import { useCartStore } from '../../stores/cart';
import { Line, Blank, useLineCounter } from '../layout/Line';
import styles from './CartDrawer.module.css';

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nextLn = useLineCounter();
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total);
  const loading = useCartStore((s) => s.loading);
  const checkout = useCartStore((s) => s.checkout);
  const clear = useCartStore((s) => s.clear);
  const [checkingOut, setCheckingOut] = useState(false);

  if (!open) return null;

  const handleCheckout = () => {
    setCheckingOut(true);
    setTimeout(() => {
      checkout();
      setCheckingOut(false);
    }, 800);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <Line n={nextLn()}>
          <span className="comment">{'# cart'}</span>
          <button className={styles.closeBtn} onClick={onClose}>[close]</button>
        </Line>
        <Blank n={nextLn()} />

        {loading && (
          <Line n={nextLn()}>
            <span className="dim">updating cart...</span>
          </Line>
        )}

        {items.length === 0 && !loading ? (
          <Line n={nextLn()}>
            <span className="dim">cart is empty.</span>
          </Line>
        ) : (
          <>
            {items.map((item) => (
              <div key={item.id}>
                <Line n={nextLn()}>
                  <span className="bright">{item.merchandise.product.title}</span>
                </Line>
                <Line n={nextLn()}>
                  <span className="dim">
                    {item.merchandise.title} x{item.quantity} &mdash; $
                    {parseFloat(item.cost.totalAmount.amount).toFixed(2)}
                  </span>
                </Line>
              </div>
            ))}

            <Blank n={nextLn()} />
            <Line n={nextLn()}>
              <span className="comment">{'# ---------------------------------'}</span>
            </Line>
            <Line n={nextLn()}>
              <span className="dim">total: </span>
              <span className="bright">${parseFloat(total).toFixed(2)}</span>
            </Line>
            <Blank n={nextLn()} />

            {checkingOut ? (
              <Line n={nextLn()}>
                <span className="dim">proceeding to secure checkout...</span>
              </Line>
            ) : (
              <>
                <Line n={nextLn()}>
                  <button className={styles.cmdBtn} onClick={handleCheckout}>
                    CHECKOUT
                  </button>
                </Line>
                <Blank n={nextLn()} />
                <Line n={nextLn()}>
                  <button className={styles.clearBtn} onClick={clear}>
                    [clear cart]
                  </button>
                </Line>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
