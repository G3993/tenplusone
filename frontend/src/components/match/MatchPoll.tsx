import type { TeamData } from '../../data/teams';
import { toAmerican } from '../../lib/odds';
import styles from './MatchPoll.module.css';

export type MatchPick = 'home' | 'draw' | 'away';
type Pick = MatchPick;

interface Props {
  home: TeamData;
  away: TeamData;
  /** [home, draw, away] decimal odds — shown on the call buttons. */
  odds: [number, number, number];
  /** Controlled pick — nothing is pre-selected; the page owns the state. */
  pick: Pick | null;
  onPick: (p: Pick) => void;
}

/**
 * The match "your call" CTA. Each button IS the odds button — it shows the
 * live odds for that outcome. Picking a side filters the closet below to that
 * team's gear and anchors to it. Controlled: no pick is restored on load, so
 * opening a match never shows a team pre-selected.
 */
export function MatchPoll({ home, away, odds, pick, onPick }: Props) {
  const scrollToKit = (p: Pick) => {
    const target = p === 'away' ? `closet-${away.slug}` : `closet-${home.slug}`;
    requestAnimationFrame(() => {
      document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const choose = (p: Pick) => {
    onPick(p);
    if (p !== 'draw') scrollToKit(p);
  };

  // Match the match-card odds boxes: value on top, team abbreviation beneath.
  const options: { p: Pick; code: string; odd: number }[] = [
    { p: 'home', code: home.code, odd: odds[0] },
    { p: 'draw', code: 'DRAW', odd: odds[1] },
    { p: 'away', code: away.code, odd: odds[2] },
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
            <span className={styles.optOdds}>{toAmerican(o.odd)}</span>
            <span className={styles.optLabel}>{o.code}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
