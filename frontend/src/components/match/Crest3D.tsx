import styles from './Crest3D.module.css';

interface Props {
  slug: string;
  name: string;
  /** rendered pixel size of the crest */
  size?: number;
  /** stagger so the two crests in a matchup don't move in lockstep */
  delay?: number;
}

/**
 * The full-colour 3D ("cube") crest, floating and slowly rotating in 3D.
 * Uses the print-quality 3D PNG (the same art that drove the 3D products).
 * Pure CSS transforms — cheap, GPU-composited.
 */
export function Crest3D({ slug, name, size = 180, delay = 0 }: Props) {
  return (
    <span className={styles.stage} style={{ width: size, height: size }}>
      <img
        src={`/logos/print/3d/${slug}.png`}
        alt={`${name} 3D crest`}
        className={styles.crest}
        style={{ animationDelay: `${delay}s` }}
        loading="eager"
        draggable={false}
      />
    </span>
  );
}
