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
  const { stats, teams, frozen, scorers, lineup } = useMatchLive(matchId);

  const finished = frozen && stats.status === 'FINISHED';

  // The numbers that played, with scorers flagged. Prefer the real ESPN
  // lineup (who actually took the field); fall back to the full squad with
  // surname-matched scorers when there's no live lineup (simulated games).
  const rosterMap = useMemo(() => {
    const build = (name: string, sideKey: 'home' | 'away') => {
      const live = lineup.filter((p) => p.team === sideKey);
      if (live.length) {
        return live.map((p) => ({ num: p.num, scored: p.scored }));
      }
      const team = getTeamByName(name);
      const squad = team ? ROSTERS[team.slug] ?? [] : [];
      const goals = scorers.filter((s) => s.team === sideKey);
      return squad.map((p) => ({
        num: p.n,
        scored: goals.some((g) => {
          const last = fold(g.name).split(' ').pop() ?? '';
          return last.length > 2 && fold(p.name).includes(last);
        }),
      }));
    };
    return { [home]: build(home, 'home'), [away]: build(away, 'away') };
  }, [home, away, scorers, lineup]);

  // Draws: which of the two identities is on stage.
  const [side, setSide] = useState<'home' | 'away'>('home');

  // Paused by default so the logo + every stat sit in one readable frame;
  // play to run the assemble reveal + live readout animation.
  const [playing, setPlaying] = useState(false);

  // Crest render size tracks the card's real width (~72% so the logo fills
  // the grid and the stat detail is legible), snapped to multiples of 32 so
  // each logo pixel is a whole number of px — the grid pitch derives from it
  // and never warps.
  const wrapRef = useRef<HTMLElement>(null);
  const [crestSize, setCrestSize] = useState(512);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      setCrestSize(Math.max(224, Math.min(640, Math.round((w * 0.72) / 32) * 32)));
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
          still={!playing}
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
      <button
        type="button"
        className={styles.playBtn}
        onClick={() => setPlaying((p) => !p)}
        aria-label={playing ? 'pause animation' : 'play animation'}
        aria-pressed={playing}
      >
        {playing ? (
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <rect x="6" y="5" width="4" height="14" fill="currentColor" />
            <rect x="14" y="5" width="4" height="14" fill="currentColor" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path d="M7 5l12 7-12 7z" fill="currentColor" />
          </svg>
        )}
      </button>

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
