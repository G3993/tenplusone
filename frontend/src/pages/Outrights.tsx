import { OUTRIGHTS } from '../data/matches';
import { getTeamByName } from '../data/teams';
import { TeamLogo } from '../components/team/TeamLogo';
import styles from './Outrights.module.css';

export function Outrights() {
  return (
    <div className={styles.wrap}>
      <ol className={styles.list}>
        {OUTRIGHTS.map((o, i) => {
          const team = getTeamByName(o.team);
          return (
            <li key={o.team} className={styles.row}>
              <span className={styles.rank}>{String(i + 1).padStart(2, '0')}</span>
              <span className={styles.logo}>
                {team
                  ? <TeamLogo team={team} variant="white" size={36} />
                  : <span style={{ fontSize: 22 }}>{o.flag}</span>}
              </span>
              <span className={styles.name}>{o.team}</span>
              <span className={styles.odds}>{o.odds}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
