import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useSlipStore } from '../../stores/slip';
import { useCartStore } from '../../stores/cart';
import { CartDrawer } from '../merch/CartDrawer';
import styles from './Nav.module.css';

const NAV_LINKS = [
  { to: '/matches', label: 'matches' },
  { to: '/groups', label: 'groups' },
  { to: '/outrights', label: 'outrights' },
  { to: '/merch', label: 'merch' },
];

export function Nav() {
  const location = useLocation();
  const betCount = useSlipStore((s) => s.bets.length);
  const cartCount = useCartStore((s) => s.itemCount);
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <>
      <nav className={styles.nav}>
        <Link to="/matches" className={styles.navBrand}>10+1</Link>

        {NAV_LINKS.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={`${styles.navLink} ${location.pathname === to ? styles.active : ''}`}
          >
            {label}
          </Link>
        ))}

        <Link
          to="/slip"
          className={`${styles.navLink} ${styles.navSlip} ${location.pathname === '/slip' ? styles.active : ''}`}
        >
          bet slip
          {betCount > 0 && <span className={styles.navBadge}>{betCount}</span>}
        </Link>

        <button
          className={`${styles.navLink} ${styles.cartBtn}`}
          onClick={() => setCartOpen(true)}
        >
          cart
          {cartCount > 0 && <span className={styles.navBadge}>{cartCount}</span>}
        </button>

        <Link to="/grid" className={styles.navGridLink}>MATCHES</Link>
      </nav>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
