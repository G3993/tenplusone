import { Line, Blank, useLineCounter } from '../layout/Line';

export function BetSlip() {
  const nextLn = useLineCounter();
  return (
    <>
      <Line n={nextLn()}><span className="comment"># your bet slip</span></Line>
      <Blank n={nextLn()} />
      <Line n={nextLn()}><span className="dim">Loading slip...</span></Line>
    </>
  );
}
