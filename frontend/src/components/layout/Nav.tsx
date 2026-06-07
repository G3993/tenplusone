import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { Wordmark } from './Wordmark';
import styles from './Nav.module.css';

const NAV_LINKS = [
  { to: '/wc26', label: 'WC*26' },
  { to: '/teams', label: 'TEAMS' },
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
      <Link to="/" className={styles.navBrand} aria-label="iFC home"><Wordmark size={18} /></Link>

      <div
        className={`${styles.backdrop} ${menuOpen ? styles.backdropOpen : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      <div className={`${styles.menu} ${menuOpen ? styles.menuOpen : ''}`}>
        {NAV_LINKS.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={`${styles.navLink} ${location.pathname === to ? styles.active : ''}`}
          >
            {label}
          </Link>
        ))}
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
