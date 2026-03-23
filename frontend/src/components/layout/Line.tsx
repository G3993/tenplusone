import { useRef } from 'react';
import styles from './Line.module.css';

interface LineProps {
  n?: number | string;
  children: React.ReactNode;
  className?: string;
}

export function Line({ n, children, className = '' }: LineProps) {
  return (
    <div className={`${styles.L} ${className}`}>
      <span className={styles.Ln}>{n ?? ''}</span>
      <span className={styles.Lc}>{children}</span>
    </div>
  );
}

export function Blank({ n }: { n?: number | string }) {
  return <Line n={n}>&nbsp;</Line>;
}

export function useLineCounter(start = 1) {
  const ref = useRef(start);
  ref.current = start;
  return () => ref.current++;
}
