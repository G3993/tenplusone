import { Link } from 'react-router';
import { FieldBanner } from '../components/layout/FieldBanner';
import styles from './Legal.module.css';

export default function About() {
  return (
    <>
    <div className={styles.page}>
      <div className={styles.title}>about iFC</div>
      <div className={styles.updated}>internet football club &middot; est. 2026</div>

      <div className={styles.section}>
        <div className={styles.h2}>one constraint, 48 nations</div>
        <p className={styles.p}>
          internet fc is a tournament you can browse, predict, and own. every
          crest in the World Cup 2026 sits on the same 45 by 45 pixel grid, with
          two pixels of padding all around. one constraint, endless variation.
          the look comes from CryptoPunks, the work comes from football, the
          internet sits where the two meet.
        </p>
      </div>

      <div className={styles.section}>
        <div className={styles.h2}>what we ship</div>
        <p className={styles.p}>
          a live tournament dashboard for the 2026 World Cup, with all 104
          fixtures, group standings, and a synthetic prediction market on every
          match. a calendar you can read at a glance. a knockout bracket that
          resolves as games end. an outright market for the trophy.
        </p>
        <p className={styles.p}>
          and a shop. small. focused. every garment carries a crest from the
          pixel system. no logo soup, no fan-tax pricing, no leftover stock.
          printed on demand by partners we trust, shipped from the country
          closest to you.
        </p>
      </div>

      <div className={styles.section}>
        <div className={styles.h2}>what we don&rsquo;t do</div>
        <p className={styles.p}>
          we don&rsquo;t take real-money wagers. we don&rsquo;t sell your data.
          we&rsquo;re not affiliated with any federation or with any club. the
          crests belong to the associations that own them; the pixels are how
          we love them.
        </p>
      </div>

      <div className={styles.section}>
        <div className={styles.h2}>built by</div>
        <p className={styles.p}>
          a small team of football obsessives and product designers. say hi at
          {' '}<a href="mailto:hello@internetfc.com" style={{ color: 'var(--bright)' }}>hello@internetfc.com</a>.
        </p>
      </div>

      <Link to="/" className={styles.back}>&larr; back to home</Link>
    </div>
    <FieldBanner />
    </>
  );
}
