import type { TeamData } from '../../data/teams';
import { TeamCloset } from '../team/TeamCloset';
import styles from './MatchCloset.module.css';

interface MatchClosetProps {
  home: TeamData;
  away: TeamData;
}

/** Match-page shop block: a preview of each team's closet (the garments
 *  carrying that crest) — a quick jump from "I'm watching this match" to
 *  "I can wear it." The crests themselves live in the page header. */
export function MatchCloset({ home, away }: MatchClosetProps) {
  return (
    <section className={styles.section} aria-label="shop the matchup">
      <div id={`closet-${home.slug}`} style={{ scrollMarginTop: 80 }}>
        <TeamCloset
          teamSlug={home.slug}
          title={`${home.name.toLowerCase()} closet`}
          limit={3}
          viewAllHref={`/team/${home.slug}`}
        />
      </div>
      <div id={`closet-${away.slug}`} style={{ scrollMarginTop: 80 }}>
        <TeamCloset
          teamSlug={away.slug}
          title={`${away.name.toLowerCase()} closet`}
          limit={3}
          viewAllHref={`/team/${away.slug}`}
        />
      </div>
    </section>
  );
}
