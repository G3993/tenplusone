import { Link } from 'react-router';
import { MATCHES } from '../data/matches';
import { getTeamByName } from '../data/teams';
import { TeamLogo } from '../components/team/TeamLogo';
import styles from './Legal.module.css';

// Pick three "upcoming" fixtures deterministically so the 404 isn't a dead end.
const SUGGESTED = MATCHES.slice(0, 3);

export default function NotFound() {
  return (
    <div className={styles.page}>
      <div className={styles.notFound}>
        <div className={styles.notFoundCode}>404</div>
        <div className={styles.notFoundLead}>this page didn't qualify.</div>
        <div className={styles.notFoundDim}>
          the page you're looking for moved, got cut, or never existed.
        </div>

        <div className={styles.ctaRow}>
          <Link to="/" className={styles.cta}>← back to home</Link>
          <Link to="/wc26" className={styles.ghost}>enter wc26</Link>
        </div>

        <div className={styles.section}>
          <div className={styles.h2}>or jump into a match</div>
          {SUGGESTED.map((m) => {
            const h = getTeamByName(m.h);
            const a = getTeamByName(m.a);
            return (
              <Link key={m.id} to={`/match/${m.id}`} className={styles.fixture}>
                {h && <TeamLogo team={h} size={20} />}
                <span>{m.h}</span>
                <span style={{ color: 'var(--dim)' }}>v</span>
                {a && <TeamLogo team={a} size={20} />}
                <span>{m.a}</span>
                <span style={{ color: 'var(--dim)', marginLeft: 'auto', fontSize: 12 }}>
                  {m.d} · {m.t.replace(' ET', '')}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
