import { Link } from 'react-router';
import type { TeamData } from '../../data/teams';
import { getTeamByName } from '../../data/teams';
import { MATCHES } from '../../data/matches';
import { GROUPS } from '../../data/groups';
import { TeamLogo } from './TeamLogo';
import { FIFA_RANK } from '../../data/fifaRank';
import styles from './TeamStats.module.css';

export function TeamStats({ team }: { team: TeamData }) {
  const fixtures = MATCHES.filter((m) => m.h === team.name || m.a === team.name);
  const group = GROUPS.find((g) => g.id === team.group);
  const groupTeams = group?.teams ?? [];
  const rank = FIFA_RANK[team.slug];
  const opener = fixtures[0];

  const keyStats = [
    { value: team.group, label: 'Group' },
    { value: rank ? `#${rank}` : '—', label: 'FIFA ranking' },
    { value: String(fixtures.length), label: 'Group fixtures' },
    { value: opener?.d ?? '—', label: 'Opener' },
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

      {/* the group — a grid of all four nations */}
      <div className={styles.block}>
        <h3 className={styles.blockTitle}>Group {team.group}</h3>
        <div className={styles.groupGrid}>
          {groupTeams.map((name) => {
            const t = getTeamByName(name);
            const self = name === team.name;
            const inner = (
              <>
                <span className={styles.gCrest}>
                  {t ? <TeamLogo team={t} variant="white" size={44} /> : null}
                </span>
                <span className={styles.gName}>{name}</span>
              </>
            );
            return t && !self ? (
              <Link key={name} to={`/team/${t.slug}`} className={styles.gTeam}>{inner}</Link>
            ) : (
              <span key={name} className={`${styles.gTeam} ${self ? styles.gSelf : ''}`}>{inner}</span>
            );
          })}
        </div>
      </div>

      {/* matches — two crests side by side per game, like the match header */}
      {fixtures.length > 0 && (
        <div className={styles.block}>
          <h3 className={styles.blockTitle}>Matches</h3>
          <div className={styles.fixtures}>
            {fixtures.map((m) => {
              const homeT = getTeamByName(m.h);
              const awayT = getTeamByName(m.a);
              return (
                <Link key={m.id} to={`/match/${m.id}`} className={styles.fx}>
                  <span className={styles.fxSide}>
                    <span className={styles.fxCrest}>{homeT ? <TeamLogo team={homeT} variant="white" size={48} /> : null}</span>
                    <span className={styles.fxCode}>{homeT?.code ?? m.h}</span>
                  </span>
                  <span className={styles.fxV}>v</span>
                  <span className={styles.fxSide}>
                    <span className={styles.fxCrest}>{awayT ? <TeamLogo team={awayT} variant="white" size={48} /> : null}</span>
                    <span className={styles.fxCode}>{awayT?.code ?? m.a}</span>
                  </span>
                  <span className={styles.fxDate}>{m.d}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
