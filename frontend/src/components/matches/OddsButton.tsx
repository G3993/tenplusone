import { useSlipStore } from '../../stores/slip';
import styles from './MatchList.module.css';

interface OddsButtonProps {
  matchId: string;
  pick: 'home' | 'away' | 'draw';
  odds: number;
  label: string;
  homeTeam: string;
  awayTeam: string;
}

export function OddsButton({ matchId, pick, odds, label, homeTeam, awayTeam }: OddsButtonProps) {
  const bets = useSlipStore((s) => s.bets);
  const toggleBet = useSlipStore((s) => s.toggleBet);

  const isPicked = bets.some((b) => b.matchId === matchId && b.pick === pick);

  const handleClick = () => {
    toggleBet({ matchId, pick, odds, homeTeam, awayTeam });
  };

  return (
    <button
      className={`${styles.oddBtn} ${isPicked ? styles.oddBtnPicked : ''}`}
      onClick={handleClick}
    >
      <span className={styles.lbl}>{label}</span>{odds.toFixed(2)}
    </button>
  );
}
