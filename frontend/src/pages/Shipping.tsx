import { Link } from 'react-router';
import styles from './Legal.module.css';

export default function Shipping() {
  return (
    <div className={styles.page}>
      <div className={styles.title}>Shipping &amp; returns</div>
      <div className={styles.updated}>Last updated &middot; May 2026</div>

      <div className={styles.section}>
        <div className={styles.h2}>How fulfillment works</div>
        <p className={styles.p}>
          Every iFC item is printed on demand by partners we trust. That
          keeps the catalog tight, the inventory low, and the planet
          slightly less mad at us. The trade off is patience: orders take
          three to five business days to print before they ship.
        </p>
      </div>

      <div className={styles.section}>
        <div className={styles.h2}>Shipping windows</div>
        <p className={styles.p}>
          <strong style={{ color: 'var(--bright)' }}>United States.</strong>
          {' '}Standard 5 to 8 business days after print. Free on orders over $75.
          Express 2 to 3 days at checkout for $14.
        </p>
        <p className={styles.p}>
          <strong style={{ color: 'var(--bright)' }}>Canada &amp; Mexico.</strong>
          {' '}7 to 12 business days after print. Duties &amp; taxes calculated at checkout.
        </p>
        <p className={styles.p}>
          <strong style={{ color: 'var(--bright)' }}>Rest of world.</strong>
          {' '}10 to 18 business days after print. Tracked. Duties paid by recipient on delivery.
        </p>
      </div>

      <div className={styles.section}>
        <div className={styles.h2}>Returns</div>
        <p className={styles.p}>
          If a garment doesn&rsquo;t fit, ship it back within 30 days of
          delivery for a full refund or size swap, no questions. Printing
          defects (off center crests, color drift, misaligned seams) are
          replaced on us within 60 days. Email a photo to
          {' '}<a href="mailto:team.internetfc@gmail.com" style={{ color: 'var(--bright)' }}>team.internetfc@gmail.com</a>{' '}
          and we&rsquo;ll handle it.
        </p>
        <p className={styles.p}>
          Stickers, posters, and made to order match posters are final sale
          (they&rsquo;re printed for one customer and can&rsquo;t be resold).
          We&rsquo;ll still fix any defect.
        </p>
      </div>

      <div className={styles.section}>
        <div className={styles.h2}>Tracking</div>
        <p className={styles.p}>
          You&rsquo;ll get a tracking link by email the moment your order
          leaves the print facility. If it doesn&rsquo;t arrive in 7 days,
          check the spam folder, then write to us.
        </p>
      </div>

      <Link to="/" className={styles.back}>&larr; Back to home</Link>
    </div>
  );
}
