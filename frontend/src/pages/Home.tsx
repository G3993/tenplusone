import { Countdown } from '../components/layout/Countdown';
import { HomePreview } from '../components/home/HomePreview';
import { UpcomingMatches } from '../components/home/UpcomingMatches';
import { HeroCrest } from '../components/home/HeroCrest';
import styles from './Home.module.css';

export function Home() {
  return (
    <>
      <section className={styles.heroWrap}>
        <HeroCrest />
        <h1 className={styles.brandName}>Internet Football Club</h1>
        <p className={styles.tagline}>
          a home for the game online — every match a one-of-one crest, styled by its own data, pixel by pixel.
        </p>
      </section>

      <div className={styles.home}>
        <section className={styles.wc}>
          <p className={styles.wcMeta}>world cup 2026 &middot; usa &middot; canada &middot; mexico</p>
          <Countdown big className={styles.wcCountdown} />
          <p className={styles.wcDrop}>[ collection drops soon ]</p>
        </section>
      </div>
      <HomePreview />

      <UpcomingMatches />
    </>
  );
}
