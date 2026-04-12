import { GROUPS } from '../data/groups';
import { Line, Blank, useLineCounter } from '../components/layout/Line';
import { getTeamByName } from '../data/teams';
import { TeamLogo } from '../components/team/TeamLogo';

export function Groups() {
  const nextLn = useLineCounter();

  return (
    <>
      <Line n={nextLn()}><span className="comment"># FIFA World Cup 2026 groups</span></Line>
      <Line n={nextLn()}><span className="comment"># 12 groups of 4 &middot; top 2 + 8 best 3rd &rarr; round of 32</span></Line>
      <Blank n={nextLn()} />

      {GROUPS.map((g) => (
        <div key={g.id}>
          <Line n={nextLn()}><span className="bright">group {g.id}</span></Line>
          {g.teams.map((teamName, i) => {
            const team = getTeamByName(teamName);
            return (
              <Line key={teamName} n={nextLn()}>
                {team
                  ? <TeamLogo team={team} variant="white" size={18} />
                  : <span className="dim">{g.flags[i]}</span>}
                <span className="bright" style={{ marginLeft: 8 }}>{teamName}</span>
                <span className="faint">  pot {i + 1}</span>
              </Line>
            );
          })}
          <Blank n={nextLn()} />
        </div>
      ))}

      <Line n={nextLn()} className="cursor-line"><span className="cursor" /></Line>
    </>
  );
}
