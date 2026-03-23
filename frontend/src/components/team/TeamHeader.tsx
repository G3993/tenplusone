import { Line, Blank, useLineCounter } from '../layout/Line';
import { PixelGrid } from '../grid/PixelGrid';
import { getLogoPixels } from '../../data/team-logos/index';
import type { TeamData } from '../../data/teams';
import styles from './TeamHeader.module.css';

interface TeamHeaderProps {
  team: TeamData;
}

export function TeamHeader({ team }: TeamHeaderProps) {
  const nextLn = useLineCounter();
  const logoPixels = getLogoPixels(team.slug, team.name[0]);

  return (
    <div className={styles.header}>
      <Line n={nextLn()}>
        <span className={styles.teamName}>
          {team.flag} {team.name}
        </span>
        <span className={styles.teamCode}> [{team.code}]</span>
      </Line>
      <Line n={nextLn()}>
        <span className={styles.group}>// Group {team.group}</span>
      </Line>
      <Blank n={nextLn()} />
      <PixelGrid logoPixels={logoPixels} height="50vh" />
    </div>
  );
}
