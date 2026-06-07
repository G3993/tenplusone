import { useState, useEffect, useMemo } from 'react';
import type { TeamData } from '../../data/teams';
import { getLogoPixels } from '../../data/team-logos/index.ts';
import { SpectrumCrest } from '../logos/SpectrumCrest';
import { MotifCrest, type MotifId } from '../logos/MotifCrest';
import { TeamLogo } from './TeamLogo';
import { InViewport } from '../util/InViewport';
import { teamSeed, FRAMES } from '../logos/spectrumMotif';
import styles from './TeamLogoGrid.module.css';

type Opt =
  | { key: string; label: string; kind: 'normal' }
  | { key: string; label: string; kind: 'spectrum'; variant: 'spectrum' | 'mono' }
  | { key: string; label: string; kind: 'motif'; motif: MotifId };

// Six distinct crest treatments shown together so a fan sees every option at a
// glance (the hero up top swipes through the full set one at a time).
const OPTIONS: Opt[] = [
  { key: 'crest', label: 'Crest', kind: 'normal' },
  { key: 'cube', label: '3D', kind: 'motif', motif: 'cube' },
  { key: 'spectrum', label: 'Spectrum', kind: 'spectrum', variant: 'spectrum' },
  { key: 'colours', label: 'Team colours', kind: 'motif', motif: 'teamColors' },
  { key: 'lines', label: 'Lines', kind: 'motif', motif: 'lines' },
  { key: 'chrome', label: 'Chrome', kind: 'motif', motif: 'chrome' },
];

const SIZE = 176;

export function TeamLogoGrid({ team }: { team: TeamData }) {
  const pixels = useMemo(() => getLogoPixels(team.slug, team.name[0]), [team.slug, team.name]);
  const seed = useMemo(() => teamSeed(team.slug), [team.slug]);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % FRAMES), 110);
    return () => clearInterval(id);
  }, []);

  const render = (o: Opt) => {
    if (o.kind === 'normal') return <TeamLogo team={team} size={SIZE} shape="square" />;
    if (o.kind === 'spectrum') return <SpectrumCrest pixels={pixels} seed={seed} frame={frame} size={SIZE} variant={o.variant} />;
    return <MotifCrest pixels={pixels} seed={seed} size={SIZE} motif={o.motif} teamId={team.slug} />;
  };

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>{team.name}</span>
        <h2 className={styles.title}>Crest options</h2>
      </header>
      <div className={styles.grid}>
        {OPTIONS.map((o) => (
          <div key={o.key} className={styles.cell}>
            <span className={styles.crest}>
              <InViewport
                style={{ display: 'block', width: SIZE, height: SIZE }}
                fallback={<TeamLogo team={team} size={SIZE} shape="square" />}
              >
                {() => render(o)}
              </InViewport>
            </span>
            <span className={styles.label}>{o.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
