import { useMemo, useState, useEffect, useRef, type CSSProperties } from 'react';
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

  // Crest render size tracks the card's real width (~53%, the 384-in-720
  // proportion), snapped to multiples of 32 so each logo pixel is a whole
  // number of px — the grid pitch derives from it and never warps.
  const wrapRef = useRef<HTMLElement>(null);
  const [crestSize, setCrestSize] = useState(384);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      setCrestSize(Math.max(160, Math.min(384, Math.round((w * 0.533) / 32) * 32)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [finished]);
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

  const pairSize = Math.max(96, crestSize - 128); // draws: two crests, /32 multiple
  const cell = (winnerName ? crestSize : pairSize) / 32;

  return (
    <section ref={wrapRef} className={styles.wrap} aria-label="game identity">
      {/* the game identity, alone on its blueprint grid */}
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
    </section>
  );
}
