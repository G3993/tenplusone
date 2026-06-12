import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { type Match } from '../../data/matches';
import { getTeamByName } from '../../data/teams';
import { getLogoPixels } from '../../data/team-logos/index.ts';
import { MotifCrest } from '../logos/MotifCrest';
import { InViewport } from '../util/InViewport';
import { teamSeed } from '../logos/spectrumMotif';
import { OddsButton } from './OddsButton';
import { useMatchResult, sameTeam } from '../../lib/useResults';
import { TeamLogo } from '../team/TeamLogo';
import styles from './MatchPreview.module.css';

/** "13:00 PDT" → "1:00 PM PDT" — human 12-hour clock, not 24-hour. */
function to12h(t: string): string {
  const mt = t.match(/^(\d{1,2}):(\d{2})\s*(.*)$/);
  if (!mt) return t;
  let h = Number(mt[1]);
  const min = mt[2];
  const tz = mt[3];
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${min} ${ampm}${tz ? ` ${tz}` : ''}`;
}

/** One team container: just the neon-3D crest + name, links to the team.
 *  `animate` drives the live team3d animation (gated to the viewport so a long
 *  match list doesn't run dozens of rAF loops at once); otherwise it paints a
 *  single still frame. */
function TeamPanel({ name, area, size, animate }: { name: string; area: string; size: number; animate: boolean }) {
  const team = getTeamByName(name);
  const crestProps = team
    ? { motif: 'team3d' as const, teamId: team.slug, seed: teamSeed(team.slug), pixels: getLogoPixels(team.slug, team.name[0]), size, className: styles.crest }
    : null;
  const crestEl = !crestProps ? (
    <span className={styles.slot} style={{ width: size, height: size }} />
  ) : animate ? (
    <InViewport
      style={{ display: 'block', width: size, height: size }}
      fallback={<MotifCrest still {...crestProps} />}
    >
      {() => <MotifCrest {...crestProps} />}
    </InViewport>
  ) : (
    <MotifCrest still {...crestProps} />
  );
  const crest = (
    <>
      {crestEl}
      {/* full team name under the crest (abbreviation is kept for the center
          match-detail label only) */}
      <span className={styles.cName}>{team?.name ?? name}</span>
    </>
  );
  const cls = `${styles.teamPanel} ${area}`;
  return team ? (
    <Link to={`/team/${team.slug}`} className={cls}>{crest}</Link>
  ) : (
    <span className={cls}>{crest}</span>
  );
}

/** Match card: on desktop a three-column grid — home team · match detail · away
 *  team. Stacks on mobile (teams on top, detail below).
 *  `hideOdds` (homepage) drops the three odds boxes, leaving the centered
 *  date/venue between the teams. */
/** Crest size: 112px on desktop, 80px on mobile — sized so the matchup logos
 *  feel balanced in the container and the card breathes. */
export function useCrestSize(): number {
  const [size, setSize] = useState(136);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 560px)');
    const apply = () => setSize(mq.matches ? 96 : 136);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  return size;
}

/** Plain crest (no link wrapper) for the finished-match result card. */
function ResultCrest({ name, size }: { name: string; size: number }) {
  const team = getTeamByName(name);
  if (!team) return <span style={{ width: size, height: size, display: 'inline-block' }} />;
  return (
    <MotifCrest
      still
      motif="team3d"
      teamId={team.slug}
      seed={teamSeed(team.slug)}
      pixels={getLogoPixels(team.slug, team.name[0])}
      size={size}
    />
  );
}

export function MatchPreview({ m, hideOdds = false, animate = false }: { m: Match; hideOdds?: boolean; animate?: boolean }) {
  const crestSize = useCrestSize();
  const home = getTeamByName(m.h);
  const away = getTeamByName(m.a);
  const result = useMatchResult(m.h, m.a);
  const tokenFor: Record<string, string> = {
    '1': home?.code ?? m.h,
    X: 'DRAW',
    '2': away?.code ?? m.a,
  };

  // 1 / X / 2 odds, each labelled with the team code (or DRAW).
  const ODDS: { code: string; pick: 'home' | 'draw' | 'away'; odds: number }[] = [
    { code: tokenFor['1'], pick: 'home', odds: m.odds[0] },
    { code: 'DRAW', pick: 'draw', odds: m.odds[1] },
    { code: tokenFor['2'], pick: 'away', odds: m.odds[2] },
  ];

  // already played: the result card — winner's crest big (both on a draw),
  // then mini logo · final score · mini logo, then the date
  if (result && result.state === 'post') {
    const ourHomeIsRowHome = sameTeam(result.home, m.h);
    const hs = ourHomeIsRowHome ? result.homeGoals : result.awayGoals;
    const as = ourHomeIsRowHome ? result.awayGoals : result.homeGoals;
    const winner = hs > as ? m.h : as > hs ? m.a : null;
    return (
      <article className={`${styles.match} ${styles.matchDone}`}>
        <span className={styles.field} aria-hidden="true" />
        <Link to={`/match/${m.id}`} className={styles.resultWrap}>
          <span className={styles.ftTag}>FT</span>
          <span className={styles.winnerStage}>
            {winner ? (
              <ResultCrest name={winner} size={crestSize + 24} />
            ) : (
              <>
                <ResultCrest name={m.h} size={crestSize} />
                <ResultCrest name={m.a} size={crestSize} />
              </>
            )}
          </span>
          <span className={styles.scoreRow}>
            {home && <TeamLogo team={home} variant="white" size={40} />}
            <span className={styles.scoreVal}>{hs} – {as}</span>
            {away && <TeamLogo team={away} variant="white" size={40} />}
          </span>
        </Link>
      </article>
    );
  }

  return (
    <article className={styles.match}>
      {/* green perspective grid floor along the bottom, fading to black and
          scrolling toward the viewer */}
      <span className={styles.field} aria-hidden="true" />

      {/* left team */}
      <TeamPanel name={m.h} area={styles.homeArea} size={crestSize} animate={animate} />

      {/* small vs between the crests (mobile layout only) */}
      <span className={styles.vsMid} aria-hidden="true">vs</span>

      {/* middle: detail */}
      <div className={styles.detail}>
        <Link to={`/match/${m.id}`} className={styles.meta}>
          <span className={styles.metaTeams}>
            {home?.code ?? m.h}
            <span className={styles.metaVs}>vs</span>
            {away?.code ?? m.a}
          </span>
          <span className={styles.metaWhen}>{[m.d, to12h(m.t)].filter(Boolean).join(' · ')}</span>
        </Link>

        {!hideOdds && (
          /* three odds boxes — odds value with the team abbreviation under it */
          <div className={styles.odds3}>
            {ODDS.map((o) => (
              <OddsButton
                key={o.pick}
                matchId={m.id}
                pick={o.pick}
                odds={o.odds}
                token={o.code}
                sub={o.code}
                homeTeam={m.h}
                awayTeam={m.a}
              />
            ))}
          </div>
        )}
      </div>

      {/* right team */}
      <TeamPanel name={m.a} area={styles.awayArea} size={crestSize} animate={animate} />
    </article>
  );
}
