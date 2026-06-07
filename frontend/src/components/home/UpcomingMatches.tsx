import { useState } from 'react';
import { Link } from 'react-router';
import { MATCHES, type Match } from '../../data/matches';
import { getTeamByName } from '../../data/teams';
import { getLogoPixels } from '../../data/team-logos/index.ts';
import { MotifCrest } from '../logos/MotifCrest';
import { teamSeed } from '../logos/spectrumMotif';
import { impliedProbabilities } from '../../lib/market';
import styles from './UpcomingMatches.module.css';

// Bucket the full fixture list into day groups, preserving chronological order
// (MATCHES is already in official match-number order).
const DAYS: { date: string; games: Match[] }[] = [];
for (const m of MATCHES) {
  const last = DAYS[DAYS.length - 1];
  if (last && last.date === m.d) last.games.push(m);
  else DAYS.push({ date: m.d, games: [m] });
}

/** A team crest in the static neon-3D (team3d) treatment + caps country name. */
function Crest({ name }: { name: string }) {
  const team = getTeamByName(name);
  return (
    <span className={styles.side}>
      {team ? (
        <MotifCrest
          still
          motif="team3d"
          teamId={team.slug}
          seed={teamSeed(team.slug)}
          pixels={getLogoPixels(team.slug, team.name[0])}
          size={140}
          className={styles.crest}
        />
      ) : (
        <span className={styles.slot} />
      )}
      <span className={styles.cName}>{(team?.name ?? name).toUpperCase()}</span>
    </span>
  );
}

function MatchRow({ m }: { m: Match }) {
  const home = getTeamByName(m.h);
  const away = getTeamByName(m.a);
  const probs = impliedProbabilities(m.odds);
  const pct = probs.map((p) => Math.round(p * 100)) as [number, number, number];

  return (
    <Link to={`/match/${m.id}`} className={styles.match}>
      {/* static neon-3D crests, country name in caps under each */}
      <div className={styles.teams}>
        <Crest name={m.h} />
        <span className={styles.v}>v</span>
        <Crest name={m.a} />
      </div>
      <div className={styles.info}>
        {[m.d, m.t, m.v].filter(Boolean).join(' · ')}
      </div>

      {/* live prediction signal — pixelized odds meter (32 cells, brand grid) */}
      <div className={styles.signal} aria-hidden="true">
        {(() => {
          const CELLS = 32;
          const h = Math.round(probs[0] * CELLS);
          const d = Math.round(probs[1] * CELLS);
          return Array.from({ length: CELLS }, (_, k) => {
            const cls = k < h ? styles.pxHome : k < h + d ? styles.pxDraw : styles.pxAway;
            return <span key={k} className={`${styles.px} ${cls}`} />;
          });
        })()}
      </div>
      <div className={styles.signalMeta}>
        <span className={styles.metaHome}>{home?.code ?? m.h} {pct[0]}%</span>
        <span className={styles.metaDraw}>X {pct[1]}%</span>
        <span className={styles.metaAway}>{away?.code ?? m.a} {pct[2]}%</span>
      </div>
    </Link>
  );
}

export function UpcomingMatches() {
  const [di, setDi] = useState(0);
  const day = DAYS[di];

  return (
    <section className={styles.wrap}>
      <div className={styles.head}>
        <h2 className={styles.title}>matches</h2>
        <Link to="/wc26" className={styles.all}>all 104 →</Link>
      </div>

      <div className={styles.nav}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => setDi((i) => Math.max(0, i - 1))}
          disabled={di === 0}
          aria-label="previous day"
        >←</button>
        <span className={styles.navDate}>
          {day.date}
          <span className={styles.navCount}>{day.games.length} {day.games.length === 1 ? 'match' : 'matches'}</span>
        </span>
        <button
          type="button"
          className={styles.navBtn}
          onClick={() => setDi((i) => Math.min(DAYS.length - 1, i + 1))}
          disabled={di === DAYS.length - 1}
          aria-label="next day"
        >→</button>
      </div>

      <div className={styles.matches}>
        {day.games.map((m) => <MatchRow key={m.id} m={m} />)}
      </div>
    </section>
  );
}
