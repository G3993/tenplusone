import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { Line, Blank, useLineCounter } from '../components/layout/Line';
import { PixelGrid } from '../components/grid/PixelGrid';
import { MatchResult } from '../components/match/MatchResult';
import { MATCHES } from '../data/matches';
import { getTeamByName } from '../data/teams';
import { getLogoPixels } from '../data/team-logos/index';
import { fetchMatch, fetchWagerForMatch } from '../lib/api';
import type { ApiMatch, ApiWager } from '../lib/api';
import styles from './MatchDetail.module.css';

function pickLabel(pick: string, homeTeam: string, awayTeam: string) {
  if (pick === 'home') return homeTeam;
  if (pick === 'away') return awayTeam;
  return 'Draw';
}

export function MatchDetail() {
  const { id } = useParams<{ id: string }>();
  const nextLn = useLineCounter();

  const match = MATCHES.find((m) => m.id === id);

  const [apiMatch, setApiMatch] = useState<ApiMatch | null>(null);
  const [wager, setWager] = useState<ApiWager | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const email = localStorage.getItem('tenplusone-email');

    Promise.all([
      fetchMatch(id),
      email ? fetchWagerForMatch(email, id) : Promise.resolve(null),
    ])
      .then(([m, w]) => {
        setApiMatch(m);
        setWager(w);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (!match) {
    return (
      <>
        <Line n={nextLn()}>
          <span className="dim">{'// match not found'}</span>
        </Line>
        <Blank n={nextLn()} />
        <Line n={nextLn()}>
          <Link to="/matches" className={styles.predictionLink}>
            {'<- back to matches'}
          </Link>
        </Line>
      </>
    );
  }

  const homeTeam = getTeamByName(match.h);
  const awayTeam = getTeamByName(match.a);

  const homePixels = homeTeam
    ? getLogoPixels(homeTeam.slug, homeTeam.name[0])
    : getLogoPixels('', match.h[0]);
  const awayPixels = awayTeam
    ? getLogoPixels(awayTeam.slug, awayTeam.name[0])
    : getLogoPixels('', match.a[0]);

  // Determine match status from API data, fallback to SCHEDULED
  const status = apiMatch?.status || 'SCHEDULED';
  const homeScore = apiMatch?.score_home;
  const awayScore = apiMatch?.score_away;

  // Map wager status to component prop
  const wagerStatus = wager
    ? (wager.status.toLowerCase() as 'pending' | 'won' | 'lost')
    : null;
  const wagerPick = wager
    ? pickLabel(wager.pick, match.h, match.a)
    : undefined;

  return (
    <>
      <Line n={nextLn()}>
        <span className="comment">{'// MATCH DETAIL'}</span>
      </Line>
      <Line n={nextLn()}>
        <span className="comment">
          {'// '}
          {match.grp} | {match.d} | {match.t}
        </span>
      </Line>
      <Line n={nextLn()}>
        <span className="comment">
          {'// '}
          {match.v}
        </span>
      </Line>
      <Blank n={nextLn()} />

      <PixelGrid
        logoPixels={homePixels}
        matchMode={{ awayPixels, switchInterval: 4000 }}
        height="45vh"
      />

      <div className={styles.matchOverlay}>
        <span className={styles.flag}>{homeTeam?.flag}</span>
        <span>{match.h}</span>
        <span className={styles.vs}>vs</span>
        <span>{match.a}</span>
        <span className={styles.flag}>{awayTeam?.flag}</span>
      </div>

      {loading && (
        <Line n={nextLn()}>
          <span className="dim">{'// loading match data...'}</span>
        </Line>
      )}

      {!loading && status === 'FINISHED' && homeScore != null && awayScore != null && (
        <MatchResult
          homeTeam={match.h}
          awayTeam={match.a}
          homeScore={homeScore}
          awayScore={awayScore}
          wagerStatus={wagerStatus}
          wagerPick={wagerPick}
          discountCode={wager?.discount_code}
        />
      )}

      {!loading && status === 'LIVE' && homeScore != null && awayScore != null && (
        <>
          <Line n={nextLn()}>
            <span className="bright">
              {'LIVE: '}
              {match.h} {homeScore} - {awayScore} {match.a}
            </span>
          </Line>
          {wager && (
            <Line n={nextLn()}>
              <span className="dim">your pick: </span>
              <span className="bright">{wagerPick}</span>
            </Line>
          )}
        </>
      )}

      {!loading && status === 'SCHEDULED' && (
        <>
          {wager ? (
            <>
              <Line n={nextLn()}>
                <span className="dim">{'// your prediction: '}</span>
                <span className="bright">{wagerPick}</span>
              </Line>
              <Line n={nextLn()}>
                <span className="dim">{'// status: pending -- awaiting kickoff'}</span>
              </Line>
            </>
          ) : (
            <Line n={nextLn()}>
              <Link to="/slip" className={styles.predictionLink}>
                {'// place a prediction on this match ->'}
              </Link>
            </Line>
          )}
        </>
      )}

      <Blank n={nextLn()} />
      <Line n={nextLn()}>
        <Link to="/matches" className={styles.predictionLink}>
          {'<- back to matches'}
        </Link>
      </Line>
      <Blank n={nextLn()} />
      <Line n={nextLn()} className="cursor-line">
        <span className="cursor" />
      </Line>
    </>
  );
}
