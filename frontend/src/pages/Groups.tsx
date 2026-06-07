import { Link } from 'react-router';
import { GROUPS } from '../data/groups';
import { getTeamByName } from '../data/teams';
import { TeamLogo } from '../components/team/TeamLogo';
import styles from './Groups.module.css';

export function Groups() {
  return (
    <div className={styles.wrap}>
      <div className={styles.grid} aria-label="World Cup 2026 groups">
        {GROUPS.map((g) => (
          <section key={g.id} className={styles.group} aria-label={`Group ${g.id}`}>
            <header className={styles.groupHead}>
              <span className={styles.groupTag}>group</span>
              <span className={styles.groupId}>{g.id}</span>
            </header>
            <div className={styles.teams}>
              {g.teams.map((teamName, i) => {
                const team = getTeamByName(teamName);
                return (
                  <Link
                    key={teamName}
                    to={team ? `/team/${team.slug}` : '#'}
                    className={styles.cell}
                    aria-label={`Group ${g.id}: ${teamName}`}
                  >
                    <span className={styles.logo}>
                      {team
                        ? <TeamLogo team={team} variant="white" size={44} />
                        : <span style={{ fontSize: 26 }}>{g.flags[i]}</span>}
                    </span>
                    <span className={styles.text}>
                      <span className={styles.name}>{teamName}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
