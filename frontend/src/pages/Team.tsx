import type { CSSProperties } from 'react';
import { useParams, Link } from 'react-router';
import { getTeamBySlug, teamAccent } from '../data/teams';
import { TeamHero } from '../components/team/TeamHero';
import { TeamCloset } from '../components/team/TeamCloset';
import { TeamStats } from '../components/team/TeamStats';
import { TeamWatch } from '../components/team/TeamWatch';
import { TeamMatches } from '../components/team/TeamMatches';
import { MeshGridBG } from '../components/home/MeshGridBG';
import { Back3D } from '../components/ui/Back3D';
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
      <MeshGridBG />
      <TeamHero team={team} />
      <div className={styles.body}>
        <TeamStats team={team} />
        {/* roster directly under the stat hub */}
        <TeamWatch team={team} />
        <TeamMatches team={team} />
      </div>
      <div className={styles.body}>
        <TeamCloset teamSlug={team.slug} eyebrow={`${team.code} Collection`} title="" />
        <Back3D to="/teams">← all teams</Back3D>
      </div>
    </div>
  );
}
