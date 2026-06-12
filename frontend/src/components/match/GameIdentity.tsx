import { useMemo, useState, useEffect, useRef, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { useMatchLive } from '../../lib/useMatchLive';
import { getTeamByName } from '../../data/teams';
import { getLogoPixels } from '../../data/team-logos/index.ts';
import { MotifCrest } from '../logos/MotifCrest';
import { teamSeed } from '../logos/spectrumMotif';
import styles from './GameIdentity.module.css';

/** The match result as art: once the game is FINISHED, reveal the Game
 *  Identity — the winner's crest rendered through the stats motif, animating
 *  with the real final numbers (the engine is fed by MatchStatsPanel on the
 *  same page). Draws show one crest at a time with a slider between the two. */
export function GameIdentity({ matchId, home, away }: {
  matchId: string;
  home: string;
  away: string;
}) {
  const { stats, teams, frozen } = useMatchLive(matchId);

  const finished = frozen && stats.status === 'FINISHED';

  // Draws: which of the two identities is on stage.
  const [side, setSide] = useState<'home' | 'away'>('home');

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

  // The identity itself: the stats motif fed the shown team's REAL final
  // line — glyph counts on the crest equal the box score (2 goals = 2 balls).
  const renderCrest = (name: string, size: number) => {
    const team = getTeamByName(name);
    if (!team) return null;
    const line = teams ? (name === home ? teams.home : teams.away) : undefined;
    return (
      <Link to={`/team/${team.slug}`} className={styles.crestLink} aria-label={name}>
        <MotifCrest
          motif="stats"
          teamId={team.slug}
          seed={teamSeed(team.slug)}
          pixels={getLogoPixels(team.slug, team.name[0])}
          size={size}
          stats={line as unknown as Record<string, number>}
        />
      </Link>
    );
  };

  const shown = winnerName ?? (side === 'home' ? home : away);
  const cell = crestSize / 32;

  return (
    <section ref={wrapRef} className={styles.wrap} aria-label="game identity">
      {/* the game identity, alone on its blueprint grid */}
      <div className={styles.stage} style={{ '--cell': `${cell}px` } as CSSProperties}>
        {renderCrest(shown, crestSize)}
      </div>

      {/* draw: both teams produced an identity — slide between them */}
      {!winnerName && (
        <div className={styles.pairNav} role="tablist" aria-label="draw — both identities">
          {([['home', home], ['away', away]] as const).map(([s, name]) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={side === s}
              aria-label={name}
              className={`${styles.pairDot} ${side === s ? styles.pairDotOn : ''}`}
              onClick={() => setSide(s)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
