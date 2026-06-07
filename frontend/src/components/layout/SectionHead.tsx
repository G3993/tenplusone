import type { ReactNode } from 'react';
import styles from './SectionHead.module.css';

interface SectionHeadProps {
  /** Section number / category label rendered small, above the title.
   *  Example: "01 / NATIONS". Uppercased automatically. */
  eyebrow?: ReactNode;
  /** Section title. Renders large in the display face. Uppercased automatically. */
  title: ReactNode;
  /** Optional one-line subcopy below the title, set in the body sans face. */
  sub?: ReactNode;
  className?: string;
}

/**
 * iFC Brand System section header.
 *
 * Construction (from the brand book):
 *   - title rendered BIG (56px display, mono, uppercase, -0.025em tracking)
 *     above an eyebrow (11px mono, dim, 0.18em tracking, uppercase)
 *   - title goes on top, eyebrow under it — never the other way around
 *   - optional subcopy uses the sans body face at 16px, max-width 720
 */
export function SectionHead({ eyebrow, title, sub, className }: SectionHeadProps) {
  return (
    <header className={`${styles.head} ${className ?? ''}`}>
      <h2 className={styles.title}>{title}</h2>
      {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
      {sub && <p className={styles.sub}>{sub}</p>}
    </header>
  );
}
