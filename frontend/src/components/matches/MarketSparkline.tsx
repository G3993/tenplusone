import { impliedProbabilities, marketSeries } from '../../lib/market';
import styles from './MatchList.module.css';

interface Props {
  matchId: string;
  odds: [number, number, number];
  /** [homeCode, "DRAW"/"X", awayCode] for the end pills */
  labels: [string, string, string];
}

const W = 340;
const H = 58;
const N = 40;

/** Step-after polyline points for a probability series. */
function stepPoints(series: number[]): string {
  const x = (i: number) => (i / (N - 1)) * W;
  const y = (p: number) => H - p * H;
  const pts: string[] = [`${x(0).toFixed(1)},${y(series[0]).toFixed(1)}`];
  for (let i = 1; i < series.length; i++) {
    pts.push(`${x(i).toFixed(1)},${y(series[i - 1]).toFixed(1)}`); // hold
    pts.push(`${x(i).toFixed(1)},${y(series[i]).toFixed(1)}`); // step
  }
  return pts.join(' ');
}

/**
 * Prediction-market chart: one stepped line per outcome (home / draw /
 * away) with an end pill showing the current implied probability.
 */
export function MarketSparkline({ matchId, odds, labels }: Props) {
  const probs = impliedProbabilities(odds);
  const outcomes = (['home', 'draw', 'away'] as const).map((key, i) => {
    const series = marketSeries(`${matchId}:${key}`, probs[i], N);
    return {
      key,
      label: labels[i],
      series,
      last: series[series.length - 1],
      pct: Math.round(series[series.length - 1] * 100),
    };
  });

  const y = (p: number) => H - p * H;

  const label = `live market: ${outcomes
    .map((o) => `${o.label} ${o.pct}%`)
    .join(', ')}`;

  return (
    <span className={styles.market} aria-label={label}>
      <svg
        className={styles.marketSvg}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
      >
        <title>{label}</title>
        {outcomes.map((o) => (
          <g key={o.key} className={styles[`mk_${o.key}`]}>
            <polyline points={stepPoints(o.series)} className={styles.mkLine} />
            <circle cx={W} cy={y(o.last)} r="2.5" className={styles.mkDot} />
          </g>
        ))}
      </svg>
      <span className={styles.marketPills}>
        {outcomes.map((o) => (
          <span
            key={o.key}
            className={`${styles.mkPill} ${styles[`mk_${o.key}`]}`}
          >
            <span className={styles.mkPillKey}>{o.label}</span> {o.pct}%
          </span>
        ))}
      </span>
    </span>
  );
}
