import { useNavigate } from 'react-router';
import { toAmerican } from '../../lib/odds';
import styles from './MatchList.module.css';

interface OddsButtonProps {
  matchId: string;
  pick: 'home' | 'away' | 'draw';
  odds: number;
  /** what the prediction resolves to: a team code or "DRAW" */
  token: string;
  homeTeam: string;
  awayTeam: string;
  /** Display-only: render the odds as static stats, no add-to-slip. */
  readOnly?: boolean;
  /** Optional sub-label shown inside the box under the odds (e.g. team code). */
  sub?: string;
}

export function OddsButton({ matchId, pick, odds, token, readOnly = false, sub }: OddsButtonProps) {
  const navigate = useNavigate();

  // Clicking a pick opens the match page with that side preselected (the
  // closet there filters to the picked team). No persistent slip state, so
  // cards never show a stale "already picked" press.
  const handleClick = () => {
    navigate(`/match/${matchId}?pick=${pick}`);
  };

  const content = sub ? (
    <>
      <span className={styles.oddVal}>{toAmerican(odds)}</span>
      <span className={styles.oddSub}>{sub}</span>
    </>
  ) : (
    toAmerican(odds)
  );
  const cls = `${styles.oddBtn} ${sub ? styles.oddBtnStacked : ''}`;

  if (readOnly) {
    return (
      <span className={cls} aria-label={`${token} at ${toAmerican(odds)}`}>
        {content}
      </span>
    );
  }

  return (
    <button
      className={cls}
      onClick={handleClick}
      aria-label={`Predict ${token} at ${toAmerican(odds)}`}
    >
      {content}
    </button>
  );
}
