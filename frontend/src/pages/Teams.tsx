import { useState, useEffect, useMemo, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { TEAMS, teamAccent } from '../data/teams';
import { GROUPS } from '../data/groups';
import { TeamLogo } from '../components/team/TeamLogo';
import { SpectrumCrest } from '../components/logos/SpectrumCrest';
import { MotifCrest, type MotifId } from '../components/logos/MotifCrest';
import { teamSeed, FRAMES } from '../components/logos/spectrumMotif';
import { getLogoPixels } from '../data/team-logos/index.ts';
import { MeshGridBG } from '../components/home/MeshGridBG';
import styles from './Teams.module.css';

const SORTED = [...TEAMS].sort((a, b) => a.name.localeCompare(b.name));

const MIN = 32;
// upper bound is responsive: + keeps growing until one crest nearly fills
// the screen (the grid collapses to a single column on the way up).
const MAX_DESKTOP = 1400;
const MAX_MOBILE = 360;

// Motif styles applied across every crest. 'off' = the plain mark; 'cycle'
// auto-rotates through all the others. spectrum/b&w/outline render via
// SpectrumCrest; the rest are ports of the generator's motifs via MotifCrest.
// (bauhaus is intentionally hidden for now; sweep/minesweeper is retired.)
type Motif = 'off' | 'cycle' | 'spectrum' | 'mono' | 'outline' | MotifId;
const MOTIFS: { key: Motif; label: string }[] = [
  { key: 'cycle', label: 'cycle' },
  { key: 'off', label: 'normal' },
  { key: 'spectrum', label: 'spectrum' },
  { key: 'mono', label: 'b&w' },
  { key: 'lines', label: 'lines' },
  { key: 'mesh', label: 'nets' },
  { key: 'cube', label: '3d' },
  { key: 'pattern', label: 'pattern' },
  { key: 'abstract', label: 'abstract' },
  { key: 'internet', label: 'internet' },
  { key: 'chrome', label: 'chrome' },
  { key: 'stats', label: 'stats' },
];

// The motifs the 'cycle' mode rotates through, in order.
const CYCLE_LIST: Motif[] = ['spectrum', 'mono', 'lines', 'mesh', 'cube', 'pattern', 'abstract', 'internet', 'chrome', 'stats'];

/** A random motif for the hover reveal — never the one already showing. */
function randomMotif(exclude: Motif): Motif {
  const pool = CYCLE_LIST.filter((m) => m !== exclude);
  return pool[Math.floor(Math.random() * pool.length)];
}

// Color treatment for the SpectrumCrest-backed motifs only.
const VARIANT: Record<'spectrum' | 'mono' | 'outline', 'spectrum' | 'mono' | 'outline'> = {
  spectrum: 'spectrum',
  mono: 'mono',
  outline: 'outline',
};
// 'mono' (b&w) now renders via the engine's `solid` renderer — the real
// reference B&W treatment (shaders/halftone/dither), not spectrum-in-grayscale.
const SPECTRUM_MOTIFS = new Set<Motif>(['spectrum', 'outline']);

function useMaxSize() {
  const get = () =>
    typeof window !== 'undefined' && window.innerWidth <= 560
      ? MAX_MOBILE
      : MAX_DESKTOP;
  const [max, setMax] = useState(get);
  useEffect(() => {
    const onResize = () => setMax(get());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return max;
}

/** Step accelerates with size so the run from grid to near-fullscreen is a
 *  handful of presses, while small sizes still adjust finely. */
const stepFor = (s: number) => (s < 300 ? 20 : s < 600 ? 60 : 140);
const DEFAULT_SIZE = 180; // desktop default crest size

export function Teams() {
  const MAX = useMaxSize();
  const [size, setSize] = useState(DEFAULT_SIZE);
  const [motif, setMotif] = useState<Motif>('cycle');
  const [shape, setShape] = useState<'square' | 'circle'>('square');
  const [group, setGroup] = useState<string>('all');
  const [frame, setFrame] = useState(0);
  const [cycleIdx, setCycleIdx] = useState(0);
  // hover reveal: the hovered team flips to a random motif
  const [hover, setHover] = useState<{ slug: string; motif: Motif } | null>(null);
  const clamped = Math.min(size, MAX);
  // Group mode: 4 teams, one row — render crests at the cap and let the grid
  // scale them to fill the full page width.
  const groupMode = group !== 'all';
  const effSize = groupMode ? MAX : clamped;

  // The motif actually rendered: 'cycle' resolves to the current step.
  const active: Motif = motif === 'cycle' ? CYCLE_LIST[cycleIdx % CYCLE_LIST.length] : motif;

  // Per-team spectrum data, computed once.
  const motifData = useMemo(
    () => Object.fromEntries(
      SORTED.map((t) => [t.slug, { pixels: getLogoPixels(t.slug, t.name[0]), seed: teamSeed(t.slug) }]),
    ),
    [],
  );

  // Cycle mode: advance to the next motif on an interval.
  useEffect(() => {
    if (motif !== 'cycle') return;
    const id = setInterval(() => setCycleIdx((i) => i + 1), 2800);
    return () => clearInterval(id);
  }, [motif]);

  // Shared animation clock — only ticks for the SpectrumCrest motifs (the
  // MotifCrest ports drive their own rAF loops).
  useEffect(() => {
    if (!SPECTRUM_MOTIFS.has(active)) return;
    const id = setInterval(() => setFrame((f) => (f + 1) % FRAMES), 110);
    return () => clearInterval(id);
  }, [active]);

  return (
    <div className={styles.wrap}>
      <MeshGridBG />
      <div className={styles.head}>
        <div className={styles.controls}>
          <div className={styles.motif}>
            {/* one toggle: shows the current pixel shape, tap to flip */}
            <button
              type="button"
              className={styles.motifBtn}
              onClick={() => setShape(shape === 'square' ? 'circle' : 'square')}
              aria-label={`pixel shape: ${shape} \u2014 switch to ${shape === 'square' ? 'circle' : 'square'}`}
            >
              {shape === 'square' ? '\u25fc' : '\u25cf'}
            </button>
          </div>
          <span className={styles.cubeWrap}>
          <select
            className={styles.select}
            value={motif}
            onChange={(e) => setMotif(e.target.value as Motif)}
            aria-label="crest style"
          >
            {MOTIFS.map((m) => (
              <option key={m.key} value={m.key}>style · {m.label}</option>
            ))}
          </select>
          </span>
          <span className={styles.cubeWrap}>
          <select
            className={styles.select}
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            aria-label="group filter"
          >
            <option value="all">all groups</option>
            {GROUPS.map((g) => (
              <option key={g.id} value={g.id}>group {g.id}</option>
            ))}
          </select>
          </span>
          <div className={styles.motif}>
            <div className={styles.motifTrack} role="group" aria-label="logo size">
              <button
                type="button"
                className={styles.motifBtn}
                onClick={() => setSize(Math.max(MIN, clamped - stepFor(clamped)))}
                disabled={clamped <= MIN}
                aria-label="decrease size"
              >
                −
              </button>
              <button
                type="button"
                className={styles.motifBtn}
                onClick={() => setSize(Math.min(MAX, clamped + stepFor(clamped)))}
                disabled={clamped >= MAX}
                aria-label="increase size"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Browse-all grid. Each tile drills into /team/<slug> where the 3D
          interactive crest lives. */}
      <div
        className={`${styles.grid} ${groupMode ? styles.gridGroup : ''}`}
        style={{ '--logo': `${effSize}px` } as CSSProperties}
      >
        {(group === 'all'
          ? SORTED
          : SORTED.filter((t) => {
              const g = GROUPS.find((x) => x.id === group);
              return g ? g.teams.includes(t.name) : true;
            })
        ).map((t) => {
          // hover reveals a random motif on just this team's crest
          const cellMotif = hover?.slug === t.slug ? hover.motif : active;
          return (
            <Link
              key={t.slug}
              to={`/team/${t.slug}`}
              className={styles.cell}
              style={{ '--accent': teamAccent(t) } as CSSProperties}
              onMouseEnter={() => setHover({ slug: t.slug, motif: randomMotif(active) })}
              onMouseLeave={() => setHover(null)}
            >
              <span className={styles.crest}>
                {cellMotif === 'off' ? (
                  <TeamLogo team={t} variant="white" size={effSize} shape={shape} />
                ) : SPECTRUM_MOTIFS.has(cellMotif) ? (
                  <SpectrumCrest
                    pixels={motifData[t.slug].pixels}
                    seed={motifData[t.slug].seed}
                    frame={frame}
                    size={effSize}
                    shape={shape}
                    variant={VARIANT[cellMotif as 'spectrum' | 'mono' | 'outline']}
                  />
                ) : (
                  <MotifCrest
                    pixels={motifData[t.slug].pixels}
                    seed={motifData[t.slug].seed}
                    size={effSize}
                    shape={shape}
                    motif={(cellMotif === 'mono' ? 'solid' : cellMotif) as MotifId}
                    teamId={t.slug}
                  />
                )}
              </span>
              <span className={styles.name}>{t.code}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
