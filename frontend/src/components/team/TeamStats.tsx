import type { TeamData } from '../../data/teams';
import { MATCHES } from '../../data/matches';
import { FIFA_RANK } from '../../data/fifaRank';
import styles from './TeamStats.module.css';

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Deterministic recent form (last 5, most-recent-first) — stronger teams
 *  (lower FIFA rank) skew toward wins. Stand-in until live results exist. */
function last5(slug: string, rank?: number): ('W' | 'D' | 'L')[] {
  const h = hashStr(slug);
  const strength = rank ? Math.max(0.12, Math.min(0.82, 1 - (rank - 1) / 70)) : 0.45;
  const out: ('W' | 'D' | 'L')[] = [];
  for (let i = 0; i < 5; i++) {
    const r = ((h >>> (i * 5)) & 31) / 31;
    if (r < strength) out.push('W');
    else if (r < strength + (1 - strength) * 0.5) out.push('D');
    else out.push('L');
  }
  return out;
}

export function TeamStats({ team }: { team: TeamData }) {
  const fixtures = MATCHES.filter((m) => m.h === team.name || m.a === team.name);
  const rank = FIFA_RANK[team.slug];

  // Next match the team has (first upcoming fixture) — opponent name only.
  const next = fixtures[0];
  const nextOpp = next ? (next.h === team.name ? next.a : next.h) : null;

  const streak = last5(team.slug, rank);
  const STREAK_CLASS: Record<string, string> = { W: styles.sW, D: styles.sD, L: styles.sL };

  const keyStats = [
    { value: team.group, label: 'Group' },
    { value: rank ? `#${rank}` : '—', label: 'FIFA ranking' },
    {
      value: (
        <span className={styles.streak}>
          {streak.map((r, i) => <span key={i} className={STREAK_CLASS[r]}>{r}</span>)}
        </span>
      ),
      label: 'Streak',
    },
    { value: nextOpp ?? '—', label: 'Next Rival' },
  ];

  return (
    <section className={styles.hub}>
      <div className={styles.keyStats}>
        {keyStats.map((s) => (
          <div key={s.label} className={styles.stat}>
            <span className={styles.statValue}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>
      {/* the team's fixtures render as full-width MatchPreview cards at the
          very bottom of the page (see <TeamMatches> in Team.tsx) */}
    </section>
  );
}
