import { useState, useEffect, useMemo, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { TEAMS, teamAccent } from '../data/teams';
import { TeamLogo } from '../components/team/TeamLogo';
import { SectionHead } from '../components/layout/SectionHead';
import { SpectrumCrest } from '../components/logos/SpectrumCrest';
import { MotifCrest, type MotifId } from '../components/logos/MotifCrest';
import { teamSeed, FRAMES } from '../components/logos/spectrumMotif';
import { getLogoPixels } from '../data/team-logos/index.ts';
import styles from './Teams.module.css';

const SORTED = [...TEAMS].sort((a, b) => a.name.localeCompare(b.name));

const MIN = 32;
// upper bound is responsive: roomy on desktop, a bit tighter on phones.
const MAX_DESKTOP = 420;
const MAX_MOBILE = 320;

// Motif styles applied across every crest. 'off' = the plain mark; 'cycle'
// auto-rotates through all the others. spectrum/b&w/outline render via
// SpectrumCrest; the rest are ports of the generator's motifs via MotifCrest.
// (sweep / bauhaus / stats are intentionally hidden for now.)
type Motif = 'off' | 'cycle' | 'spectrum' | 'mono' | 'outline' | MotifId;
const MOTIFS: { key: Motif; label: string }[] = [
  { key: 'cycle', label: 'cycle' },
  { key: 'off', label: 'normal' },
  { key: 'spectrum', label: 'spectrum' },
  { key: 'mono', label: 'b&w' },
  { key: 'outline', label: 'outlines' },
  { key: 'lines', label: 'lines' },
  { key: 'mesh', label: 'nets' },
  { key: 'cube', label: '3d' },
  { key: 'teamColors', label: 'colors' },
  { key: 'pattern', label: 'pattern' },
  { key: 'abstract', label: 'abstract' },
  { key: 'internet', label: 'internet' },
  { key: 'chrome', label: 'chrome' },
];

// The motifs the 'cycle' mode rotates through, in order.
const CYCLE_LIST: Motif[] = ['spectrum', 'mono', 'outline', 'lines', 'mesh', 'cube', 'teamColors', 'pattern', 'abstract', 'internet', 'chrome'];

// Color treatment for the SpectrumCrest-backed motifs only.
const VARIANT: Record<'spectrum' | 'mono' | 'outline', 'spectrum' | 'mono' | 'outline'> = {
  spectrum: 'spectrum',
  mono: 'mono',
  outline: 'outline',
};
const SPECTRUM_MOTIFS = new Set<Motif>(['spectrum', 'mono', 'outline']);

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

export function Teams() {
  const MAX = useMaxSize();
  const [size, setSize] = useState(64);
  const [motif, setMotif] = useState<Motif>('cycle');
  const [shape, setShape] = useState<'square' | 'circle'>('square');
  const [frame, setFrame] = useState(0);
  const [cycleIdx, setCycleIdx] = useState(0);
  const clamped = Math.min(size, MAX);

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
      <div className={styles.head}>
        <SectionHead
          eyebrow="03 / NATIONS"
          title="48 nations, one rule."
          sub="every crest fit to the same pixel grid. drop two side by side and the optical weight matches, every time."
        />
        <div className={styles.controls}>
          <div className={styles.motif}>
            <span className={styles.motifLabel}>motif</span>
            <div className={styles.motifTrack} role="group" aria-label="motif style">
              {MOTIFS.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  className={`${styles.motifBtn} ${motif === m.key ? styles.motifOn : ''}`}
                  aria-pressed={motif === m.key}
                  onClick={() => setMotif(m.key)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.motif}>
            <span className={styles.motifLabel}>shape</span>
            <div className={styles.motifTrack} role="group" aria-label="pixel shape">
              {(['square', 'circle'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`${styles.motifBtn} ${shape === s ? styles.motifOn : ''}`}
                  aria-pressed={shape === s}
                  onClick={() => setShape(s)}
                >
                  {s === 'square' ? '◼ square' : '● circle'}
                </button>
              ))}
            </div>
          </div>
          <label className={styles.sizer}>
            <span className={styles.sizerLabel}>size</span>
            <input
              type="range"
              min={MIN}
              max={MAX}
              step={4}
              value={clamped}
              onChange={(e) => setSize(Number(e.target.value))}
              className={styles.slider}
              aria-label="logo size"
            />
            <span className={styles.sizerVal}>{clamped}px</span>
          </label>
        </div>
      </div>

      {/* Browse-all grid. Each tile drills into /team/<slug> where the 3D
          interactive crest lives. */}
      <div
        className={styles.grid}
        style={{ '--logo': `${clamped}px` } as CSSProperties}
      >
        {SORTED.map((t) => (
          <Link
            key={t.slug}
            to={`/team/${t.slug}`}
            className={styles.cell}
            style={{ '--accent': teamAccent(t) } as CSSProperties}
          >
            <span className={styles.crest}>
              {active === 'off' ? (
                <TeamLogo team={t} variant="white" size={clamped} shape={shape} />
              ) : SPECTRUM_MOTIFS.has(active) ? (
                <SpectrumCrest
                  pixels={motifData[t.slug].pixels}
                  seed={motifData[t.slug].seed}
                  frame={frame}
                  size={clamped}
                  shape={shape}
                  variant={VARIANT[active as 'spectrum' | 'mono' | 'outline']}
                />
              ) : (
                <MotifCrest
                  pixels={motifData[t.slug].pixels}
                  seed={motifData[t.slug].seed}
                  size={clamped}
                  shape={shape}
                  motif={active as MotifId}
                  teamId={t.slug}
                />
              )}
            </span>
            <span className={styles.name}>{t.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
