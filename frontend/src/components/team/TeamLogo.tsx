import { useState } from 'react';
import type { TeamData } from '../../data/teams';

// iFC Brand System crests. Increment on every logo asset change.
const LOGO_VERSION = 2;

interface TeamLogoProps {
  team: Pick<TeamData, 'slug' | 'flag' | 'code'>;
  variant?: 'black' | 'white';
  size?: number;
  className?: string;
}

export function TeamLogo({ team, variant = 'black', size = 24, className }: TeamLogoProps) {
  const [failed, setFailed] = useState(false);
  // Bump LOGO_VERSION whenever the crest SVGs change so browsers don't serve
  // a stale cached copy from the stable /logos/*.svg path.
  const src = variant === 'white'
    ? `/logos/white/${team.slug}.svg?v=${LOGO_VERSION}`
    : `/logos/${team.slug}.svg?v=${LOGO_VERSION}`;

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
