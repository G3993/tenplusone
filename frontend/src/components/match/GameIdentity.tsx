import { useMemo, useState, useEffect, useRef, type CSSProperties, type TouchEvent as ReactTouchEvent } from 'react';
import { Link } from 'react-router';
import { useMatchLive } from '../../lib/useMatchLive';
import { getTeamByName, teamAccent } from '../../data/teams';
import { getLogoPixels } from '../../data/team-logos/index.ts';
import { ROSTERS } from '../../data/rosters';
import { MotifCrest } from '../logos/MotifCrest';
import { teamClashColors } from '../logos/motifEngine';
import { teamSeed } from '../logos/spectrumMotif';
import { FIELD_CONCEPTS } from '../logos/fieldEngine';
import { FieldCanvas } from './FieldCanvas';
import { IdentityMerch } from './IdentityMerch';
import { IdentityExport } from './IdentityExport';
import { paintIdentity } from './identityPaint';

const rgbHex = (c: number[]) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
import styles from './GameIdentity.module.css';

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Style variations of the identity — the same match box score (the stat
// overlay) riding on every logo treatment, so each match gets a unique,
// stat-driven mark in whichever style you pick.
// 3D neon is the default treatment a finished match opens on (stats overlaid on
// top), then the rest of the looks. The match box score rides on every one.
const VARIANTS: { key: string; label: string; motif: string }[] = [
  { key: 'team3d', label: '3d neon', motif: 'team3d' },
  { key: 'stats', label: 'pitch', motif: 'stats' },
  { key: 'chrome', label: 'chrome', motif: 'chrome' },
  { key: 'cube', label: 'blocks', motif: 'cube' },
  { key: 'lines', label: 'lines', motif: 'lines' },
  { key: 'mesh', label: 'nets', motif: 'mesh' },
  { key: 'bauhaus', label: 'bauhaus', motif: 'bauhaus' },
  { key: 'pattern', label: 'pattern', motif: 'pattern' },
  { key: 'abstract', label: 'abstract', motif: 'abstract' },
  { key: 'internet', label: 'internet', motif: 'internet' },
  { key: 'solid', label: 'b&w', motif: 'solid' },
];

/** The match result as art: once the game is FINISHED, reveal the Game
 *  Identity — the winner's crest rendered through the stats motif, animating
 *  with the real final numbers (the engine is fed by MatchStatsPanel on the
 *  same page). Draws show one crest at a time with a slider between the two. */
export function GameIdentity({ matchId, home, away }: {
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
    const surname = (full: string) => (full.split(' ').pop() ?? full).toUpperCase();
    const build = (name: string, sideKey: 'home' | 'away') => {
      const team = getTeamByName(name);
      const squad = team ? ROSTERS[team.slug] ?? [] : [];
      const byNum = new Map(squad.map((p) => [p.n, p]));
      const live = lineup.filter((p) => p.team === sideKey);
      if (live.length) {
        return live.map((p) => {
          const sq = p.num != null ? byNum.get(p.num) : undefined;
          return { num: p.num, scored: p.scored, starter: p.starter !== false, name: sq ? surname(sq.name) : undefined };
        });
      }
      const goals = scorers.filter((s) => s.team === sideKey);
      return squad.slice(0, 11).map((p) => ({
        num: p.n,
        starter: true,
        name: surname(p.name),
        scored: goals.some((g) => {
          const last = fold(g.name).split(' ').pop() ?? '';
          return last.length > 2 && fold(p.name).includes(last);
        }),
      }));
    };
    return { [home]: build(home, 'home'), [away]: build(away, 'away') };
  }, [home, away, scorers, lineup]);


  // Paused by default so the logo + every stat sit in one readable frame;
  // play to run the assemble reveal + live readout animation.
  const [playing, setPlaying] = useState(false);
  // which style treatment the identity is rendered in
  const [variantIdx, setVariantIdx] = useState(0);
  const variantMotif = VARIANTS[variantIdx].motif;
  const stepVariant = (d: number) => setVariantIdx((i) => (i + d + VARIANTS.length) % VARIANTS.length);
  // swipe across the container to flip styles
  const touchX = useRef<number | null>(null);
  const onTouchStart = (e: ReactTouchEvent) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: ReactTouchEvent) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (dx <= -40) stepVariant(1); else if (dx >= 40) stepVariant(-1);
    touchX.current = null;
  };
  // which generative stat-field concept fills the negative space behind the logo
  const [fieldIdx, setFieldIdx] = useState(0);
  const stepField = (d: number) => setFieldIdx((i) => (i + d + FIELD_CONCEPTS.length) % FIELD_CONCEPTS.length);
  // colour mood of the field: team (cohesive) · b&w · spectrum (colourful)
  const PALETTES = ['team', 'bw', 'spectrum'] as const;
  const PALETTE_LABEL: Record<string, string> = { team: 'team', bw: 'b&w', spectrum: 'spectrum' };
  const [paletteIdx, setPaletteIdx] = useState(0);
  const paletteMode = PALETTES[paletteIdx];
  const stepPalette = (d: number) => setPaletteIdx((i) => (i + d + PALETTES.length) % PALETTES.length);

  // Crest render size tracks the card's real width — the identity is the
  // showcase, so it fills ~92% of the frame (snapped to multiples of 32 so
  // each logo pixel is a whole number of px and the grid pitch never warps).
  const wrapRef = useRef<HTMLDivElement>(null);
  const [crestSize, setCrestSize] = useState(640);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      setCrestSize(Math.max(288, Math.min(832, Math.round((w * 0.92) / 32) * 32)));
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

  // WIN → the winner's identity fills the stage alone. TIE → there is no winner
  // to single out, so both identities share the stage side by side (each at half
  // width). `shown` is the team the dock's collect/merch defaults to.
  const isDraw = !winnerName;
  const shown = winnerName ?? home;
  const shownTeam = getTeamByName(shown);
  const accent = shownTeam ? teamAccent(shownTeam) : '#1d6fe0';
  // each identity is square; a tie packs two across the frame's inner width
  const stackSize = isDraw ? Math.round(crestSize * 0.5) : crestSize;
  const cell = stackSize / 32;

  // The identity itself: the stats motif fed the shown team's REAL final
  // line — glyph counts on the crest equal the box score (2 goals = 2 balls).
  const renderCrest = (name: string, size: number) => {
    const team = getTeamByName(name);
    if (!team) return null;
    return (
      <Link to={`/team/${team.slug}`} className={styles.crestLink} aria-label={name}>
        {/* the logo is now a clean mark over the field — the field (negative
            space) carries the stats, so the crest no longer overlays glyphs */}
        <MotifCrest
          motif={variantMotif as never}
          teamId={team.slug}
          seed={teamSeed(team.slug)}
          pixels={getLogoPixels(team.slug, team.name[0])}
          size={size}
          still={!playing}
          roster={rosterMap[name]}
        />
      </Link>
    );
  };

  // One identity on stage: its stat field (behind) + its logo (on top), at the
  // given square size, with a nameplate underneath so it's always clear WHICH
  // team's identity you're looking at. Used for the single winner and for each
  // half of a tie.
  const IdentityStack = (name: string, size: number) => {
    const team = getTeamByName(name);
    const line = teams ? (name === home ? teams.home : teams.away) : undefined;
    const pixels = team ? getLogoPixels(team.slug, team.name[0]) : [];
    const colors = team ? teamClashColors(team.slug).map(rgbHex) : [];
    const tagAccent = team ? teamAccent(team) : accent;
    const isWinner = !isDraw && name === shown;
    return (
      <div className={styles.identityCol} style={{ width: size }}>
        <div className={styles.stack} style={{ width: size, height: size }}>
          <div className={styles.fieldLayer}>
            <FieldCanvas
              pixels={pixels}
              size={size}
              concept={FIELD_CONCEPTS[fieldIdx].key}
              stats={line as unknown as Record<string, number>}
              colors={colors}
              seed={team ? teamSeed(team.slug) : 1}
              roster={rosterMap[name]}
              palette={paletteMode}
              animate={playing}
            />
          </div>
          <div className={styles.crestTop}>{renderCrest(name, size)}</div>
        </div>
        <div className={styles.teamTag} style={{ '--tag': tagAccent } as CSSProperties}>
          <span className={styles.teamFlag} aria-hidden="true">{team?.flag}</span>
          <span className={styles.teamName}>{team?.name ?? name}</span>
          {isWinner && <span className={styles.teamBadge}>winner</span>}
        </div>
      </div>
    );
  };

  // Render a team's identity (current style + placement + box score) to any
  // canvas — still (no time) or a frame of the idle animation (time set). Used
  // for the merch capture and the per-team result export (PNG + loop video).
  const drawTeam = (name: string, cv: HTMLCanvasElement, capCell: number, o?: { time?: number; bg?: string }) =>
    paintIdentity(cv, {
      name, home, teams, roster: rosterMap[name], variantMotif,
      fieldConcept: FIELD_CONCEPTS[fieldIdx].key, palette: paletteMode,
      capCell, time: o?.time, bg: o?.bg,
    });
  // the merch claim captures the EXACT identity on screen (the shown team).
  const captureIdentity = (cv: HTMLCanvasElement, capCell: number) => drawTeam(shown, cv, capCell);

  const homeCode = getTeamByName(home)?.code ?? home;
  const awayCode = getTeamByName(away)?.code ?? away;
  const merchTitle = `${homeCode} ${stats.homeGoals}–${stats.awayGoals} ${awayCode} · ${shown} identity`;
  // result assets are produced for BOTH teams of the match
  const exportTeams = [{ name: home, code: homeCode }, { name: away, code: awayCode }];
  const exportBase = `${homeCode}-${stats.homeGoals}-${stats.awayGoals}-${awayCode}`;
  // Collect → take the user down to the merch store below the stats
  const scrollToMerch = () => document.getElementById('match-merch')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <>
      {/* 3D cube container, framed in the shown team's color, the identity
          grid living inside it */}
      <div
        ref={wrapRef}
        className={styles.frame}
        aria-label="game identity"
        style={{ '--team': accent } as CSSProperties}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className={styles.stage} style={{ '--cell': `${cell}px` } as CSSProperties}>
          {isDraw ? (
            // TIE: both identities share the stage, side by side
            <div className={styles.drawPair}>
              {IdentityStack(home, stackSize)}
              {IdentityStack(away, stackSize)}
            </div>
          ) : (
            IdentityStack(shown, stackSize)
          )}
        </div>
      </div>

      {/* floating dock — play/pause · download · collect */}
      <div className={styles.dock} style={{ '--team': accent } as CSSProperties}>
        <button
          type="button"
          className={styles.dockBtn}
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? 'pause' : 'play'}
          aria-pressed={playing}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <rect x="6" y="5" width="4" height="14" fill="currentColor" />
              <rect x="14" y="5" width="4" height="14" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M7 5l12 7-12 7z" fill="currentColor" />
            </svg>
          )}
        </button>
        <IdentityExport teams={exportTeams} matchId={matchId} baseName={exportBase} accent={accent} draw={drawTeam} />
        <IdentityMerch title={merchTitle} accent={accent} capture={captureIdentity} icon onShop={scrollToMerch} />
      </div>

      {/* under-grid container: the three identity controls (which-team is shown
          by the nameplate under each identity above) */}
      <div className={styles.controlsCard} style={{ '--team': accent } as CSSProperties}>
        <div className={styles.selectors}>
          {([
            ['style', VARIANTS[variantIdx].label, () => stepVariant(-1), () => stepVariant(1)],
            ['stats', FIELD_CONCEPTS[fieldIdx].label, () => stepField(-1), () => stepField(1)],
            ['colors', PALETTE_LABEL[paletteMode], () => stepPalette(-1), () => stepPalette(1)],
          ] as const).map(([label, value, prev, next]) => (
            <div key={label} className={styles.selector}>
              <span className={styles.selLabel}>{label}</span>
              <div className={styles.selCtl}>
                <button type="button" className={styles.styleArrow} onClick={prev} aria-label={`previous ${label}`}>
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <span className={styles.selValue}>{value}</span>
                <button type="button" className={styles.styleArrow} onClick={next} aria-label={`next ${label}`}>
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
