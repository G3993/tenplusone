import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router';
import { MatchCrest3D } from '../components/match/MatchCrest3D';
import { useCrestSize } from '../components/matches/MatchPreview';
import { MatchResult } from '../components/match/MatchResult';
import { MatchCloset } from '../components/match/MatchCloset';
import { MatchPoll, type MatchPick } from '../components/match/MatchPoll';
import { MatchStatsPanel } from '../components/match/MatchStatsPanel';
import { GameIdentity } from '../components/match/GameIdentity';
import { MeshGridBG } from '../components/home/MeshGridBG';
import { MATCHES } from '../data/matches';
import { getTeamByName } from '../data/teams';
import { fetchMatch } from '../lib/api';
import type { ApiMatch } from '../lib/api';
import styles from './MatchDetail.module.css';

/** "13:00 PDT" → "1:00 PM PDT" — human 12-hour clock, not 24-hour. */
function to12h(t: string): string {
  const mt = t.match(/^(\d{1,2}):(\d{2})\s*(.*)$/);
  if (!mt) return t;
  let h = Number(mt[1]);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${mt[2]} ${ampm}${mt[3] ? ` ${mt[3]}` : ''}`;
}

export function MatchDetail() {
  const { id } = useParams<{ id: string }>();
  const crestSize = useCrestSize();

  const match = MATCHES.find((m) => m.id === id);

  const [apiMatch, setApiMatch] = useState<ApiMatch | null>(null);
  const [loading, setLoading] = useState(true);
  // Your call — starts unselected on every visit (never auto-restored); picking
  // a team filters the closet below to that team's full line.
  const [searchParams] = useSearchParams();
  const urlPick = searchParams.get('pick');
  const [pick, setPick] = useState<MatchPick | null>(
    urlPick === 'home' || urlPick === 'away' || urlPick === 'draw' ? urlPick : null,
  );

  useEffect(() => {
    if (!id) return;
    fetchMatch(id)
      .then((m) => setApiMatch(m))
      .finally(() => setLoading(false));
  }, [id]);

  if (!match) {
    return (
      <div className={styles.page}>
        <div className={styles.notFound}>match not found</div>
        <Link to="/matches" className={styles.back}>← back to matches</Link>
      </div>
    );
  }

  const homeTeam = getTeamByName(match.h);
  const awayTeam = getTeamByName(match.a);

  // Determine match status from API data, fallback to SCHEDULED
  const status = apiMatch?.status || 'SCHEDULED';
  const homeScore = apiMatch?.score_home;
  const awayScore = apiMatch?.score_away;

  return (
    <div className={styles.page}>
      <MeshGridBG />
      {/* logos big, up top */}
      <header className={styles.crests}>
        {homeTeam ? (
          <Link to={`/team/${homeTeam.slug}`} className={styles.crest}>
            <MatchCrest3D slug={homeTeam.slug} name={match.h} size={crestSize} />
            <span className={styles.crestName}>{match.h}</span>
          </Link>
        ) : (
          <span className={styles.crest}>
            <span className={styles.crestName}>{match.h}</span>
          </span>
        )}

        <span className={styles.vs}>vs</span>

        {awayTeam ? (
          <Link to={`/team/${awayTeam.slug}`} className={styles.crest}>
            <MatchCrest3D slug={awayTeam.slug} name={match.a} size={crestSize} />
            <span className={styles.crestName}>{match.a}</span>
          </Link>
        ) : (
          <span className={styles.crest}>
            <span className={styles.crestName}>{match.a}</span>
          </span>
        )}
      </header>

      {/* match meta — centered */}
      <div className={styles.meta}>
        <div className={styles.when}>{to12h(match.t)}</div>
        <div className={styles.venue}>{match.v}</div>
      </div>

      {/* "your call" CTA — the call buttons ARE the odds; sparkline is the live
          signal. Replaces the old separate read-only odds row. */}
      {status !== 'FINISHED' && homeTeam && awayTeam && (
        <MatchPoll home={homeTeam} away={awayTeam} odds={match.odds} pick={pick} onPick={setPick} />
      )}

      {/* the 11 live attributes that drive the art — Google-style stat sheet */}
      <MatchStatsPanel
        matchId={match.id}
        home={match.h}
        away={match.a}
        odds={match.odds as [number, number, number]}
      />

      {/* final-whistle reveal: the result rendered as the winner's
          stat-driven crest */}
      <GameIdentity matchId={match.id} home={match.h} away={match.a} />

      {/* score — centered (no predictions) */}
      <div className={styles.status}>
        {loading && <span className={styles.muted}>loading…</span>}

        {!loading && status === 'FINISHED' && homeScore != null && awayScore != null && (
          <MatchResult
            homeTeam={match.h}
            awayTeam={match.a}
            homeScore={homeScore}
            awayScore={awayScore}
          />
        )}

        {!loading && status === 'LIVE' && homeScore != null && awayScore != null && (
          <div className={styles.live}>
            {match.h} {homeScore} – {awayScore} {match.a}
          </div>
        )}
      </div>

      {homeTeam && awayTeam && (
        <MatchCloset home={homeTeam} away={awayTeam} pick={pick} />
      )}

      <Link to="/matches" className={styles.back}>← back to matches</Link>
    </div>
  );
}
