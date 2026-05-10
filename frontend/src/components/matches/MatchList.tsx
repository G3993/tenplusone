import { Link } from 'react-router';
import { Line, Blank, useLineCounter } from '../layout/Line';
import { useMatchesStore } from '../../stores/matches';
import { MATCHES } from '../../data/matches';
import { GROUPS } from '../../data/groups';
import { OddsButton } from './OddsButton';
import { getTeamByName } from '../../data/teams';
import { TeamLogo } from '../team/TeamLogo';
import styles from './MatchList.module.css';

const PICK_MAP: Record<string, 'home' | 'draw' | 'away'> = {
  '1': 'home',
  'X': 'draw',
  '2': 'away',
};

export function MatchList() {
  const nextLn = useLineCounter();
  const groupFilter = useMatchesStore((s) => s.groupFilter);
  const setGroupFilter = useMatchesStore((s) => s.setGroupFilter);

  const filteredMatches = groupFilter === 'all'
    ? MATCHES
    : MATCHES.filter((m) => m.grp === groupFilter);

  // Group matches by date
  const grouped: Record<string, typeof MATCHES> = {};
  filteredMatches.forEach((m) => {
    if (!grouped[m.d]) grouped[m.d] = [];
    grouped[m.d].push(m);
  });

  return (
    <>
      <Line n={nextLn()}>
        <span className="bold">WC 2026</span>
        <span className="dim"> /matches /groups /outrights /merch</span>
      </Line>
      <Blank n={nextLn()} />

      {/* Group filter */}
      <Line n={nextLn()}>
        <span className="comment"># group </span>
        <span className={styles.filterRow}>
          {['all', ...GROUPS.map((g) => g.id)].map((g) => (
            <button
              key={g}
              className={`${styles.filterBtn} ${groupFilter === g ? styles.filterBtnActive : ''}`}
              onClick={() => setGroupFilter(g)}
            >
              {g === 'all' ? '*' : g}
            </button>
          ))}
        </span>
      </Line>
      <Blank n={nextLn()} />

      {/* Matches by date */}
      {Object.entries(grouped).map(([date, ms]) => (
        <div key={date}>
          <Line n={nextLn()}><span className="dim">{date}, 2026</span></Line>
          <Blank n={nextLn()} />
          {ms.map((m) => (
            <div key={m.id}>
              <Line n={nextLn()}>
                {(() => {
                  const homeTeam = getTeamByName(m.h);
                  const linkable = homeTeam && homeTeam.code !== 'TBD';
                  return linkable ? (
                    <Link to={`/team/${homeTeam.slug}`} className={styles.teamLink}>
                      <TeamLogo team={homeTeam} variant="white" size={18} className={styles.teamLogo} />
                      {m.h}
                    </Link>
                  ) : (
                    <span className={styles.teamLink}>{m.h}</span>
                  );
                })()}
                <span className="dim"> vs </span>
                {(() => {
                  const awayTeam = getTeamByName(m.a);
                  const linkable = awayTeam && awayTeam.code !== 'TBD';
                  return linkable ? (
                    <Link to={`/team/${awayTeam.slug}`} className={styles.teamLink}>
                      <TeamLogo team={awayTeam} variant="white" size={18} className={styles.teamLogo} />
                      {m.a}
                    </Link>
                  ) : (
                    <span className={styles.teamLink}>{m.a}</span>
                  );
                })()}
              </Line>
              <Line n={nextLn()}>
                <Link to={`/match/${m.id}`} className={styles.teamLink}>
                  <span className="dim">{m.t} &middot; {m.v} &middot; grp {m.grp}</span>
                </Link>
              </Line>
              <Line n={nextLn()}>
                <span className={styles.oddsRow}>
                  {(['1', 'X', '2'] as const).map((label, i) => (
                    <OddsButton
                      key={label}
                      matchId={m.id}
                      pick={PICK_MAP[label]}
                      odds={m.odds[i]}
                      label={label}
                      homeTeam={m.h}
                      awayTeam={m.a}
                    />
                  ))}
                </span>
              </Line>
              <Blank n={nextLn()} />
            </div>
          ))}
        </div>
      ))}

      {/* Knockout rounds */}
      <Line n={nextLn()}><span className="comment"># -- knockout rounds -------------------</span></Line>
      <Blank n={nextLn()} />
      {[
        ['Round of 32', 'Jun 28 -- Jul 3', '16 matches'],
        ['Round of 16', 'Jul 4 -- Jul 7', '8 matches'],
        ['Quarterfinals', 'Jul 9 -- Jul 11', '4 matches'],
        ['Semifinals', 'Jul 14 -- Jul 15', '2 matches'],
        ['3rd Place', 'Jul 18', '1 match'],
        ['Final', 'Jul 19 -- MetLife Stadium, NJ', '1 match'],
      ].map(([round, dates, count]) => (
        <Line key={round} n={nextLn()}>
          <span className="bright">{round}</span>
          <span className="dim"> &middot; {dates} &middot; {count}</span>
        </Line>
      ))}

      <Blank n={nextLn()} />
      <Line n={nextLn()}><span className="comment"># 48 teams &middot; 104 matches &middot; 16 venues</span></Line>
      <Line n={nextLn()}><span className="comment"># jun 11 -- jul 19, 2026</span></Line>
      <Line n={nextLn()}><span className="comment"># united states &middot; canada &middot; mexico</span></Line>
      <Blank n={nextLn()} />
      <Line n={nextLn()} className="cursor-line"><span className="cursor" /></Line>
    </>
  );
}
