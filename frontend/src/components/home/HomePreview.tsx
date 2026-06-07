import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { TEAMS } from '../../data/teams';
import { SpectrumCrest } from '../logos/SpectrumCrest';
import { MotifCrest } from '../logos/MotifCrest';
import { TeamLogo } from '../team/TeamLogo';
import { InViewport } from '../util/InViewport';
import { teamSeed, FRAMES } from '../logos/spectrumMotif';
import { getLogoPixels } from '../../data/team-logos/index.ts';
import styles from './HomePreview.module.css';

const SORTED = [...TEAMS].sort((a, b) => a.name.localeCompare(b.name));
const CREST_DEFAULT = 140;
const CREST_MIN = 88;
const CREST_MAX = 224;
const CYCLE_MS = 2800; // dwell on each motif before swapping
// Motifs the home grid cycles through, in unison. spectrum/mono → SpectrumCrest
// (frame clock); the rest → MotifCrest (self-animating).
const CYCLE = ['spectrum', 'pattern', 'chrome', 'mono', 'cube', 'lines'] as const;
type CycleMotif = (typeof CYCLE)[number];
const SPECTRUM_KIND = new Set<CycleMotif>(['spectrum', 'mono']);

// Animation modes: 'cycle' auto-rotates; the rest pin a single animation.
type Mode = 'cycle' | CycleMotif;
// The animations the "random" button can land on.
const RANDOM_MODES: CycleMotif[] = ['spectrum', 'pattern', 'chrome', 'mono', 'cube', 'lines'];

export function HomePreview() {
  // Default to the 3D crests animating the moment the page loads.
  const [mode, setMode] = useState<Mode>('cube');
  const [cycleIdx, setCycleIdx] = useState(0);
  const [frame, setFrame] = useState(0);
  const [size, setSize] = useState(CREST_DEFAULT);
  // 'cycle' auto-rotates the list; any other mode pins that animation.
  const active: CycleMotif = mode === 'cycle' ? CYCLE[cycleIdx % CYCLE.length] : mode;

  // "random" jumps to a random animation; default is the 3D crest.
  const randomize = () => setMode(RANDOM_MODES[Math.floor(Math.random() * RANDOM_MODES.length)]);

  useEffect(() => {
    if (mode !== 'cycle') return;
    const id = setInterval(() => setCycleIdx((i) => i + 1), CYCLE_MS);
    return () => clearInterval(id);
  }, [mode]);

  // Lockstep clock for the spectrum / b&w crests (the rest self-animate via rAF).
  useEffect(() => {
    if (!SPECTRUM_KIND.has(active)) return;
    const id = setInterval(() => setFrame((f) => (f + 1) % FRAMES), 110);
    return () => clearInterval(id);
  }, [active]);

  return (
    <section className={styles.preview}>
      <div className={styles.bar}>
        <button type="button" className={styles.animBtn} onClick={randomize}>
          random
        </button>
        <span className={styles.sizer}>
          <span className={styles.sizerLabel}>crest size</span>
          <input
            type="range"
            min={CREST_MIN}
            max={CREST_MAX}
            step={4}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className={styles.slider}
            aria-label="crest size"
          />
          <span className={styles.sizerVal}>{size}px</span>
        </span>
      </div>

      <div
        className={styles.teamGrid}
        style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(${size + 72}px, 100%), 1fr))` }}
      >
        {SORTED.map((t) => {
          const pixels = getLogoPixels(t.slug, t.name[0]);
          const seed = teamSeed(t.slug);
          return (
            <Link key={t.slug} to={`/team/${t.slug}`} className={styles.teamCell}>
              <span className={styles.crestBox} style={{ width: size, height: size }}>
                <InViewport
                  style={{ display: 'block', width: size, height: size }}
                  fallback={<TeamLogo team={t} size={size} shape="square" />}
                >
                  {() => (SPECTRUM_KIND.has(active) ? (
                    <SpectrumCrest pixels={pixels} seed={seed} frame={frame} size={size} variant={active as 'spectrum' | 'mono'} />
                  ) : (
                    <MotifCrest pixels={pixels} seed={seed} size={size} motif={active as 'pattern' | 'chrome' | 'teamColors' | 'cube' | 'lines' | 'mesh'} teamId={t.slug} />
                  ))}
                </InViewport>
              </span>
              <span className={styles.teamName}>{t.name}</span>
              <span className={styles.teamCode}>{t.code}</span>
            </Link>
          );
        })}
      </div>

      <Link to="/wc26" className={styles.cta}>
        enter world cup 2026 →
      </Link>
    </section>
  );
}
