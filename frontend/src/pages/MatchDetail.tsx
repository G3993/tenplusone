import { useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router';
import { MatchCrest3D } from '../components/match/MatchCrest3D';
import { useCrestSize } from '../components/matches/MatchPreview';
import { MatchCloset } from '../components/match/MatchCloset';
import { MatchMerchHero } from '../components/match/MatchMerchHero';
import { MatchPoll, type MatchPick } from '../components/match/MatchPoll';
import { MatchStatsPanel } from '../components/match/MatchStatsPanel';
import { GameIdentity } from '../components/match/GameIdentity';
import { MeshGridBG } from '../components/home/MeshGridBG';
import { Back3D } from '../components/ui/Back3D';
import { MATCHES } from '../data/matches';
import { getTeamByName } from '../data/teams';
import { useMatchLive } from '../lib/useMatchLive';
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

  // Same live feed the stat panel + identity card consume, so the page layout
  // (meta/odds vs. identity card) flips on the same FT signal they use.
  const { stats } = useMatchLive(id ?? '');
  // Your call — starts unselected on every visit (never auto-restored); picking
  // a team filters the closet below to that team's full line.
  const [searchParams] = useSearchParams();
  const urlPick = searchParams.get('pick');
  const [pick, setPick] = useState<MatchPick | null>(
    urlPick === 'home' || urlPick === 'away' || urlPick === 'draw' ? urlPick : null,
  );

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

  const status = stats.status;

  return (
    <div className={styles.page}>
      <MeshGridBG />
      {/* logos big, up top — once the match is FINISHED they move inside the
          Game Identity scoreboard, so the header version disappears */}
      {status !== 'FINISHED' && (
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
      )}

      {/* match meta + odds only while the game is undecided — once it's
          FINISHED the Game Identity card takes their place under the logos,
          with the stat sheet below it as the receipts. */}
      {status !== 'FINISHED' && (
        <div className={styles.meta}>
          <div className={styles.when}>{to12h(match.t)}</div>
          <div className={styles.venue}>{match.v}</div>
        </div>
      )}

      {/* "your call" CTA — the call buttons ARE the odds; sparkline is the live
          signal. Replaces the old separate read-only odds row. */}
      {status !== 'FINISHED' && homeTeam && awayTeam && (
        <MatchPoll home={homeTeam} away={awayTeam} odds={match.odds} pick={pick} onPick={setPick} />
      )}

      {status === 'FINISHED' && (
        <GameIdentity matchId={match.id} home={match.h} away={match.a} venue={match.v} />
      )}

      {/* the 11 live attributes that drive the art — Google-style stat sheet */}
      <MatchStatsPanel matchId={match.id} home={match.h} away={match.a} />

      {/* live score — centered (FINISHED score lives on the identity card) */}
      {status === 'LIVE' && (
        <div className={styles.status}>
          <div className={styles.live}>
            {match.h} {stats.homeGoals} – {stats.awayGoals} {match.a}
          </div>
        </div>
      )}

      {homeTeam && awayTeam && (
        <div id="match-merch">
          {status === 'FINISHED' && <MatchMerchHero matchId={match.id} home={match.h} away={match.a} />}
          <MatchCloset home={homeTeam} away={awayTeam} pick={pick} />
        </div>
      )}

      <Back3D to="/matches">← back to matches</Back3D>
    </div>
  );
}
