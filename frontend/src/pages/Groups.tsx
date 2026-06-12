import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { GROUPS } from '../data/groups';
import { getTeamByName } from '../data/teams';
import { TeamLogo } from '../components/team/TeamLogo';
import styles from './Groups.module.css';

interface ResultRow {
  home: string;
  away: string;
  homeGoals: number;
  awayGoals: number;
  state: 'pre' | 'in' | 'post';
}

interface Line { mp: number; w: number; d: number; l: number; gf: number; ga: number; pts: number; gd: number; live: boolean }

const ZERO: Line = { mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, gd: 0, live: false };

/** Loose team-name matching between ESPN display names and ours. */
const ALIASES: Record<string, string> = {
  unitedstates: 'usa',
  capeverde: 'caboverde',
  bosniaandherzegovina: 'bosnia',
  turkey: 'turkiye',
  southkorea: 'southkorea',
  democraticrepublicofthecongo: 'drcongo',
  drcongo: 'drcongo',
  curaao: 'curacao',
  curacao: 'curacao',
};
function norm(name: string): string {
  const n = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]/g, '');
  return ALIASES[n] ?? n;
}
function sameTeam(a: string, b: string): boolean {
  const x = norm(a), y = norm(b);
  return x === y || x.includes(y) || y.includes(x);
}

/** MP/W/D/L/PTS per team from completed games; live games mark the row. */
function computeLines(results: ResultRow[]): (teamName: string) => Line {
  return (teamName) => {
    const line: Line = { ...ZERO };
    for (const r of results) {
      const isHome = sameTeam(r.home, teamName);
      const isAway = !isHome && sameTeam(r.away, teamName);
      if (!isHome && !isAway) continue;
      if (r.state === 'in') { line.live = true; continue; }
      if (r.state !== 'post') continue;
      const gf = isHome ? r.homeGoals : r.awayGoals;
      const ga = isHome ? r.awayGoals : r.homeGoals;
      line.mp += 1;
      line.gf += gf;
      line.ga += ga;
      line.gd += gf - ga;
      if (gf > ga) { line.w += 1; line.pts += 3; }
      else if (gf === ga) { line.d += 1; line.pts += 1; }
      else { line.l += 1; }
    }
    return line;
  };
}

export function Groups() {
  const [results, setResults] = useState<ResultRow[]>([]);

  // real results; refresh every minute so live games move the board
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = () => {
      fetch('/api/results')
        .then((r) => r.json())
        .then((d: { results: ResultRow[] }) => {
          if (!alive) return;
          setResults(d.results || []);
          timer = setTimeout(load, 60_000);
        })
        .catch(() => { timer = setTimeout(load, 60_000); });
    };
    load();
    return () => { alive = false; if (timer) clearTimeout(timer); };
  }, []);

  const lineFor = useMemo(() => computeLines(results), [results]);
  const anyLive = results.some((r) => r.state === 'in');

  return (
    <div className={styles.wrap}>
      <div className={styles.grid} aria-label="World Cup 2026 groups">
        {GROUPS.map((g) => {
          // standings order: points, then goal difference; kickoff order until
          // results exist
          const rows = g.teams
            .map((teamName, i) => ({ teamName, i, line: lineFor(teamName) }))
            .sort((a, b) => b.line.pts - a.line.pts || b.line.gd - a.line.gd || a.i - b.i);
          return (
            <section key={g.id} className={styles.group} aria-label={`Group ${g.id}`}>
              <header className={styles.groupHead}>
                <span className={styles.groupTag}>group</span>
                <span className={styles.groupId}>{g.id}</span>
                {rows.some((r) => r.line.live) && (
                  <span className={styles.liveTag}>live</span>
                )}
              </header>
              <div className={styles.teams}>
                <div className={styles.statHead} aria-hidden="true">
                  <span className={styles.statHeadTeam}>team</span>
                  <span className={styles.statCols}>
                    {['MP', 'W', 'D', 'L', 'GF', 'GA', 'PTS'].map((c) => (
                      <span key={c}>{c}</span>
                    ))}
                  </span>
                </div>
                {rows.map(({ teamName, i, line }, pos) => {
                  const team = getTeamByName(teamName);
                  return (
                    <Link
                      key={teamName}
                      to={team ? `/team/${team.slug}` : '#'}
                      className={styles.cell}
                      aria-label={`Group ${g.id}: ${teamName}`}
                    >
                      <span className={styles.pos}>{pos + 1}</span>
                      <span className={styles.logo}>
                        {team
                          ? <TeamLogo team={team} variant="white" size={56} />
                          : <span style={{ fontSize: 26 }}>{g.flags[i]}</span>}
                      </span>
                      <span className={styles.text}>
                        <span className={styles.name}>
                          {teamName}
                          {line.live && <span className={styles.liveDot} aria-label="playing now" />}
                        </span>
                        <span className={`${styles.statCols} ${styles.stats}`}>
                          <span>{line.mp}</span>
                          <span>{line.w}</span>
                          <span>{line.d}</span>
                          <span>{line.l}</span>
                          <span>{line.gf}</span>
                          <span>{line.ga}</span>
                          <span className={styles.pts}>{line.pts}</span>
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      {anyLive && <p className={styles.boardNote}>standings update live as matches play</p>}
    </div>
  );
}
