import { Link } from 'react-router';
import { GROUPS } from '../data/groups';
import { OUTRIGHTS } from '../data/matches';
import { getTeamByName } from '../data/teams';
import { TeamLogo } from '../components/team/TeamLogo';
import styles from './Bracket.module.css';

// 48-team World Cup 2026 knockout: top 2 of each group + 8 best third-
// placed = 32. Slot codes resolve from the group table (pot order as the
// projected finish); winners then advance by betting-favorite strength,
// so the bracket is fully populated with real crests.
type Slot = string;
type M = { id: string; a: Slot; b: Slot };

const R32: M[] = [
  { id: '73', a: '1A', b: '2B' },
  { id: '74', a: '1C', b: '2D' },
  { id: '75', a: '1E', b: '2F' },
  { id: '76', a: '1G', b: '2H' },
  { id: '77', a: '1I', b: '2J' },
  { id: '78', a: '1K', b: '2L' },
  { id: '79', a: '2A', b: '2C' },
  { id: '80', a: '2E', b: '2G' },
  { id: '81', a: '2I', b: '2K' },
  { id: '82', a: '1B', b: '1D' },
  { id: '83', a: '1F', b: '1H' },
  { id: '84', a: '1J', b: '1L' },
  { id: '85', a: '3A', b: '3B' },
  { id: '86', a: '3C', b: '3D' },
  { id: '87', a: '3E', b: '3F' },
  { id: '88', a: '3G', b: '3H' },
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

const BY_ID: Record<string, M> = {};
[...R32, ...R16, ...QF, ...SF, ...FINAL, THIRD].forEach((m) => { BY_ID[m.id] = m; });

// Lower = stronger. Betting favorites first, then group-pot order.
function strength(name: string): number {
  const oi = OUTRIGHTS.findIndex((o) => o.team === name);
  if (oi >= 0) return oi;
  for (const g of GROUPS) {
    const p = g.teams.indexOf(name);
    if (p >= 0) return 12 + p * 12 + GROUPS.indexOf(g);
  }
  return 999;
}

const memo = new Map<string, string>();
function teamFor(code: string): string {
  if (memo.has(code)) return memo.get(code)!;
  let name = code;
  const m1 = /^([123])([A-L])$/.exec(code);
  if (m1) {
    const g = GROUPS.find((x) => x.id === m1[2]);
    name = g ? g.teams[Number(m1[1]) - 1] : code;
  } else if (code[0] === 'W' || code[0] === 'L') {
    const m = BY_ID[code.slice(1)];
    if (m) {
      const a = teamFor(m.a), b = teamFor(m.b);
      const aWins = strength(a) <= strength(b);
      name = code[0] === 'W' ? (aWins ? a : b) : (aWins ? b : a);
    }
  }
  memo.set(code, name);
  return name;
}

function Side({ code }: { code: string }) {
  const name = teamFor(code);
  const team = getTeamByName(name);
  return (
    <span className={styles.slot}>
      {team ? (
        <Link to={`/team/${team.slug}`} className={styles.team}>
          <TeamLogo team={team} variant="white" size={20} />
          <span className={styles.code}>{team.code}</span>
        </Link>
      ) : (
        <span className={styles.code}>{name}</span>
      )}
    </span>
  );
}

function Match({ m, champ }: { m: M; champ?: boolean }) {
  return (
    <div className={`${styles.match} ${champ ? styles.champ : ''}`}>
      <span className={styles.matchId}>{champ ? 'iFC · WC 2026' : `M${m.id}`}</span>
      <Side code={m.a} />
      {!champ && <Side code={m.b} />}
    </div>
  );
}

const COLUMNS: { label: string; matches: M[] }[] = [
  { label: 'round of 32', matches: R32 },
  { label: 'round of 16', matches: R16 },
  { label: 'quarterfinals', matches: QF },
  { label: 'semifinals', matches: SF },
  { label: 'final', matches: FINAL },
];

export function Bracket() {
  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <span className="bold">knockout bracket</span>
        <span className="dim"> · 32 teams · jun 28 – jul 19, 2026</span>
      </div>

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
            <Match m={{ id: '104', a: 'W104', b: '' }} champ />
          </div>
        </div>
      </div>

      <div className={styles.third}>
        <span className="comment"># 3rd place playoff · jul 18 — </span>
        <Side code={THIRD.a} />
        <span className="dim"> vs </span>
        <Side code={THIRD.b} />
      </div>
      <div className={styles.note}>
        <span className="comment">
          # projected from the group table &amp; betting favorites — slots
          firm up after the group stage
        </span>
      </div>
    </div>
  );
}
