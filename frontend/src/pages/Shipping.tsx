import { Link } from 'react-router';
import styles from './Legal.module.css';

export default function Shipping() {
  return (
    <div className={styles.page}>
      <div className={styles.title}>shipping &amp; returns</div>
      <div className={styles.updated}>last updated &middot; may 2026</div>

      <div className={styles.section}>
        <div className={styles.h2}>how fulfillment works</div>
        <p className={styles.p}>
          every iFC item is printed on demand by partners we trust. that
          keeps the catalog tight, the inventory low, and the planet
          slightly less mad at us. the trade off is patience: orders take
          three to five business days to print before they ship.
        </p>
      </div>

      <div className={styles.section}>
        <div className={styles.h2}>shipping windows</div>
        <p className={styles.p}>
          <strong style={{ color: 'var(--bright)' }}>United States.</strong>
          {' '}standard 5 to 8 business days after print. free on orders over $75.
          express 2 to 3 days at checkout for $14.
        </p>
        <p className={styles.p}>
          <strong style={{ color: 'var(--bright)' }}>Canada &amp; Mexico.</strong>
          {' '}7 to 12 business days after print. duties &amp; taxes calculated at checkout.
        </p>
        <p className={styles.p}>
          <strong style={{ color: 'var(--bright)' }}>Rest of world.</strong>
          {' '}10 to 18 business days after print. tracked. duties paid by recipient on delivery.
        </p>
      </div>

      <div className={styles.section}>
        <div className={styles.h2}>returns</div>
        <p className={styles.p}>
          if a garment doesn&rsquo;t fit, ship it back within 30 days of
          delivery for a full refund or size swap, no questions. printing
          defects (off center crests, color drift, misaligned seams) are
          replaced on us within 60 days. email a photo to
          {' '}<a href="mailto:hello@internetfc.com" style={{ color: 'var(--bright)' }}>hello@internetfc.com</a>{' '}
          and we&rsquo;ll handle it.
        </p>
        <p className={styles.p}>
          stickers, posters, and made to order match posters are final sale
          (they&rsquo;re printed for one customer and can&rsquo;t be resold).
          we&rsquo;ll still fix any defect.
        </p>
      </div>

      <div className={styles.section}>
        <div className={styles.h2}>tracking</div>
        <p className={styles.p}>
          you&rsquo;ll get a tracking link by email the moment your order
          leaves the print facility. if it doesn&rsquo;t arrive in 7 days,
          check the spam folder, then write to us.
        </p>
      </div>

      <Link to="/" className={styles.back}>&larr; back to home</Link>
    </div>
  );
}
