import type { CSSProperties } from 'react';
import { useParams, Link } from 'react-router';
import { getTeamBySlug, teamAccent } from '../data/teams';
import { TeamHero } from '../components/team/TeamHero';
import { TeamCloset } from '../components/team/TeamCloset';
import { TeamStats } from '../components/team/TeamStats';
import { TeamWatch } from '../components/team/TeamWatch';
import { TeamLogoGrid } from '../components/team/TeamLogoGrid';
import styles from './Team.module.css';

export function Team() {
  const { slug } = useParams<{ slug: string }>();
  const team = slug ? getTeamBySlug(slug) : undefined;

  if (!team) {
    return (
      <div className={styles.page}>
        <div className={styles.body}>
          <p className={styles.notFound}>team not found</p>
          <Link to="/teams" className={styles.back}>← all teams</Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={styles.page}
      style={{ '--accent': teamAccent(team) } as CSSProperties}
    >
      <TeamHero team={team} />
      <div className={styles.body}>
        <TeamCloset teamSlug={team.slug} title="" eyebrow="WC*26" />
        <TeamStats team={team} />
        <TeamLogoGrid team={team} />
        {/* players to watch lives at the very bottom now */}
        <TeamWatch team={team} />
        <Link to="/teams" className={styles.back}>← all teams</Link>
      </div>
    </div>
  );
}
