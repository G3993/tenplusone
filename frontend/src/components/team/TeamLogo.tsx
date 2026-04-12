import { useState } from 'react';
import type { TeamData } from '../../data/teams';

interface TeamLogoProps {
  team: Pick<TeamData, 'slug' | 'flag' | 'code'>;
  variant?: 'black' | 'white';
  size?: number;
  className?: string;
}

export function TeamLogo({ team, variant = 'black', size = 24, className }: TeamLogoProps) {
  const [failed, setFailed] = useState(false);
  const src = variant === 'white'
    ? `/logos/white/${team.slug}.svg`
    : `/logos/${team.slug}.svg`;

  if (failed) {
    return (
      <span
        className={className}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, fontSize: size * 0.9, lineHeight: 1 }}
        aria-label={team.code}
      >
        {team.flag}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={team.code}
      width={size}
      height={size}
      className={className}
      style={{ display: 'inline-block', imageRendering: 'pixelated', verticalAlign: 'middle' }}
      onError={() => setFailed(true)}
    />
  );
}
