import type { TeamData } from '../../data/teams';
import { MATCHES, OUTRIGHTS } from '../../data/matches';
import { GROUPS } from '../../data/groups';
import { PLAYERS_TO_WATCH } from '../../data/teamFacts';
import styles from './TeamWatch.module.css';

export function TeamWatch({ team }: { team: TeamData }) {
  const players = PLAYERS_TO_WATCH[team.slug];

  if (players && players.length > 0) {
    return (
      <section className={styles.watch}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>{team.name}</span>
          <h2 className={styles.title}>Players to watch</h2>
        </header>
        <ul className={styles.list}>
          {players.map((p, i) => (
            <li key={p} className={styles.item}>
              <span className={styles.num}>{String(i + 1).padStart(2, '0')}</span>
              <span className={styles.player}>{p}</span>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  // Fallback: interesting facts pulled from live tournament data.
  const fixtures = MATCHES.filter((m) => m.h === team.name || m.a === team.name);
  const first = fixtures[0];
  const group = GROUPS.find((g) => g.id === team.group);
  const rivals = (group?.teams ?? []).filter((t) => t !== team.name);
  const outright = OUTRIGHTS.find((o) => o.team === team.name)?.odds ?? null;

  const facts: string[] = [];
  if (first) {
    const opp = first.h === team.name ? first.a : first.h;
    facts.push(`Opens the group stage vs ${opp} on ${first.d}.`);
  }
  if (rivals.length > 0) {
    facts.push(`Drawn into Group ${team.group} alongside ${rivals.join(', ')}.`);
  }
  facts.push(
    outright
      ? `Title price sits at ${outright} on the iFC market.`
      : 'A long-shot in the outright market, no quoted title price yet.'
  );
  facts.push(`${fixtures.length} group-stage fixtures across the United States, Canada and Mexico.`);

  return (
    <section className={styles.watch}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>{team.name}</span>
        <h2 className={styles.title}>The brief</h2>
      </header>
      <ul className={styles.list}>
        {facts.map((f, i) => (
          <li key={i} className={styles.item}>
            <span className={styles.num}>{String(i + 1).padStart(2, '0')}</span>
            <span className={styles.fact}>{f}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
