import { useMemo, useState, useEffect, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { useMatchLive } from '../../lib/useMatchLive';
import { getTeamByName } from '../../data/teams';
import { getLogoPixels } from '../../data/team-logos/index.ts';
import { MotifCrest } from '../logos/MotifCrest';
import { teamSeed } from '../logos/spectrumMotif';
import styles from './GameIdentity.module.css';

/** The match result as art: once the game is FINISHED, reveal the Game
 *  Identity — the winner's crest rendered with the final match stats as
 *  inputs (the engine is already fed by MatchStatsPanel, so this crest
 *  carries the real numbers of the game). Draws show both crests. */
export function GameIdentity({ matchId, home, away }: {
  matchId: string;
  home: string;
  away: string;
}) {
  const { stats, frozen } = useMatchLive(matchId);

  // Crest render size: multiples of 32 so each logo pixel is a whole number
  // of px — the blueprint grid pitch derives from it and stays locked on.
  const [crestSize, setCrestSize] = useState(384);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 560px)');
    const apply = () => setCrestSize(mq.matches ? 288 : 384);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const finished = frozen && stats.status === 'FINISHED';
  const winnerName = useMemo(() => {
    if (stats.homeGoals > stats.awayGoals) return home;
    if (stats.awayGoals > stats.homeGoals) return away;
    return null; // draw
  }, [stats.homeGoals, stats.awayGoals, home, away]);

  if (!finished) return null;

  const renderCrest = (name: string, size: number) => {
    const team = getTeamByName(name);
    if (!team) return null;
    return (
      <Link to={`/team/${team.slug}`} className={styles.crestLink} aria-label={name}>
        <MotifCrest
          motif="team3d"
          teamId={team.slug}
          seed={teamSeed(team.slug)}
          pixels={getLogoPixels(team.slug, team.name[0])}
          size={size}
        />
      </Link>
    );
  };

  const homeCode = getTeamByName(home)?.code ?? home;
  const awayCode = getTeamByName(away)?.code ?? away;

  const pairSize = crestSize - 128; // draws: two crests, still a /32 multiple
  const cell = (winnerName ? crestSize : pairSize) / 32;

  return (
    <section className={styles.wrap} aria-label="game identity">
      {/* section 1 — the game identity itself, on the blueprint grid */}
      <div className={styles.stage} style={{ '--cell': `${cell}px` } as CSSProperties}>
        {winnerName ? (
          renderCrest(winnerName, crestSize)
        ) : (
          <div className={styles.drawPair}>
            {renderCrest(home, pairSize)}
            {renderCrest(away, pairSize)}
          </div>
        )}
      </div>

      {/* section 2 — the match details, one color */}
      <div className={styles.scoreline}>
        <span>{homeCode}</span>
        <span>{stats.homeGoals} – {stats.awayGoals}</span>
        <span>{awayCode}</span>
      </div>
    </section>
  );
}
