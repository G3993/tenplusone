import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { Wordmark } from './Wordmark';
import styles from './Nav.module.css';

const NAV_LINKS = [
  { to: '/wc26', label: 'WORLDCUP*26', short: 'WC*26' },
  { to: '/teams', label: 'TEAMS', short: 'TEAMS' },
];

export function Nav() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // collapse the mobile menu whenever the route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <nav className={styles.nav}>
      <Link to="/" className={styles.navBrand} aria-label="internetFC home"><Wordmark size={30} brand /></Link>

      <div
        className={`${styles.backdrop} ${menuOpen ? styles.backdropOpen : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      <div className={`${styles.menu} ${menuOpen ? styles.menuOpen : ''}`}>
        {NAV_LINKS.map(({ to, label, short }) => (
          <Link
            key={to}
            to={to}
            className={`${styles.navLink} ${location.pathname === to ? styles.active : ''}`}
          >
            <span className={styles.labelFull}>{label}</span>
            <span className={styles.labelShort}>{short}</span>
          </Link>
        ))}
        {/* SHOP rides inside the link cluster on mobile so all three read the
            same; on desktop it's restyled into the pill CTA. */}
        <Link
          to="/merch"
          className={`${styles.navLink} ${styles.shopLink} ${location.pathname === '/merch' ? styles.active : ''}`}
          onClick={() => setMenuOpen(false)}
        >
          SHOP
        </Link>
      </div>

      <Link
        to="/merch"
        className={styles.cartCta}
        onClick={() => setMenuOpen(false)}
      >
        SHOP
      </Link>

      <button
        className={styles.menuBtn}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((o) => !o)}
      >
        {menuOpen ? '×' : '≡'}
      </button>
    </nav>
  );
}
