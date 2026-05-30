import { Link } from 'react-router';
import { Line, Blank, useLineCounter } from '../components/layout/Line';
import { Wordmark } from '../components/layout/Wordmark';
import styles from './Landing.module.css';

const STEPS: [string, string][] = [
  ['01', 'pick a match · wager an outcome'],
  ['02', 'team wins · unlock the drop at 50% off'],
  ['03', 'team loses · downgraded merch or store credit'],
  ['04', 'nobody walks away empty-handed'],
];

export function Landing() {
  const nextLn = useLineCounter();

  return (
    <>
      <Line n={nextLn()}>
        <Wordmark size={28} />
        <span className="dim"> · Internet Football Club</span>
      </Line>
      <Blank n={nextLn()} />

      <Line n={nextLn()}><span className="comment"># always-winning gambling</span></Line>
      <Blank n={nextLn()} />
      <Line n={nextLn()}><span className="bright">bet on a match. unlock the merch.</span></Line>
      <Line n={nextLn()}><span className="dim">win or lose, you always walk away with something.</span></Line>
      <Blank n={nextLn()} />

      <Line n={nextLn()}><span className="comment"># how it works</span></Line>
      <Blank n={nextLn()} />
      {STEPS.map(([num, label]) => (
        <Line key={num} n={nextLn()}>
          <span className="bold">{num}</span>
          <span className="dim">  {label}</span>
        </Line>
      ))}
      <Blank n={nextLn()} />

      <Line n={nextLn()}><span className="comment"># the merch</span></Line>
      <Blank n={nextLn()} />
      <Line n={nextLn()}><span className="dim">each match mints one-of-one designs driven by the</span></Line>
      <Line n={nextLn()}><span className="dim">scoreline, stats &amp; key moments. printed once, never repeated.</span></Line>
      <Blank n={nextLn()} />

      <Line n={nextLn()}><span className="comment"># enter</span></Line>
      <Blank n={nextLn()} />
      <Line n={nextLn()}>
        <span className={styles.ctaRow}>
          <Link to="/matches" className={styles.cta}>&rarr; browse matches</Link>
          <Link to="/merch" className={styles.cta}>&rarr; shop merch</Link>
          <Link to="/bracket" className={styles.cta}>&rarr; view bracket</Link>
        </span>
      </Line>
      <Blank n={nextLn()} />

      <Line n={nextLn()}><span className="comment"># 48 teams · 104 matches · world cup 2026</span></Line>
      <Line n={nextLn()}><span className="comment"># united states · canada · mexico · jun 11 – jul 19</span></Line>
      <Blank n={nextLn()} />
      <Line n={nextLn()} className="cursor-line"><span className="cursor" /></Line>
    </>
  );
}
