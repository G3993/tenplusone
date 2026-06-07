import { Link } from 'react-router';
import { useMatchesStore } from '../../stores/matches';
import { MATCHES, type Match } from '../../data/matches';
import { GROUPS } from '../../data/groups';
import { OddsButton } from './OddsButton';
import { MarketSparkline } from './MarketSparkline';
import { getTeamByName } from '../../data/teams';
import { TeamLogo } from '../team/TeamLogo';
import { impliedProbabilities } from '../../lib/market';
import styles from './MatchList.module.css';

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function fmt(n: number): string {
  if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(2)}k`;
  return String(n);
}

/** "12.4k picks · 64% on ARG" — deterministic per match. */
function PickCount({
  matchId,
  odds,
  labels,
}: {
  matchId: string;
  odds: [number, number, number];
  labels: [string, string, string];
}) {
  const probs = impliedProbabilities(odds);
  const max = Math.max(...probs);
  const favIdx = probs.indexOf(max);
  const seed = hash(matchId);
  const picks = 600 + (seed % 24400);
  return (
    <span className={styles.pickCount}>
      {fmt(picks)} picks &middot; {Math.round(max * 100)}% on {labels[favIdx]}
    </span>
  );
}

const PICK_MAP: Record<string, 'home' | 'draw' | 'away'> = {
  '1': 'home',
  'X': 'draw',
  '2': 'away',
};

const ROUND_LABELS: Record<string, string> = {
  R32: 'round of 32',
  R16: 'round of 16',
  QF: 'quarterfinal',
  SF: 'semifinal',
  '3rd': 'third place',
  FIN: 'final',
};

/** Group games → "group A"; knockout games → the round name. */
function stageLabel(grp: string): string {
  return ROUND_LABELS[grp] ?? `group ${grp}`;
}

function TeamSide({ name }: { name: string }) {
  const team = getTeamByName(name);
  const linkable = team && team.code !== 'TBD';
  const inner = (
    <>
      {team ? (
        <TeamLogo team={team} size={58} className={styles.teamLogo} />
      ) : (
        <span className={styles.teamLogo} />
      )}
      <span className={styles.teamName}>{name}</span>
    </>
  );
  return linkable ? (
    <Link to={`/team/${team.slug}`} className={styles.teamLink}>{inner}</Link>
  ) : (
    <span className={styles.teamLink}>{inner}</span>
  );
}

function MatchCard({ m }: { m: Match }) {
  const homeT = getTeamByName(m.h);
  const awayT = getTeamByName(m.a);
  const tokenFor: Record<string, string> = {
    '1': homeT?.code ?? m.h,
    'X': 'DRAW',
    '2': awayT?.code ?? m.a,
  };
  return (
    <div className={styles.card}>
      <div className={styles.cardTeams}>
        <TeamSide name={m.h} />
        <span className={styles.vs}>vs</span>
        <TeamSide name={m.a} />
      </div>
      <Link to={`/match/${m.id}`} className={styles.metaLink}>
        <span className={styles.metaStage}>{stageLabel(m.grp)}</span>
        <span className={styles.metaWhen}>{m.d} &middot; {m.t}</span>
        <span className={styles.metaWhere}>{m.v}</span>
      </Link>
      <span className={styles.oddsRow}>
        {(['1', 'X', '2'] as const).map((label, i) => (
          <OddsButton
            key={label}
            matchId={m.id}
            pick={PICK_MAP[label]}
            odds={m.odds[i]}
            token={tokenFor[label]}
            homeTeam={m.h}
            awayTeam={m.a}
          />
        ))}
      </span>
      <MarketSparkline
        matchId={m.id}
        odds={m.odds}
        labels={[tokenFor['1'], 'X', tokenFor['2']]}
      />
      <PickCount
        matchId={m.id}
        odds={m.odds}
        labels={[tokenFor['1'], 'X', tokenFor['2']]}
      />
    </div>
  );
}

export function MatchList() {
  const groupFilter = useMatchesStore((s) => s.groupFilter);
  const setGroupFilter = useMatchesStore((s) => s.setGroupFilter);

  const filteredMatches = groupFilter === 'all'
    ? MATCHES
    : MATCHES.filter((m) => m.grp === groupFilter);

  return (
    <div className={styles.wrap}>
      <div className={styles.filterBar}>
        <span className={styles.filterLabel}>group</span>
        <span className={styles.filterRow}>
          {['all', ...GROUPS.map((g) => g.id)].map((g) => (
            <button
              key={g}
              className={`${styles.filterBtn} ${groupFilter === g ? styles.filterBtnActive : ''}`}
              onClick={() => setGroupFilter(g)}
            >
              {g === 'all' ? 'all' : g}
            </button>
          ))}
        </span>
      </div>

      {filteredMatches.length === 0 ? (
        <p className={styles.empty}>no matches in group {groupFilter.toUpperCase()}</p>
      ) : (
        <div className={styles.matchGrid}>
          {filteredMatches.map((m) => (
            <MatchCard key={m.id} m={m} />
          ))}
        </div>
      )}
    </div>
  );
}
