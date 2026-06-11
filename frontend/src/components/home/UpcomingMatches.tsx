import { useState, useRef } from 'react';
import { MATCHES, type Match } from '../../data/matches';
import { MatchPreview } from '../matches/MatchPreview';
import { Cta3D } from '../ui/Cta3D';
import styles from './UpcomingMatches.module.css';

// Bucket the full fixture list into day groups, preserving chronological order
// (MATCHES is already in official match-number order).
const DAYS: { date: string; games: Match[] }[] = [];
for (const m of MATCHES) {
  const last = DAYS[DAYS.length - 1];
  if (last && last.date === m.d) last.games.push(m);
  else DAYS.push({ date: m.d, games: [m] });
}

export function UpcomingMatches() {
  const [di, setDi] = useState(0);
  const day = DAYS[di];

  const prev = () => setDi((i) => Math.max(0, i - 1));
  const next = () => setDi((i) => Math.min(DAYS.length - 1, i + 1));

  // Swipe left/right between dates on touch devices.
  const touchX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (dx <= -45) next();
    else if (dx >= 45) prev();
    touchX.current = null;
  };

  return (
    <section className={styles.wrap}>
      <div className={styles.head}>
        <h2 className={styles.title}>matches</h2>
      </div>

      <div className={styles.panel} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className={styles.nav}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={prev}
            disabled={di === 0}
            aria-label="previous day"
          >←</button>
          <span className={styles.navDate}>{day.date}</span>
          <button
            type="button"
            className={styles.navBtn}
            onClick={next}
            disabled={di === DAYS.length - 1}
            aria-label="next day"
          >→</button>
        </div>

        <div className={styles.matches}>
          {day.games.map((m) => <MatchPreview key={m.id} m={m} hideOdds animate />)}
        </div>
      </div>

      <Cta3D to="/wc26">ALL WC*26 MATCHES</Cta3D>
    </section>
  );
}
