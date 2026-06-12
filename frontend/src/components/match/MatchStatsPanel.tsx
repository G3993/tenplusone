import { useEffect } from 'react';
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

export function MatchStatsPanel({ matchId, home, away }: {
  matchId: string;
  home: string;
  away: string;
}) {
  const { teams, stats } = useMatchLive(matchId);
  const homeTeam = getTeamByName(home);
  const awayTeam = getTeamByName(away);
  const homeCode = homeTeam?.code ?? home;
  const awayCode = awayTeam?.code ?? away;

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
        motif="chrome"
        teamId={team.slug}
        seed={teamSeed(team.slug)}
        pixels={getLogoPixels(team.slug, team.name[0])}
        size={64}
      />
    ) : (
      <span>{fallback}</span>
    );

  return (
    <section className={styles.panel} aria-label="live team stats">
      <div className={styles.statHead}>
        <span className={styles.statCrest}>{crest(homeTeam, home)}</span>
        <span className={styles.statTitle}>
          {homeCode} {stats.homeGoals} – {stats.awayGoals} {awayCode}
        </span>
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
