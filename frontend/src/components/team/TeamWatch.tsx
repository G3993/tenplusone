import type { TeamData } from '../../data/teams';
import { ROSTERS } from '../../data/rosters';
import styles from './TeamWatch.module.css';

/** Full World Cup squad — every player with shirt number and position. */
export function TeamWatch({ team }: { team: TeamData }) {
  const roster = ROSTERS[team.slug];
  if (!roster || roster.length === 0) return null;

  return (
    <section className={styles.watch}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>{team.name}</span>
        <h2 className={styles.title}>Team Roster</h2>
      </header>
      <ul className={styles.list}>
        {roster.map((p, i) => (
          <li key={`${p.name}-${i}`} className={styles.item}>
            <span className={styles.num}>{p.n ?? '#'}</span>
            <span className={styles.player}>{p.name}</span>
            <span className={styles.pos}>{p.pos}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
