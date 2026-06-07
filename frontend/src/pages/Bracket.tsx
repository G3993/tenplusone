import { Link } from 'react-router';
import { OUTRIGHTS } from '../data/matches';
import { getTeamByName } from '../data/teams';
import { TeamLogo } from '../components/team/TeamLogo';
import { marketSeries } from '../lib/market';
import styles from './Bracket.module.css';

// ---- knockout bracket (structure only — slots, no projected teams) -----
type M = { id: string; a: string; b: string };

const R32: M[] = [
  { id: '73', a: '1A', b: '2B' }, { id: '74', a: '1C', b: '2D' },
  { id: '75', a: '1E', b: '2F' }, { id: '76', a: '1G', b: '2H' },
  { id: '77', a: '1I', b: '2J' }, { id: '78', a: '1K', b: '2L' },
  { id: '79', a: '2A', b: '2C' }, { id: '80', a: '2E', b: '2G' },
  { id: '81', a: '2I', b: '2K' }, { id: '82', a: '1B', b: '1D' },
  { id: '83', a: '1F', b: '1H' }, { id: '84', a: '1J', b: '1L' },
  { id: '85', a: '3A', b: '3B' }, { id: '86', a: '3C', b: '3D' },
  { id: '87', a: '3E', b: '3F' }, { id: '88', a: '3G', b: '3H' },
];

function nextRound(prev: M[], startId: number): M[] {
  const out: M[] = [];
  for (let i = 0; i < prev.length; i += 2) {
    out.push({ id: String(startId + i / 2), a: `W${prev[i].id}`, b: `W${prev[i + 1].id}` });
  }
  return out;
}

const R16 = nextRound(R32, 89);
const QF = nextRound(R16, 97);
const SF = nextRound(QF, 101);
const FINAL: M[] = [{ id: '104', a: `W${SF[0].id}`, b: `W${SF[1].id}` }];
const THIRD: M = { id: '103', a: `L${SF[0].id}`, b: `L${SF[1].id}` };

const COLUMNS: { label: string; matches: M[] }[] = [
  { label: 'round of 32', matches: R32 },
  { label: 'round of 16', matches: R16 },
  { label: 'quarterfinals', matches: QF },
  { label: 'semifinals', matches: SF },
  { label: 'final', matches: FINAL },
];

function Match({ m }: { m: M }) {
  return (
    <div className={styles.match}>
      <span className={styles.matchId}>M{m.id}</span>
      <span className={styles.slot}><span className={styles.code}>{m.a}</span></span>
      <span className={styles.slot}><span className={styles.code}>{m.b}</span></span>
    </div>
  );
}

/** Knockout board only — reused by WC26. */
export function KnockoutBracket() {
  return (
    <>
      <div className={styles.board}>
        {COLUMNS.map((col) => (
          <div key={col.label} className={styles.col}>
            <div className={styles.colHead}>{col.label}</div>
            <div className={styles.colBody}>
              {col.matches.map((m) => <Match key={m.id} m={m} />)}
            </div>
          </div>
        ))}

        <div className={styles.col}>
          <div className={styles.colHead}>champion</div>
          <div className={styles.colBody}>
            <div className={`${styles.match} ${styles.champ}`}>
              <span className={styles.matchId}>iFC · WC 2026</span>
              <span className={styles.slot}><span className={styles.code}>W104</span></span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.third}>
        <span className="comment">3rd place playoff &middot; jul 18 &middot; </span>
        <span className="dim">{THIRD.a} vs {THIRD.b}</span>
      </div>
      <div className={styles.note}>
        <span className="comment">
          knockout slots resolve after the group stage. 1A = winner group
          A &middot; 2B = runner-up group B &middot; 3A = third-placed group A
        </span>
      </div>
    </>
  );
}

// --- outright "to win" market chart (same engine as the game charts) ---

const OW = 200;
const OH = 34;
const ON = 40;

/** American moneyline → vig-free-ish implied win probability. */
function americanToProb(odds: string): number {
  const n = parseInt(odds.replace('+', ''), 10);
  if (Number.isNaN(n) || n === 0) return 0.04;
  const p = odds.trim().startsWith('-')
    ? Math.abs(n) / (Math.abs(n) + 100)
    : 100 / (n + 100);
  return Math.min(0.96, Math.max(0.02, p));
}

function stepPoints(series: number[]): string {
  const x = (i: number) => (i / (ON - 1)) * OW;
  const y = (p: number) => OH - (p / 0.35) * OH; // scale: 0–35% fills the box
  const pts: string[] = [`0,${y(series[0]).toFixed(1)}`];
  for (let i = 1; i < series.length; i++) {
    pts.push(`${x(i).toFixed(1)},${y(series[i - 1]).toFixed(1)}`);
    pts.push(`${x(i).toFixed(1)},${y(series[i]).toFixed(1)}`);
  }
  return pts.join(' ');
}

function OutrightSparkline({ team, odds }: { team: string; odds: string }) {
  const prob = americanToProb(odds);
  const series = marketSeries(`outright:${team}`, prob, ON);
  const last = series[series.length - 1];
  const yLast = OH - (last / 0.35) * OH;

  const label = `${team} to win: ${(last * 100).toFixed(1)}% implied`;

  return (
    <span className={styles.orChart} aria-label={label}>
      <svg
        className={styles.orChartSvg}
        viewBox={`0 0 ${OW} ${OH}`}
        preserveAspectRatio="none"
        role="img"
      >
        <title>{label}</title>
        <polyline points={stepPoints(series)} className={styles.orLine} />
        <circle cx={OW} cy={yLast} r="2.5" className={styles.orDot} />
      </svg>
      <span className={styles.orPct}>{(last * 100).toFixed(1)}%</span>
    </span>
  );
}

/** Outright (winner) odds — reused by WC26. */
export function OutrightsList() {
  return (
    <ol className={styles.outrights}>
      {OUTRIGHTS.map((o, i) => {
        const team = getTeamByName(o.team);
        return (
          <li key={o.team} className={styles.outright}>
            <span className={styles.orRank}>{String(i + 1).padStart(2, '0')}</span>
            {team ? (
              <Link to={`/team/${team.slug}`} className={styles.team}>
                <TeamLogo team={team} variant="white" size={30} />
                <span className={styles.orName}>{o.team}</span>
              </Link>
            ) : (
              <span className={styles.orName}>{o.team}</span>
            )}
            <OutrightSparkline team={o.team} odds={o.odds} />
            <span className={styles.orOdds}>{o.odds}</span>
          </li>
        );
      })}
    </ol>
  );
}
