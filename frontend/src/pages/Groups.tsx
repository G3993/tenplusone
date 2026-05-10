import { Link } from 'react-router';
import { GROUPS } from '../data/groups';
import { getTeamByName } from '../data/teams';
import { TeamLogo } from '../components/team/TeamLogo';
import styles from './Groups.module.css';

export function Groups() {
  return (
    <div className={styles.wrap}>
      <div className={styles.grid} role="grid" aria-label="World Cup 2026 groups">
        {GROUPS.map((g) => (
          <div key={g.id} style={{ display: 'contents' }} role="row">
            <div className={styles['row-label']} role="rowheader">{g.id}</div>
            {g.teams.map((teamName, i) => {
              const team = getTeamByName(teamName);
              return (
                <Link
                  key={teamName}
                  to={team ? `/team/${team.slug}` : '#'}
                  className={styles.cell}
                  role="gridcell"
                  aria-label={`Group ${g.id} pot ${i + 1}: ${teamName}`}
                >
                  <span className={styles.logo}>
                    {team
                      ? <TeamLogo team={team} variant="white" size={56} />
                      : <span style={{ fontSize: 32 }}>{g.flags[i]}</span>}
                  </span>
                  <span className={styles.text}>
                    <span className={styles.name}>{teamName}</span>
                    <span className={styles.meta}>{team?.code ?? '—'}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
