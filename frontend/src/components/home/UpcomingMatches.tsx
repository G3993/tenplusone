import { useState } from 'react';
import { Link } from 'react-router';
import { MATCHES, type Match } from '../../data/matches';
import { getTeamByName } from '../../data/teams';
import { getLogoPixels } from '../../data/team-logos/index.ts';
import { PixelClash } from './PixelClash';
import { teamClashColors } from '../logos/motifEngine';
import { impliedProbabilities } from '../../lib/market';
import styles from './UpcomingMatches.module.css';

const ROUND_LABELS: Record<string, string> = {
  R32: 'round of 32', R16: 'round of 16', QF: 'quarterfinal',
  SF: 'semifinal', '3rd': 'third place', FIN: 'final',
};
function stageLabel(grp: string): string {
  return ROUND_LABELS[grp] ?? `group ${grp}`;
}

/** Deterministic "picks" count per match, for the live-market line. */
function picksFor(id: string): string {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); }
  const n = 600 + ((h >>> 0) % 24400);
  return n >= 1000 ? `${(n / 1000).toFixed(2)}k` : String(n);
}

// Bucket the full fixture list into day groups, preserving chronological order
// (MATCHES is already in official match-number order).
const DAYS: { date: string; games: Match[] }[] = [];
for (const m of MATCHES) {
  const last = DAYS[DAYS.length - 1];
  if (last && last.date === m.d) last.games.push(m);
  else DAYS.push({ date: m.d, games: [m] });
}

function Side({ name }: { name: string }) {
  const team = getTeamByName(name);
  // No crest here — the pixel-clash field below IS the logo treatment.
  return <span className={styles.side}><span className={styles.code}>{team?.code ?? name}</span></span>;
}

function MatchRow({ m }: { m: Match }) {
  const home = getTeamByName(m.h);
  const away = getTeamByName(m.a);
  const probs = impliedProbabilities(m.odds);
  const pct = probs.map((p) => Math.round(p * 100)) as [number, number, number];

  return (
    <Link to={`/match/${m.id}`} className={styles.match}>
      {/* PIXEL CLASH — both crests as pixel armies firing across the gap */}
      {home && away && (
        <PixelClash
          homePixels={getLogoPixels(home.slug, home.name[0])}
          awayPixels={getLogoPixels(away.slug, away.name[0])}
          homeSlug={home.slug}
          awaySlug={away.slug}
          homeColors={teamClashColors(home.slug)}
          awayColors={teamClashColors(away.slug)}
          height={300}
          className={styles.clash}
        />
      )}

      {/* team names + match info, below the clashing crests */}
      <div className={styles.teams}>
        <Side name={m.h} />
        <span className={styles.v}>v</span>
        <Side name={m.a} />
      </div>
      <div className={styles.info}>
        {[stageLabel(m.grp), m.d, m.t, m.v].filter(Boolean).join(' · ')}
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
      <div className={styles.picks}>
        <span className={styles.dot} /> live odds · {picksFor(m.id)} picks
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
