import { Line, Blank, useLineCounter } from '../layout/Line';
import styles from './MatchResult.module.css';

interface MatchResultProps {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  wagerStatus?: 'pending' | 'won' | 'lost' | null;
  wagerPick?: string;
  discountCode?: string;
}

export function MatchResult({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  wagerStatus,
  wagerPick,
  discountCode,
}: MatchResultProps) {
  const nextLn = useLineCounter();

  return (
    <div className={styles.result}>
      <Line n={nextLn()}>
        <span className={styles.scoreLine}>
          <span className="bright">{homeTeam}</span>
          <span className="dim"> </span>
          <span className="bright">{homeScore}</span>
          <span className="dim"> - </span>
          <span className="bright">{awayScore}</span>
          <span className="dim"> </span>
          <span className="bright">{awayTeam}</span>
        </span>
      </Line>
      <Blank n={nextLn()} />

      {wagerStatus === 'won' && (
        <div className={styles.outcomeWon}>
          <Line n={nextLn()}>
            <span style={{ color: 'var(--green)' }}>
              {'// PREDICTION: CORRECT'}
            </span>
          </Line>
          {wagerPick && (
            <Line n={nextLn()}>
              <span className="dim">picked: </span>
              <span className="bright">{wagerPick}</span>
            </Line>
          )}
          {discountCode && (
            <>
              <Line n={nextLn()}>
                <span style={{ color: 'var(--green)' }}>
                  {'// 50% off your merch:'}
                </span>
              </Line>
              <Line n={nextLn()}>
                <span className={styles.discountCode}>{discountCode}</span>
              </Line>
            </>
          )}
        </div>
      )}

      {wagerStatus === 'lost' && (
        <div className={styles.outcomeLost}>
          <Line n={nextLn()}>
            <span className="dim">{'// PREDICTION: INCORRECT'}</span>
          </Line>
          {wagerPick && (
            <Line n={nextLn()}>
              <span className="dim">picked: </span>
              <span className="bright">{wagerPick}</span>
            </Line>
          )}
          <Line n={nextLn()}>
            <span className="dim">
              {'// better luck next match -- check /merch for consolation deals'}
            </span>
          </Line>
        </div>
      )}

      {wagerStatus === 'pending' && (
        <div className={styles.outcomePending}>
          <Line n={nextLn()}>
            <span style={{ color: 'var(--white)' }}>
              {'// PREDICTION: PENDING'}
            </span>
          </Line>
          {wagerPick && (
            <Line n={nextLn()}>
              <span className="dim">picked: </span>
              <span className="bright">{wagerPick}</span>
            </Line>
          )}
        </div>
      )}

      {!wagerStatus && (
        <div className={styles.outcomeNone}>
          <Line n={nextLn()}>
            <span style={{ color: 'var(--faint)' }}>
              {'// no prediction placed'}
            </span>
          </Line>
        </div>
      )}
    </div>
  );
}
