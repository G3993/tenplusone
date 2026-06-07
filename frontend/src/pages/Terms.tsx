import { Link } from 'react-router';
import styles from './Legal.module.css';

export default function Terms() {
  return (
    <div className={styles.page}>
      <div className={styles.title}>terms</div>
      <div className={styles.updated}>last updated · may 2026</div>

      <div className={styles.section}>
        <div className={styles.h2}>using the site</div>
        <p className={styles.p}>
          internet fc (iFC) is an independent fan project covering the 2026
          World Cup. We're not affiliated with any federation or club. Markets,
          charts, and predictions on this site are for entertainment; nothing
          here is financial or wagering advice.
        </p>
      </div>

      <div className={styles.section}>
        <div className={styles.h2}>predictions</div>
        <p className={styles.p}>
          The predictions feature is a free game-of-skill. No money changes
          hands inside iFC. Winners may receive discount codes for the merch
          store. Subject to change before kickoff.
        </p>
      </div>

      <div className={styles.section}>
        <div className={styles.h2}>merch</div>
        <p className={styles.p}>
          Products are fulfilled by Printful through Shopify. Standard
          Shopify checkout terms apply. Returns are handled per the policy
          shown at checkout.
        </p>
      </div>

      <div className={styles.section}>
        <div className={styles.h2}>content</div>
        <p className={styles.p}>
          Crests, names, and marks of national teams belong to their
          respective associations. Use here is editorial. Our pixel art and
          original copy are © internet fc.
        </p>
      </div>

      <Link to="/" className={styles.back}>← back to home</Link>
    </div>
  );
}
