import styles from './Bracket.module.css';

// Knockout structure for the 48-team World Cup 2026: top 2 of each group
// plus the 8 best third-placed teams = 32 into the Round of 32. Slot codes
// (1A = winner group A, 2B = runner-up group B, 3rd = best third-placed)
// resolve after the group stage.
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
  { id: '85', a: '3rd', b: '3rd' },
  { id: '86', a: '3rd', b: '3rd' },
  { id: '87', a: '3rd', b: '3rd' },
  { id: '88', a: '3rd', b: '3rd' },
];

// Each later round is the winners of the two feeding matches.
function nextRound(prev: M[], startId: number): M[] {
  const out: M[] = [];
  for (let i = 0; i < prev.length; i += 2) {
    out.push({
      id: String(startId + i / 2),
      a: `W${prev[i].id}`,
      b: `W${prev[i + 1].id}`,
    });
  }
  return out;
}

const R16 = nextRound(R32, 89);
const QF = nextRound(R16, 97);
const SF = nextRound(QF, 101);
const FINAL: M[] = [{ id: '104', a: `W${SF[0].id}`, b: `W${SF[1].id}` }];
const THIRD: M[] = [{ id: '103', a: `L${SF[0].id}`, b: `L${SF[1].id}` }];

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
      <span className={styles.slot}>{m.a}</span>
      <span className={styles.slot}>{m.b}</span>
    </div>
  );
}

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
              {col.matches.map((m) => (
                <Match key={m.id} m={m} />
              ))}
            </div>
          </div>
        ))}

        <div className={styles.col}>
          <div className={styles.colHead}>champion</div>
          <div className={styles.colBody}>
            <div className={`${styles.match} ${styles.champ}`}>
              <span className={styles.matchId}>iFC · WC 2026</span>
              <span className={styles.slot}>W104</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.third}>
        <span className="comment"># 3rd place playoff · jul 18 — </span>
        <span className="dim">{THIRD[0].a} vs {THIRD[0].b}</span>
      </div>
      <div className={styles.note}>
        <span className="comment">
          # slots resolve after the group stage. 1A = winner group A · 2B =
          runner-up group B · 3rd = best third-placed
        </span>
      </div>
    </div>
  );
}
