import { Link } from 'react-router';
import { MATCHES, OUTRIGHTS } from '../data/matches';
import { GROUPS } from '../data/groups';
import { getTeamByName } from '../data/teams';
import { TeamLogo } from '../components/team/TeamLogo';
import styles from './Bracket.module.css';

// ---- group stage (real, scheduled fixtures) ---------------------------
const GROUP_ORDER = GROUPS.map((g) => g.id);
const MATCHES_BY_GROUP = GROUP_ORDER.map((id) => ({
  id,
  games: MATCHES.filter((m) => m.grp === id),
})).filter((g) => g.games.length > 0);

function TeamCell({ name }: { name: string }) {
  const team = getTeamByName(name);
  if (!team) return <span className={styles.code}>{name}</span>;
  return (
    <Link to={`/team/${team.slug}`} className={styles.team}>
      <TeamLogo team={team} variant="white" size={20} />
      <span className={styles.code}>{team.code}</span>
    </Link>
  );
}

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

export function Bracket() {
  return (
    <div className={styles.wrap}>
      {/* ===================== GROUP STAGE ===================== */}
      <div className={styles.head}>
        <span className="bold">group stage</span>
        <span className="dim"> · 48 teams · 12 groups · jun 11 – jun 27, 2026</span>
      </div>

      <div className={styles.groups}>
        {MATCHES_BY_GROUP.map((g) => (
          <div key={g.id} className={styles.group}>
            <div className={styles.groupHead}>group {g.id}</div>
            {g.games.map((m) => (
              <div key={m.id} className={styles.game}>
                <TeamCell name={m.h} />
                <span className="dim">v</span>
                <TeamCell name={m.a} />
                <Link to={`/match/${m.id}`} className={styles.gameMeta}>{m.d}</Link>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className={styles.flow}>
        <span className="comment"># top 2 + 8 best 3rd advance ↓ knockout</span>
      </div>

      {/* ===================== KNOCKOUT BRACKET ===================== */}
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
            <div className={`${styles.match} ${styles.champ}`}>
              <span className={styles.matchId}>iFC · WC 2026</span>
              <span className={styles.slot}><span className={styles.code}>W104</span></span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.third}>
        <span className="comment"># 3rd place playoff · jul 18 — </span>
        <span className="dim">{THIRD.a} vs {THIRD.b}</span>
      </div>
      <div className={styles.note}>
        <span className="comment">
          # knockout slots resolve after the group stage. 1A = winner group
          A · 2B = runner-up group B · 3A = third-placed group A
        </span>
      </div>

      {/* ===================== OUTRIGHTS ===================== */}
      <div className={styles.head} style={{ paddingTop: 28 }}>
        <span className="bold">outrights</span>
        <span className="dim"> · to win the tournament</span>
      </div>
      <ol className={styles.outrights}>
        {OUTRIGHTS.map((o, i) => {
          const team = getTeamByName(o.team);
          return (
            <li key={o.team} className={styles.outright}>
              <span className={styles.orRank}>{String(i + 1).padStart(2, '0')}</span>
              {team ? (
                <Link to={`/team/${team.slug}`} className={styles.team}>
                  <TeamLogo team={team} variant="white" size={20} />
                  <span className={styles.orName}>{o.team}</span>
                </Link>
              ) : (
                <span className={styles.orName}>{o.team}</span>
              )}
              <span className={styles.orOdds}>{o.odds}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
