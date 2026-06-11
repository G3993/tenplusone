import { MATCHES } from '../../data/matches';
import { MatchPreview } from './MatchPreview';
import styles from './MatchList.module.css';

/** WC26 matches tab — every group-stage fixture as a three-column match card
 *  (home · detail · away). Knockout games live in the bracket section. */
export function MatchList() {
  const groupMatches = MATCHES.filter((m) => /^[A-L]$/.test(m.grp));

  return (
    <div className={styles.wrap}>
      <div className={styles.matchList}>
        {groupMatches.map((m) => (
          <MatchPreview key={m.id} m={m} animate />
        ))}
      </div>
    </div>
  );
}
