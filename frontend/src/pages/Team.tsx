import { useParams } from 'react-router';
import { getTeamBySlug } from '../data/teams';
import { TeamHeader } from '../components/team/TeamHeader';
import { TeamCloset } from '../components/team/TeamCloset';
import { Line, useLineCounter } from '../components/layout/Line';
import styles from './Team.module.css';

export function Team() {
  const { slug } = useParams<{ slug: string }>();
  const nextLn = useLineCounter();
  const team = slug ? getTeamBySlug(slug) : undefined;

  if (!team) {
    return (
      <div className={styles.page}>
        <Line n={nextLn()}>
          <span className="dim">{'// team not found'}</span>
        </Line>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <TeamHeader team={team} />
      <TeamCloset teamSlug={team.slug} />
    </div>
  );
}
