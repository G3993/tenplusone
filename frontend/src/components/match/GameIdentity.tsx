import { useMemo, useState, useEffect, useRef, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { useMatchLive } from '../../lib/useMatchLive';
import { getTeamByName } from '../../data/teams';
import { getLogoPixels } from '../../data/team-logos/index.ts';
import { ROSTERS } from '../../data/rosters';
import { MotifCrest } from '../logos/MotifCrest';
import { teamSeed } from '../logos/spectrumMotif';
import styles from './GameIdentity.module.css';

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** The match result as art: once the game is FINISHED, reveal the Game
 *  Identity — the winner's crest rendered through the stats motif, animating
 *  with the real final numbers (the engine is fed by MatchStatsPanel on the
 *  same page). Draws show one crest at a time with a slider between the two. */
export function GameIdentity({ matchId, home, away }: {
  matchId: string;
  home: string;
  away: string;
}) {
  const { stats, teams, frozen, scorers } = useMatchLive(matchId);

  const finished = frozen && stats.status === 'FINISHED';

  // The squads, with real scorers flagged (matched by surname against the
  // ESPN goal events) — feeds the ASCII roster layer on the identity.
  const rosterMap = useMemo(() => {
    const build = (name: string, sideKey: 'home' | 'away') => {
      const team = getTeamByName(name);
      const squad = team ? ROSTERS[team.slug] ?? [] : [];
      const goals = scorers.filter((s) => s.team === sideKey);
      return squad.map((p) => ({
        num: p.n,
        name: p.name,
        scored: goals.some((g) => {
          const last = fold(g.name).split(' ').pop() ?? '';
          return last.length > 2 && fold(p.name).includes(last);
        }),
      }));
    };
    return { [home]: build(home, 'home'), [away]: build(away, 'away') };
  }, [home, away, scorers]);

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
          roster={rosterMap[name]}
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
