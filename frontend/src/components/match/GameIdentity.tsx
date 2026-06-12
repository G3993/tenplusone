import { useMemo } from 'react';
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

  return (
    <section className={styles.wrap} aria-label="game identity">
      <span className={styles.eyebrow}>
        FT · {home} {stats.homeGoals} – {stats.awayGoals} {away}
      </span>
      <h3 className={styles.title}>game identity</h3>

      <div className={styles.stage}>
        {winnerName ? (
          renderCrest(winnerName, 280)
        ) : (
          <div className={styles.drawPair}>
            {renderCrest(home, 200)}
            {renderCrest(away, 200)}
          </div>
        )}
      </div>

      {winnerName && <div className={styles.winner}>{winnerName}</div>}
      <p className={styles.note}>
        this symbol is generated from the final stats of this match.
        no other game will ever produce it.
      </p>
    </section>
  );
}
