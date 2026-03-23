import { Line, Blank, useLineCounter } from '../layout/Line';

export function MatchList() {
  const nextLn = useLineCounter();
  return (
    <>
      <Line n={nextLn()}><span className="bold">ten+1 WC 2026</span><span className="dim"> /matches</span></Line>
      <Blank n={nextLn()} />
      <Line n={nextLn()}><span className="dim">Loading matches...</span></Line>
    </>
  );
}
