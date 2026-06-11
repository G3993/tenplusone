import type { ReactNode } from 'react';
import { Link } from 'react-router';
import styles from './Cta3D.module.css';

/** Site CTA in the iFC 3D-tetris neon style: a scanline-textured neon-green
 *  face extruded up-right like the cube motif. Hover presses the block in. */
export function Cta3D({ to, children, className }: { to: string; children: ReactNode; className?: string }) {
  return (
    <Link to={to} className={`${styles.cta} ${className ?? ''}`}>
      {children}
    </Link>
  );
}
