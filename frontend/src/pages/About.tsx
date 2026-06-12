import { Link } from 'react-router';
import styles from './Legal.module.css';

export default function About() {
  return (
    <div className={styles.page} style={{ textAlign: 'center' }}>
      <img
        src="/ifc-cube.gif"
        alt="iFC"
        width={200}
        height={200}
        style={{ display: 'block', margin: '0 auto 28px', imageRendering: 'pixelated' }}
      />
      <div className={styles.title}>about iFC</div>
      <div className={styles.updated}>internet football club &middot; est. 2026</div>

      <div className={styles.section}>
        <p className={styles.p}>
          We champion futbol culture, play by play, pixel by pixel. Every match
          generates unique symbols made from real game stats and results. Every
          game is celebrated and remembered in a unique artifact driven by the
          real-game stats. No two symbols are ever the same, no match is ever
          the same. Data-driven symbols of the game we love, one pixel at a time.
        </p>
      </div>

      <Link to="/" className={styles.back}>&larr; back to home</Link>
    </div>
  );
}
