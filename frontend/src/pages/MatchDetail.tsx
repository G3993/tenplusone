import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { MatchCrest3D } from '../components/match/MatchCrest3D';
import { MatchResult } from '../components/match/MatchResult';
import { MatchCloset } from '../components/match/MatchCloset';
import { MatchPoll } from '../components/match/MatchPoll';
import { MATCHES } from '../data/matches';
import { getTeamByName } from '../data/teams';
import { fetchMatch } from '../lib/api';
import type { ApiMatch } from '../lib/api';
import styles from './MatchDetail.module.css';

export function MatchDetail() {
  const { id } = useParams<{ id: string }>();

  const match = MATCHES.find((m) => m.id === id);

  const [apiMatch, setApiMatch] = useState<ApiMatch | null>(null);
  const [loading, setLoading] = useState(true);

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
      {/* logos big, up top */}
      <header className={styles.crests}>
        {homeTeam ? (
          <Link to={`/team/${homeTeam.slug}`} className={styles.crest}>
            <MatchCrest3D slug={homeTeam.slug} name={match.h} size={180} />
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
            <MatchCrest3D slug={awayTeam.slug} name={match.a} size={180} />
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
        <div className={styles.group}>{match.grp}</div>
        <div className={styles.when}>{match.d} · {match.t}</div>
        <div className={styles.venue}>{match.v}</div>
      </div>

      {/* "your call" CTA — the call buttons ARE the odds; sparkline is the live
          signal. Replaces the old separate read-only odds row. */}
      {status !== 'FINISHED' && homeTeam && awayTeam && (
        <MatchPoll matchId={match.id} home={homeTeam} away={awayTeam} odds={match.odds} />
      )}

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
        <MatchCloset home={homeTeam} away={awayTeam} />
      )}

      <Link to="/matches" className={styles.back}>← back to matches</Link>
    </div>
  );
}
