import { useEffect, useMemo } from 'react';
import { useMatchLive, type TeamStatLine } from '../../lib/useMatchLive';
import { setMatchStats } from '../logos/motifEngine';
import { getTeamByName } from '../../data/teams';
import { getLogoPixels } from '../../data/team-logos/index.ts';
import { MotifCrest } from '../logos/MotifCrest';
import { teamSeed } from '../logos/spectrumMotif';
import styles from './MatchStatsPanel.module.css';

/** The 11 attributes that drive the art, in display order. */
const ROWS: { key: keyof TeamStatLine; label: string; pct?: boolean }[] = [
  { key: 'goals', label: 'Goals' },
  { key: 'shots', label: 'Shots' },
  { key: 'shotsOnTarget', label: 'Shots on target' },
  { key: 'possession', label: 'Possession', pct: true },
  { key: 'passes', label: 'Passes' },
  { key: 'passAccuracy', label: 'Pass accuracy', pct: true },
  { key: 'fouls', label: 'Fouls' },
  { key: 'yellowCards', label: 'Yellow cards' },
  { key: 'redCards', label: 'Red cards' },
  { key: 'offsides', label: 'Offsides' },
  { key: 'corners', label: 'Corners' },
];

/** Live win probability from the pre-match odds prior, shifted by the score
 *  and squeezed as the clock runs down. */
function winProb(odds: [number, number, number], home: number, away: number, minute: number) {
  const inv = odds.map((o) => 1 / o);
  const z = inv[0] + inv[1] + inv[2];
  let [ph, pd, pa] = [inv[0] / z, inv[1] / z, inv[2] / z];
  const diff = home - away;
  const lateness = minute / 90;
  // each goal of lead swings belief, harder the later it is
  const swing = diff * (0.28 + 0.5 * lateness);
  ph = Math.max(0.001, ph + swing);
  pa = Math.max(0.001, pa - swing);
  // a draw scoreline late keeps the draw alive; a lead kills it
  pd = Math.max(0.002, pd * (diff === 0 ? 1 + lateness * 0.8 : 1 - lateness));
  const t = ph + pd + pa;
  return { home: ph / t, draw: pd / t, away: pa / t };
}

const fmtPct = (p: number) => `${Math.round(p * 1000) / 10}%`;

export function MatchStatsPanel({ matchId, home, away, odds }: {
  matchId: string;
  home: string;
  away: string;
  odds: [number, number, number];
}) {
  const { teams, stats, minute, frozen } = useMatchLive(matchId);
  const homeTeam = getTeamByName(home);
  const awayTeam = getTeamByName(away);

  const prob = useMemo(
    () => winProb(odds, stats.homeGoals, stats.awayGoals, minute),
    [odds, stats.homeGoals, stats.awayGoals, minute],
  );

  // Feed the live numbers into the motif engine so every crest on this page
  // (including the big header pair) colors and morphs with the match.
  useEffect(() => {
    setMatchStats({
      goals: stats.homeGoals + stats.awayGoals,
      shots: stats.shots ?? 0,
      cards: stats.cards ?? 0,
      possession: stats.possession ?? 50,
    });
  }, [stats]);
  useEffect(() => () => setMatchStats(undefined), []);

  if (!teams) return null;

  const crest = (team: ReturnType<typeof getTeamByName>, fallback: string) =>
    team ? (
      <MotifCrest
        still
        motif="team3d"
        teamId={team.slug}
        seed={teamSeed(team.slug)}
        pixels={getLogoPixels(team.slug, team.name[0])}
        size={34}
      />
    ) : (
      <span>{fallback}</span>
    );

  return (
    <section className={styles.panel} aria-label="live team stats">
      <h3 className={styles.head}>
        live win probability
        <span className={styles.clock}>{frozen ? 'FT' : `${minute}'`}</span>
      </h3>

      <div className={styles.probRow}>
        <span className={styles.probSide}>
          <span className={styles.probName}>{home}</span>
          <span className={`${styles.probVal} ${styles.probHome}`}>{fmtPct(prob.home)}</span>
        </span>
        <span className={styles.probMid}>
          <span className={styles.probName}>draw</span>
          <span className={styles.probVal}>{fmtPct(prob.draw)}</span>
        </span>
        <span className={`${styles.probSide} ${styles.probRight}`}>
          <span className={styles.probName}>{away}</span>
          <span className={`${styles.probVal} ${styles.probAway}`}>{fmtPct(prob.away)}</span>
        </span>
      </div>
      <div className={styles.probBar} aria-hidden="true">
        <span className={styles.probBarHome} style={{ width: `${prob.home * 100}%` }} />
        <span className={styles.probBarDraw} style={{ width: `${prob.draw * 100}%` }} />
        <span className={styles.probBarAway} style={{ width: `${prob.away * 100}%` }} />
      </div>

      <div className={styles.statHead}>
        <span className={styles.statCrest}>{crest(homeTeam, home)}</span>
        <span className={styles.statTitle}>team stats</span>
        <span className={styles.statCrest}>{crest(awayTeam, away)}</span>
      </div>

      <ul className={styles.rows}>
        {ROWS.map(({ key, label, pct }) => {
          const h = teams.home[key];
          const a = teams.away[key];
          const fmt = (v: number) => (pct ? `${v}%` : `${v}`);
          // cards/fouls: fewer is better; everything else: more is better
          const lowerWins = key === 'fouls' || key === 'yellowCards' || key === 'redCards';
          const homeLeads = lowerWins ? h < a : h > a;
          const awayLeads = lowerWins ? a < h : a > h;
          return (
            <li key={key} className={styles.row}>
              <span className={`${styles.val} ${homeLeads ? styles.lead : ''}`}>{fmt(h)}</span>
              <span className={styles.label}>{label}</span>
              <span className={`${styles.val} ${awayLeads ? styles.lead : ''}`}>{fmt(a)}</span>
            </li>
          );
        })}
      </ul>

      <p className={styles.note}>
        these 11 numbers drive the crest art above in real time
      </p>
    </section>
  );
}
