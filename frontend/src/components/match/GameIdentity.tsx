import { useMemo } from 'react';
import { Link } from 'react-router';
import { useMatchLive } from '../../lib/useMatchLive';
import { getTeamByName } from '../../data/teams';
import { getLogoPixels } from '../../data/team-logos/index.ts';
import { MotifCrest } from '../logos/MotifCrest';
import { MatchCrest3D } from './MatchCrest3D';
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

  const homeCode = getTeamByName(home)?.code ?? home;
  const awayCode = getTeamByName(away)?.code ?? away;

  // the two team logos, inside the card's scoreboard band
  const headCrest = (name: string) => {
    const team = getTeamByName(name);
    if (!team) return null;
    return (
      <Link to={`/team/${team.slug}`} className={styles.crestLink} aria-label={name}>
        <MatchCrest3D slug={team.slug} name={team.name} size={132} />
      </Link>
    );
  };

  return (
    <section className={styles.wrap} aria-label="game identity">
      {/* section 1 — the game identity itself, on the blueprint grid */}
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

      {/* section 2 — the matchup: both logos, result under them */}
      <div className={styles.headCrests}>
        {headCrest(home)}
        {headCrest(away)}
      </div>
      <div className={styles.scoreline}>
        <span className={styles.scoreTeam}>{homeCode}</span>
        <span className={styles.score}>{stats.homeGoals} – {stats.awayGoals}</span>
        <span className={styles.scoreTeam}>{awayCode}</span>
      </div>
    </section>
  );
}
