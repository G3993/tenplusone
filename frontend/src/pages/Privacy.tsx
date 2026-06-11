import { Link } from 'react-router';
import styles from './Legal.module.css';

export default function Privacy() {
  return (
    <div className={styles.page}>
      <div className={styles.title}>Privacy</div>
      <div className={styles.updated}>Last updated · May 2026</div>

      <div className={styles.section}>
        <div className={styles.h2}>What we collect</div>
        <p className={styles.p}>
          Email when you subscribe or place a prediction. Order details when
          you buy merch (fulfilled by Shopify and Printful). Anonymous usage
          analytics via Vercel.
        </p>
      </div>

      <div className={styles.section}>
        <div className={styles.h2}>How we use it</div>
        <p className={styles.p}>
          To send tournament updates if you've subscribed, to fulfill orders,
          and to understand which parts of the site people use. We don't sell
          your data and we don't ship it to ad networks.
        </p>
      </div>

      <div className={styles.section}>
        <div className={styles.h2}>Cookies + local storage</div>
        <p className={styles.p}>
          We use localStorage on your device to remember your theme, cart,
          predictions, and (if you've entered one) the email you predict
          with. Nothing leaves your browser unless you've opted in.
        </p>
      </div>

      <div className={styles.section}>
        <div className={styles.h2}>Third parties</div>
        <p className={styles.p}>
          Shopify (checkout), Printful (fulfillment), Vercel (hosting +
          analytics). Each has its own privacy policy.
        </p>
      </div>

      <div className={styles.section}>
        <div className={styles.h2}>Contact</div>
        <p className={styles.p}>
          Questions? Reach us at <a href="mailto:team.internetfc@gmail.com" style={{ color: 'var(--bright)' }}>team.internetfc@gmail.com</a>.
        </p>
      </div>

      <Link to="/" className={styles.back}>← Back to home</Link>
    </div>
  );
}
