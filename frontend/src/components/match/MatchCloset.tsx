import type { TeamData } from '../../data/teams';
import { TeamCloset } from '../team/TeamCloset';
import type { MatchPick } from './MatchPoll';
import styles from './MatchCloset.module.css';

interface MatchClosetProps {
  home: TeamData;
  away: TeamData;
  /** The page's pick: 'home'/'away' filters to that team's closet and reveals
   *  ALL its items; null or 'draw' previews both teams (3 items each). */
  pick?: MatchPick | null;
}

/** Match-page shop block: a preview of each team's closet (the garments
 *  carrying that crest) — a quick jump from "I'm watching this match" to
 *  "I can wear it." The crests themselves live in the page header. */
export function MatchCloset({ home, away, pick = null }: MatchClosetProps) {
  const showHome = pick !== 'away';
  const showAway = pick !== 'home';
  const focused = pick === 'home' || pick === 'away';
  return (
    <section className={styles.section} aria-label="shop the matchup">
      {showHome && (
        <div id={`closet-${home.slug}`} style={{ scrollMarginTop: 80 }}>
          <TeamCloset
            teamSlug={home.slug}
            title={home.name}
            eyebrow=""
            compact
            limit={focused ? undefined : 3}
            viewAllHref={`/team/${home.slug}`}
          />
        </div>
      )}
      {showAway && (
        <div id={`closet-${away.slug}`} style={{ scrollMarginTop: 80 }}>
          <TeamCloset
            teamSlug={away.slug}
            title={away.name}
            eyebrow=""
            compact
            limit={focused ? undefined : 3}
            viewAllHref={`/team/${away.slug}`}
          />
        </div>
      )}
    </section>
  );
}
