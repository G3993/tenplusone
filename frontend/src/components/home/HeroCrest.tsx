import { useState, useEffect } from 'react';
import { MotifCrest } from '../logos/MotifCrest';
import { teamSeed } from '../logos/spectrumMotif';
import { getLogoPixels } from '../../data/team-logos/index.ts';
import { TEAMS } from '../../data/teams';
import styles from './HeroCrest.module.css';

const ROSTER = [...TEAMS];
const CYCLE_MS = 2600; // dwell on each nation's 3D crest

function heroSize(): number {
  if (typeof window === 'undefined') return 320;
  return Math.round(Math.min(420, Math.max(240, window.innerWidth * 0.6)));
}

/** Hero showcase: a large crest spinning in the 3D ("cube") motif, cycling
 *  through every nation. Replaces the pre-rendered spectrum reel. */
export function HeroCrest() {
  const [i, setI] = useState(0);
  const [size, setSize] = useState(heroSize);

  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % ROSTER.length), CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onResize = () => setSize(heroSize());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const team = ROSTER[i];
  const pixels = getLogoPixels(team.slug, team.name[0]);

  return (
    <div className={styles.hero} style={{ minHeight: size }}>
      <MotifCrest
        pixels={pixels}
        seed={teamSeed(team.slug)}
        size={size}
        motif="cube"
        teamId={team.slug}
      />
    </div>
  );
}
