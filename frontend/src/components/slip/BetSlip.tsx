import { useSlipStore } from '../../stores/slip';
import { MERCH } from '../../data/matches';
import { Line, Blank, useLineCounter } from '../layout/Line';
import styles from './BetSlip.module.css';

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function pickLabel(pick: string, homeTeam: string, awayTeam: string) {
  if (pick === 'home') return homeTeam;
  if (pick === 'away') return awayTeam;
  return 'draw';
}

export function BetSlip() {
  const nextLn = useLineCounter();
  const bets = useSlipStore((s) => s.bets);
  const removeBet = useSlipStore((s) => s.removeBet);
  const setWager = useSlipStore((s) => s.setWager);
  const clear = useSlipStore((s) => s.clear);

  return (
    <>
      <Line n={nextLn()}><span className="comment"># your bet slip</span></Line>
      <Line n={nextLn()}><span className="comment"># select merch to wager on each pick</span></Line>
      <Blank n={nextLn()} />

      {bets.length === 0 ? (
        <>
          <Line n={nextLn()}><span className="dim">no bets yet.</span></Line>
          <Line n={nextLn()}><span className="dim">go to matches tab, click odds to add bets.</span></Line>
        </>
      ) : (
        <>
          {bets.map((b, i) => (
            <div key={b.matchId}>
              <Line n={nextLn()}>
                <span className="bright">bet {i + 1}</span>
                <button className={styles.rmBtn} onClick={() => removeBet(b.matchId)}>[remove]</button>
              </Line>
              <Line n={nextLn()}>
                <span className="bright">{b.homeTeam}</span>
                <span className="dim"> vs </span>
                <span className="bright">{b.awayTeam}</span>
              </Line>
              <Line n={nextLn()}>
                <span className="dim">pick: </span>
                <span className="bright">
                  {pickLabel(b.pick, b.homeTeam, b.awayTeam)} @ {b.odds.toFixed(2)}
                </span>
              </Line>
              <Line n={nextLn()} className={styles.inputLine}>
                <span className="dim">wager: </span>
                <select
                  className={styles.slipSelect}
                  value={b.wager}
                  onChange={(e) => setWager(b.matchId, e.target.value)}
                >
                  <option value="">select merch...</option>
                  {MERCH.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatPrice(p.price)})
                    </option>
                  ))}
                </select>
              </Line>
              <Blank n={nextLn()} />
            </div>
          ))}

          <Line n={nextLn()}><span className="comment"># ---------------------------------</span></Line>
          <Line n={nextLn()}>
            <span className="dim">total bets: </span>
            <span className="bright">{bets.length}</span>
            <span className="dim">  merch wagered: </span>
            <span className="bright">{bets.filter((b) => b.wager).length}</span>
          </Line>
          <Blank n={nextLn()} />
          <Line n={nextLn()}>
            <button className={styles.cmdBtn} disabled>
              place {bets.length} bet{bets.length > 1 ? 's' : ''}
            </button>
          </Line>
          <Blank n={nextLn()} />
          <Line n={nextLn()}>
            <button className={styles.rmBtn} onClick={clear}>[clear all]</button>
          </Line>
        </>
      )}

      <Blank n={nextLn()} />
      <Line n={nextLn()} className="cursor-line"><span className="cursor" /></Line>
    </>
  );
}
