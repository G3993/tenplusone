import type { ReactNode } from 'react';
import { Link } from 'react-router';
import styles from './Back3D.module.css';

/** Back-navigation in the cube family: a gray 3D block (same extrusion motif
 *  as the containers) that goes green on hover. */
export function Back3D({ to, children, className }: { to: string; children: ReactNode; className?: string }) {
  return (
    <Link to={to} className={`${styles.back} ${className ?? ''}`}>
      {children}
    </Link>
  );
}
