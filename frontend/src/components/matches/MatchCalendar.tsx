import { Link } from 'react-router';
import { MATCHES, type Match } from '../../data/matches';
import { getTeamByName } from '../../data/teams';
import { TeamLogo } from '../team/TeamLogo';
import { Countdown } from '../layout/Countdown';
import styles from './MatchCalendar.module.css';

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const YEAR = 2026;

function parse(d: string): { m: number; day: number } {
  const [mon, day] = d.trim().split(/\s+/);
  return { m: MONTHS[mon] ?? 0, day: parseInt(day, 10) };
}

function Side({ name }: { name: string }) {
  const team = getTeamByName(name);
  return (
    <span className={styles.side}>
      {team && (
        <span className={styles.sideLogo}>
          <TeamLogo team={team} size={30} />
        </span>
      )}
      {team?.code ?? name}
    </span>
  );
}

// matches grouped by month index → day → matches
const BY_MONTH = new Map<number, Map<number, Match[]>>();
for (const match of MATCHES) {
  const { m, day } = parse(match.d);
  if (!BY_MONTH.has(m)) BY_MONTH.set(m, new Map());
  const days = BY_MONTH.get(m)!;
  if (!days.has(day)) days.set(day, []);
  days.get(day)!.push(match);
}
// The World Cup spans two months — always show both, stacked, so the
// full tournament window is visible even where fixtures aren't filled in.
const TOURNAMENT_MONTHS = [5, 6]; // June, July 2026

function MonthGrid({ month }: { month: number }) {
  const days = BY_MONTH.get(month) ?? new Map<number, Match[]>();
  const first = new Date(YEAR, month, 1).getDay(); // 0 = sun
  const total = new Date(YEAR, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className={styles.month}>
      <div className={styles.monthName}>
        {MONTH_NAMES[month]} {YEAR}
      </div>
      <div className={styles.grid}>
        {WEEKDAYS.map((w) => (
          <div key={w} className={styles.weekday}>{w}</div>
        ))}
        {cells.map((d, i) => {
          const games = d ? days.get(d) : undefined;
          return (
            <div
              key={i}
              className={`${styles.cell} ${d ? '' : styles.empty}`}
              aria-label={
                d
                  ? `${MONTH_NAMES[month]} ${d}${games ? `, ${games.length} game${games.length > 1 ? 's' : ''}` : ''}`
                  : undefined
              }
            >
              {d && <span className={styles.date}>{d}</span>}
              {games?.map((g) => (
                <Link
                  key={g.id}
                  to={`/match/${g.id}`}
                  className={styles.game}
                  aria-label={`${g.h} vs ${g.a} · ${g.d} · ${g.t}`}
                >
                  <span className={styles.teams}>
                    <Side name={g.h} />
                    <span className={styles.v}>v</span>
                    <Side name={g.a} />
                  </span>
                  <span className={styles.time}>{g.t.split(' ')[0]}</span>
                </Link>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MatchCalendar() {
  return (
    <div className={styles.calendar}>
      <div className={styles.head}>
        <span className={styles.title}>calendar</span>
        <span className={styles.meta}>june 11 to july 19 &middot; {MATCHES.length} fixtures</span>
        <span className={styles.countdown}>
          <span className={styles.countdownLabel}>kickoff in</span>{' '}
          <Countdown bare />
        </span>
      </div>
      {TOURNAMENT_MONTHS.map((m) => (
        <MonthGrid key={m} month={m} />
      ))}
    </div>
  );
}
