import { Link } from 'react-router';
import type { TeamData } from '../../data/teams';
import { MATCHES } from '../../data/matches';
import { getTeamByName } from '../../data/teams';
import { getLogoPixels } from '../../data/team-logos/index.ts';
import { MotifCrest } from '../logos/MotifCrest';
import { teamSeed } from '../logos/spectrumMotif';
import styles from './TeamMatches.module.css';

/** Animated neon-3D (team3d) crest + the team name underneath. */
function Crest({ name }: { name: string }) {
  const team = getTeamByName(name);
  if (!team) return <span className={styles.team}><span className={styles.slot} /></span>;
  return (
    <span className={styles.team}>
      <MotifCrest
        motif="team3d"
        teamId={team.slug}
        seed={teamSeed(team.slug)}
        pixels={getLogoPixels(team.slug, team.name[0])}
        size={104}
        className={styles.crest}
      />
      <span className={styles.name}>{team.code}</span>
    </span>
  );
}

/** A team's fixtures, stripped to just the two animated crests with a "v"
 *  between. Sits at the bottom of the team page. */
export function TeamMatches({ team }: { team: TeamData }) {
  const fixtures = MATCHES.filter((m) => m.h === team.name || m.a === team.name);
  if (fixtures.length === 0) return null;

  return (
    <section className={styles.wrap}>
      <header className={styles.head}>
        <span className={styles.eyebrow}>Upcoming Matches</span>
      </header>
      <div className={styles.list}>
        {fixtures.map((m) => (
          <Link key={m.id} to={`/match/${m.id}`} className={styles.row}>
            <Crest name={m.h} />
            <span className={styles.v}>VS</span>
            <Crest name={m.a} />
          </Link>
        ))}
      </div>
    </section>
  );
}
