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

// Style variations of the identity — the same match box score (the stat
// overlay) riding on every logo treatment, so each match gets a unique,
// stat-driven mark in whichever style you pick.
const VARIANTS: { key: string; label: string; motif: string }[] = [
  { key: 'stats', label: 'pitch', motif: 'stats' },
  { key: 'team3d', label: '3d neon', motif: 'team3d' },
  { key: 'chrome', label: 'chrome', motif: 'chrome' },
  { key: 'lines', label: 'lines', motif: 'lines' },
  { key: 'mesh', label: 'nets', motif: 'mesh' },
  { key: 'pattern', label: 'pattern', motif: 'pattern' },
  { key: 'abstract', label: 'abstract', motif: 'abstract' },
  { key: 'internet', label: 'internet', motif: 'internet' },
  { key: 'solid', label: 'b&w', motif: 'solid' },
];

/** The match result as art: once the game is FINISHED, reveal the Game
 *  Identity — the winner's crest rendered through the stats motif, animating
 *  with the real final numbers (the engine is fed by MatchStatsPanel on the
 *  same page). Draws show one crest at a time with a slider between the two. */
export function GameIdentity({ matchId, home, away, venue }: {
  matchId: string;
  home: string;
  away: string;
  venue?: string;
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
        return live.map((p) => ({ num: p.num, scored: p.scored, starter: p.starter !== false }));
      }
      const team = getTeamByName(name);
      const squad = team ? ROSTERS[team.slug] ?? [] : [];
      const goals = scorers.filter((s) => s.team === sideKey);
      return squad.slice(0, 11).map((p) => ({
        num: p.n,
        starter: true,
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
  // which style treatment the identity is rendered in
  const [variant, setVariant] = useState('stats');
  const variantMotif = (VARIANTS.find((v) => v.key === variant) ?? VARIANTS[0]).motif;
  // where the stats live relative to the logo
  const [placement, setPlacement] = useState<'inside' | 'outside' | 'both'>('inside');

  // Crest render size tracks the card's real width (~72% so the logo fills
  // the grid and the stat detail is legible), snapped to multiples of 32 so
  // each logo pixel is a whole number of px — the grid pitch derives from it
  // and never warps.
  const wrapRef = useRef<HTMLDivElement>(null);
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
          motif={variantMotif as never}
          statsOverlay
          teamId={team.slug}
          seed={teamSeed(team.slug)}
          pixels={getLogoPixels(team.slug, team.name[0])}
          size={size}
          still={!playing}
          statPlacement={placement}
          stats={line as unknown as Record<string, number>}
          roster={rosterMap[name]}
        />
      </Link>
    );
  };

  const shown = winnerName ?? (side === 'home' ? home : away);
  const cell = crestSize / 32;

  return (
    <>
      {/* the game identity, framed, on its blueprint grid */}
      <div ref={wrapRef} className={styles.frame} aria-label="game identity">
        <div className={styles.stage} style={{ '--cell': `${cell}px` } as CSSProperties}>
          {renderCrest(shown, crestSize)}
        </div>
        {venue && <div className={styles.venue}>{venue}</div>}
      </div>

      {/* controls live OUTSIDE the grid: play/pause, draw toggle, variations */}
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.playBtn}
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? 'pause animation' : 'play animation'}
          aria-pressed={playing}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <rect x="6" y="5" width="4" height="14" fill="currentColor" />
              <rect x="14" y="5" width="4" height="14" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M7 5l12 7-12 7z" fill="currentColor" />
            </svg>
          )}
        </button>

        {/* draw: flip between both teams' identities */}
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

        {/* stat placement — inside the logo, the negative space, or both */}
        <div className={`${styles.variants} ${styles.placementRow}`} role="tablist" aria-label="stat placement">
          {(['inside', 'outside', 'both'] as const).map((p) => (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={placement === p}
              className={`${styles.variant} ${placement === p ? styles.variantOn : ''}`}
              onClick={() => setPlacement(p)}
            >
              {p}
            </button>
          ))}
        </div>

        {/* variation slider — the same match stats in every logo style */}
        <div className={styles.variants} role="tablist" aria-label="identity style">
          {VARIANTS.map((v) => (
            <button
              key={v.key}
              type="button"
              role="tab"
              aria-selected={variant === v.key}
              className={`${styles.variant} ${variant === v.key ? styles.variantOn : ''}`}
              onClick={() => setVariant(v.key)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
