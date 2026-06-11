import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { TEAMS } from '../../data/teams';
import { GROUPS } from '../../data/groups';
import { SpectrumCrest } from '../logos/SpectrumCrest';
import { MotifCrest } from '../logos/MotifCrest';
import { TeamLogo } from '../team/TeamLogo';
import { InViewport } from '../util/InViewport';
import { Cta3D } from '../ui/Cta3D';
import { teamSeed, FRAMES } from '../logos/spectrumMotif';
import { getLogoPixels } from '../../data/team-logos/index.ts';
import styles from './HomePreview.module.css';

// Order the grid by World Cup group (A→L), then by each team's seeding within
// its group — so on the 4-up grid every row is one full group.
const GROUP_ORDER: Record<string, number> = {};
GROUPS.forEach((g, gi) => g.teams.forEach((name, ti) => { GROUP_ORDER[name] = gi * 10 + ti; }));
const SORTED = [...TEAMS].sort(
  (a, b) => (GROUP_ORDER[a.name] ?? 999) - (GROUP_ORDER[b.name] ?? 999),
);
// 'solid' = the reference B&W treatment (was spectrum-in-grayscale 'mono').
const CYCLE = ['spectrum', 'pattern', 'chrome', 'solid', 'cube', 'lines'] as const;
type CycleMotif = (typeof CYCLE)[number];
const SPECTRUM_KIND = new Set<CycleMotif>(['spectrum']);
type Mode = 'cycle' | CycleMotif;
// Easter egg: the animations the countdown-tap can land on.
const RANDOM_MODES: CycleMotif[] = ['spectrum', 'pattern', 'chrome', 'solid', 'cube', 'lines'];

export function HomePreview() {
  // The 3D crests animate the moment the page loads.
  const [mode, setMode] = useState<Mode>('cube');
  const [cycleIdx, setCycleIdx] = useState(0);
  const [frame, setFrame] = useState(0);
  // Logo size: 180px on desktop, 100px on mobile.
  const [size, setSize] = useState(180);
  const active: CycleMotif = mode === 'cycle' ? CYCLE[cycleIdx % CYCLE.length] : mode;

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 560px)');
    const apply = () => setSize(mq.matches ? 100 : 180);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // Easter egg: tapping the homepage countdown fires this → random animation.
  useEffect(() => {
    const onRandom = () => setMode(RANDOM_MODES[Math.floor(Math.random() * RANDOM_MODES.length)]);
    window.addEventListener('ifc:random-crest', onRandom);
    return () => window.removeEventListener('ifc:random-crest', onRandom);
  }, []);

  useEffect(() => {
    if (mode !== 'cycle') return;
    const id = setInterval(() => setCycleIdx((i) => i + 1), 2800);
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
      <div className={styles.teamGrid}>
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
                    <SpectrumCrest pixels={pixels} seed={seed} frame={frame} size={size} variant={active as 'spectrum'} />
                  ) : (
                    <MotifCrest pixels={pixels} seed={seed} size={size} motif={active as 'pattern' | 'chrome' | 'solid' | 'cube' | 'lines' | 'mesh'} teamId={t.slug} />
                  ))}
                </InViewport>
              </span>
              <span className={styles.teamName}>{t.name}</span>
            </Link>
          );
        })}
      </div>

      <Cta3D to="/merch">SHOP WC*26 COLLECTION</Cta3D>
    </section>
  );
}
