import { Link } from 'react-router';
import { GROUPS } from '../data/groups';
import { getTeamByName } from '../data/teams';
import { TeamLogo } from '../components/team/TeamLogo';
import styles from './Groups.module.css';

export function Groups() {
  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <span className="comment"># FIFA World Cup 2026 &middot; 12 groups &times; 4 teams = 48</span>
        <span className="comment"># top 2 + 8 best 3rd &rarr; round of 32</span>
      </div>

      <div className={styles.pot} aria-hidden="true">
        <span />
        <span>pot 1</span>
        <span>pot 2</span>
        <span>pot 3</span>
        <span>pot 4</span>
      </div>

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
                      ? <TeamLogo team={team} variant="white" size={120} />
                      : <span style={{ fontSize: 64 }}>{g.flags[i]}</span>}
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
