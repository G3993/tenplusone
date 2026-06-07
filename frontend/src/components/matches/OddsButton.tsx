import { useSlipStore } from '../../stores/slip';
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
}

export function OddsButton({ matchId, pick, odds, token, homeTeam, awayTeam, readOnly = false }: OddsButtonProps) {
  const bets = useSlipStore((s) => s.bets);
  const toggleBet = useSlipStore((s) => s.toggleBet);

  const isPicked = bets.some((b) => b.matchId === matchId && b.pick === pick);

  const handleClick = () => {
    toggleBet({ matchId, pick, odds, homeTeam, awayTeam });
  };

  if (readOnly) {
    return (
      <span className={styles.oddBtn} aria-label={`${token} at ${toAmerican(odds)}`}>
        {toAmerican(odds)}
      </span>
    );
  }

  return (
    <button
      className={`${styles.oddBtn} ${isPicked ? styles.oddBtnPicked : ''}`}
      onClick={handleClick}
      aria-pressed={isPicked}
      aria-label={`Predict ${token} at ${toAmerican(odds)}`}
    >
      {toAmerican(odds)}
    </button>
  );
}
