import { useState, useEffect } from 'react';
import type { TeamData } from '../../data/teams';
import { toAmerican } from '../../lib/odds';
import styles from './MatchPoll.module.css';

type Pick = 'home' | 'draw' | 'away';

interface Props {
  matchId: string;
  home: TeamData;
  away: TeamData;
  /** [home, draw, away] decimal odds — shown on the call buttons. */
  odds: [number, number, number];
}

/**
 * The match "your call" CTA. Each button IS the odds button — it shows the
 * live decimal odds for that outcome. Picking a side records the vote (locally)
 * and anchors straight to that team's featured kit below. The market sparkline
 * underneath is the live signal (implied probability over time).
 */
export function MatchPoll({ matchId, home, away, odds }: Props) {
  const key = `ifc-pick-${matchId}`;
  const [pick, setPick] = useState<Pick | null>(null);

  useEffect(() => {
    try {
      const v = localStorage.getItem(key);
      if (v === 'home' || v === 'draw' || v === 'away') setPick(v);
    } catch { /* ignore */ }
  }, [key]);

  const scrollToKit = (p: Pick) => {
    const target = p === 'away' ? `closet-${away.slug}` : `closet-${home.slug}`;
    requestAnimationFrame(() => {
      document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const choose = (p: Pick) => {
    setPick(p);
    try { localStorage.setItem(key, p); } catch { /* ignore */ }
    scrollToKit(p);
  };

  const options: { p: Pick; label: string; odd: number }[] = [
    { p: 'home', label: home.name, odd: odds[0] },
    { p: 'draw', label: 'Draw', odd: odds[1] },
    { p: 'away', label: away.name, odd: odds[2] },
  ];

  return (
    <section className={styles.poll} aria-label="who wins?">
      <div className={styles.options} role="group" aria-label="pick the winner">
        {options.map((o) => (
          <button
            key={o.p}
            type="button"
            className={pick === o.p ? `${styles.opt} ${styles.optActive}` : styles.opt}
            aria-pressed={pick === o.p}
            onClick={() => choose(o.p)}
          >
            <span className={styles.optLabel}>{o.label}</span>
            <span className={styles.optOdds}>{toAmerican(o.odd)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
