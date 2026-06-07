import { useEffect, useState } from 'react';
import styles from './Countdown.module.css';

// First match: Mexico v South Africa, Jun 11 2026, 17:00 ET (EDT = UTC-4).
const KICKOFF = new Date('2026-06-11T17:00:00-04:00').getTime();

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

/**
 * `bare` drops the "WC ·" prefix — use when surrounding copy already names the
 * event. `big` renders the prominent boxed D/H/M/S display (ticks every second).
 */
export function Countdown({ className, bare, big }: { className?: string; bare?: boolean; big?: boolean }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), big ? 1_000 : 30_000);
    return () => clearInterval(t);
  }, [big]);

  const diff = KICKOFF - now;

  if (big) {
    const { d, h, m, s } = parts(diff);
    if (diff <= 0) {
      return <div className={`${styles.big} ${className ?? ''}`} role="status">the collection is live</div>;
    }
    const units: [number, string][] = [[d, 'days'], [h, 'hrs'], [m, 'min'], [s, 'sec']];
    return (
      <div className={`${styles.big} ${className ?? ''}`} role="timer" aria-label={`${d} days ${h} hours ${m} minutes to kickoff`}>
        {units.map(([v, label]) => (
          <span key={label} className={styles.unit}>
            <span className={styles.num}>{String(v).padStart(2, '0')}</span>
            <span className={styles.lbl}>{label}</span>
          </span>
        ))}
      </div>
    );
  }

  if (diff <= 0) {
    return <span className={className} aria-label="World Cup is live">{bare ? 'live' : 'WC LIVE'}</span>;
  }

  const { d, h, m } = parts(diff);
  const label = d > 0 ? `${d}d ${h}h` : `${h}h ${m}m`;
  return (
    <span className={className} aria-label={`World Cup 2026 kicks off in ${d} days ${h} hours`}>
      {bare ? label : <>WC&nbsp;·&nbsp;{label}</>}
    </span>
  );
}
