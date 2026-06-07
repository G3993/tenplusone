import { Link } from 'react-router';
import type { TeamData } from '../../data/teams';
import { getTeamByName } from '../../data/teams';
import { MATCHES, OUTRIGHTS } from '../../data/matches';
import { GROUPS } from '../../data/groups';
import { TeamLogo } from './TeamLogo';
import { toAmerican } from '../../lib/odds';
import styles from './TeamStats.module.css';

export function TeamStats({ team }: { team: TeamData }) {
  const fixtures = MATCHES.filter((m) => m.h === team.name || m.a === team.name);
  const group = GROUPS.find((g) => g.id === team.group);
  const rivals = (group?.teams ?? []).filter((t) => t !== team.name);
  const outright = OUTRIGHTS.find((o) => o.team === team.name)?.odds ?? null;
  const opener = fixtures[0];

  const keyStats = [
    { value: team.group, label: 'Group' },
    { value: outright ?? '—', label: 'Title odds' },
    { value: String(fixtures.length), label: 'Group fixtures' },
    { value: opener?.d ?? '—', label: 'Opener' },
  ];

  return (
    <section className={styles.hub}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>World Cup 2026</span>
        <h2 className={styles.title}>{team.name} at the tournament</h2>
      </header>

      <div className={styles.keyStats}>
        {keyStats.map((s) => (
          <div key={s.label} className={styles.stat}>
            <span className={styles.statValue}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.block}>
        <h3 className={styles.blockTitle}>Group {team.group}</h3>
        <div className={styles.rivals}>
          {rivals.map((name) => {
            const t = getTeamByName(name);
            return t ? (
              <Link key={name} to={`/team/${t.slug}`} className={styles.rival}>
                <span className={styles.rivalCrest}><TeamLogo team={t} variant="white" size={28} /></span>
                <span className={styles.rivalName}>{name}</span>
              </Link>
            ) : (
              <span key={name} className={styles.rival}><span className={styles.rivalName}>{name}</span></span>
            );
          })}
        </div>
      </div>

      {fixtures.length > 0 && (
        <div className={styles.block}>
          <h3 className={styles.blockTitle}>Matches</h3>
          <ul className={styles.fixtures}>
            {fixtures.map((m) => {
              const isHome = m.h === team.name;
              const oppName = isHome ? m.a : m.h;
              const opp = getTeamByName(oppName);
              const odds = isHome ? m.odds[0] : m.odds[2];
              return (
                <li key={m.id} className={styles.fixture}>
                  <Link to={`/match/${m.id}`} className={styles.fxLink}>
                    <span className={styles.fxDate}>{m.d}</span>
                    <span className={styles.fxOpp}>
                      {opp && <span className={styles.fxCrest}><TeamLogo team={opp} variant="white" size={22} /></span>}
                      <span className={styles.fxVs}>{isHome ? 'vs' : 'away ·'}</span>
                      {oppName}
                    </span>
                    <span className={styles.fxOdds}>{toAmerican(odds)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
