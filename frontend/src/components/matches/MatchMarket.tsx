import { OddsButton } from './OddsButton';
import { MarketSparkline } from './MarketSparkline';
import { impliedProbabilities } from '../../lib/market';
import styles from './MatchList.module.css';

interface Props {
  matchId: string;
  odds: [number, number, number];
  homeTeam: string;
  awayTeam: string;
  /** display tokens for the three outcomes: [homeCode, "X", awayCode] */
  homeCode: string;
  awayCode: string;
  /** Render the odds as non-interactive stats (no add-to-slip). */
  readOnly?: boolean;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function fmt(n: number): string {
  if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(2)}k`;
  return String(n);
}

const PICK_MAP = { '1': 'home', 'X': 'draw', '2': 'away' } as const;

/**
 * The prediction-market block as shown on the game card: the 1 / X / 2 odds
 * row, the live market sparkline, and the "N picks · M% on FAV" line. Shared
 * between the match list card and the match detail page.
 */
export function MatchMarket({ matchId, odds, homeTeam, awayTeam, homeCode, awayCode, readOnly = false }: Props) {
  const tokenFor: Record<'1' | 'X' | '2', string> = { '1': homeCode, 'X': 'DRAW', '2': awayCode };
  const labels: [string, string, string] = [homeCode, 'X', awayCode];

  const probs = impliedProbabilities(odds);
  const max = Math.max(...probs);
  const favIdx = probs.indexOf(max);
  const picks = 600 + (hash(matchId) % 24400);

  return (
    <div className={styles.marketBlock}>
      <span className={styles.oddsRow}>
        {(['1', 'X', '2'] as const).map((label, i) => (
          <OddsButton
            key={label}
            matchId={matchId}
            pick={PICK_MAP[label]}
            odds={odds[i]}
            token={tokenFor[label]}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            readOnly={readOnly}
          />
        ))}
      </span>
      <MarketSparkline matchId={matchId} odds={odds} labels={labels} />
      <span className={styles.pickCount}>
        {fmt(picks)} picks &middot; {Math.round(max * 100)}% on {labels[favIdx]}
      </span>
    </div>
  );
}
