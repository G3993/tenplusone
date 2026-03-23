import { useState, useMemo } from 'react';
import { useParams } from 'react-router';
import { MATCHES } from '../data/matches.ts';
import { getTeamByName } from '../data/teams.ts';
import { matchToGenerativeConfig, type MatchStats } from '../lib/generative.ts';
import { GenerativePreview } from '../components/match/GenerativePreview.tsx';
import styles from './AdminGenerate.module.css';

const DEFAULT_STATS: MatchStats = {
  homeScore: 2,
  awayScore: 1,
  possession: [55, 45],
  shots: [12, 8],
  shotsOnTarget: [5, 3],
  corners: [6, 4],
  fouls: [10, 12],
  yellowCards: [2, 3],
  redCards: [0, 0],
};

export function AdminGenerate() {
  const { matchId } = useParams<{ matchId: string }>();
  const match = MATCHES.find((m) => m.id === matchId);

  const [homeScore, setHomeScore] = useState(DEFAULT_STATS.homeScore);
  const [awayScore, setAwayScore] = useState(DEFAULT_STATS.awayScore);
  const [homePoss, setHomePoss] = useState(DEFAULT_STATS.possession[0]);
  const [totalShots, setTotalShots] = useState(DEFAULT_STATS.shots[0] + DEFAULT_STATS.shots[1]);

  if (!match) {
    return <div className={styles.notFound}>// match not found: {matchId}</div>;
  }

  const homeTeam = getTeamByName(match.h);
  const awayTeam = getTeamByName(match.a);

  if (!homeTeam || !awayTeam) {
    return <div className={styles.notFound}>// team data not found for {match.h} or {match.a}</div>;
  }

  const stats: MatchStats = useMemo(() => ({
    homeScore,
    awayScore,
    possession: [homePoss, 100 - homePoss] as [number, number],
    shots: [Math.ceil(totalShots * 0.6), Math.floor(totalShots * 0.4)] as [number, number],
    shotsOnTarget: [Math.ceil(totalShots * 0.25), Math.floor(totalShots * 0.15)] as [number, number],
    corners: DEFAULT_STATS.corners,
    fouls: DEFAULT_STATS.fouls,
    yellowCards: DEFAULT_STATS.yellowCards,
    redCards: DEFAULT_STATS.redCards,
  }), [homeScore, awayScore, homePoss, totalShots]);

  const config = useMemo(
    () => matchToGenerativeConfig(stats, homeTeam, awayTeam, match.d),
    [stats, homeTeam, awayTeam, match.d]
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        // ADMIN: GENERATE DESIGN<br />
        // MATCH: <span>{match.h} vs {match.a}</span> | {match.d} | {match.v}
      </div>

      <div className={styles.statsForm}>
        <div className={styles.field}>
          <label>home score</label>
          <input
            type="number"
            min={0}
            max={20}
            value={homeScore}
            onChange={(e) => setHomeScore(Number(e.target.value))}
          />
        </div>
        <div className={styles.field}>
          <label>away score</label>
          <input
            type="number"
            min={0}
            max={20}
            value={awayScore}
            onChange={(e) => setAwayScore(Number(e.target.value))}
          />
        </div>
        <div className={styles.field}>
          <label>home possession %</label>
          <input
            type="number"
            min={0}
            max={100}
            value={homePoss}
            onChange={(e) => setHomePoss(Number(e.target.value))}
          />
        </div>
        <div className={styles.field}>
          <label>total shots</label>
          <input
            type="number"
            min={0}
            max={60}
            value={totalShots}
            onChange={(e) => setTotalShots(Number(e.target.value))}
          />
        </div>
      </div>

      <GenerativePreview
        matchId={matchId!}
        config={config}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
      />
    </div>
  );
}
