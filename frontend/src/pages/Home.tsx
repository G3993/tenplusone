import { HomePreview } from '../components/home/HomePreview';
import { UpcomingMatches } from '../components/home/UpcomingMatches';
import { HeroCrest } from '../components/home/HeroCrest';
import { MeshGridBG } from '../components/home/MeshGridBG';
import styles from './Home.module.css';

export function Home() {
  return (
    <>
      <MeshGridBG />
      <section className={styles.heroWrap}>
        <HeroCrest />
        <h1 className={styles.brandName}>internet Football Club</h1>
        <p className={styles.tagline}>
          Futbol culture celebrated play by play, pixel by pixel.
        </p>
      </section>

      <div className={styles.home}>
        <section className={styles.wc}>
          {/* easter egg: tap the wordmark to randomize the crest animations */}
          <p
            className={styles.wcMetaName}
            style={{ cursor: 'pointer' }}
            onClick={() => window.dispatchEvent(new CustomEvent('ifc:random-crest'))}
            title="✦"
          >
            WORLDCUP*26
          </p>
        </section>
      </div>
      <HomePreview />

      <UpcomingMatches />
    </>
  );
}
