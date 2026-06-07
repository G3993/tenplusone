import { useState } from 'react';
import type { TeamData } from '../../data/teams';
import { useThemeStore } from '../../stores/theme';

// iFC Brand System crests. Increment on every logo asset change.
// v5: every crest normalized into a uniform 32×32 frame (2u padding,
// artwork bbox-fit + centered) so logo grids never break.
// v6: refreshed from the latest design-bundle SVGs (newest crest art).
// v7: regenerated from scripts/team_pixels.json (32x32 vector-grid package) via
// scripts/pixels-to-svg.py, so the runtime crests match the pixel grid.
const LOGO_VERSION = 7;

interface TeamLogoProps {
  team: Pick<TeamData, 'slug' | 'flag' | 'code'> & { name?: string };
  variant?: 'black' | 'white';
  size?: number;
  className?: string;
  /** Pixel-cell shape. 'square' = the normalized PNG mark (default), 'circle' =
   *  the rounded-cell vector crest from /logos/final-circle. */
  shape?: 'square' | 'circle';
  /** Optional explicit alt. Defaults to "{name} crest" or "{code} crest". */
  alt?: string;
}

export function TeamLogo({ team, size = 24, className, alt, shape = 'square' }: TeamLogoProps) {
  const [failed, setFailed] = useState(false);
  const theme = useThemeStore((s) => s.theme);
  // Crests follow the theme so they always contrast with the page surface:
  // white silhouette on dark, black silhouette on light. Bump LOGO_VERSION
  // whenever the crest SVGs change so browsers don't serve a stale copy.
  // Circle crests live as vector SVGs (svg = black, white = white); square
  // crests are pre-aligned normalized PNGs.
  const src = shape === 'circle'
    ? `/logos/final-circle/${theme === 'dark' ? 'white' : 'svg'}/${team.slug}.svg?v=${LOGO_VERSION}`
    : theme === 'dark'
      ? `/logos/norm/white/${team.slug}.png?v=${LOGO_VERSION}`
      : `/logos/norm/black/${team.slug}.png?v=${LOGO_VERSION}`;

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

  const altText = alt ?? `${team.name ?? team.code} crest`;

  // The normalized PNGs (`/logos/norm/{black,white}/<slug>.png`) already
  // encode the iFC Brand System rule: 45-unit canvas with 2-unit (4.444%)
  // transparent inset on every side. That's why we ship PNGs instead of
  // raw SVGs at runtime — every crest is pre-aligned to the same grid so
  // any layout that lines them up stays optically clean.
  return (
    <img
      src={src}
      alt={altText}
      width={size}
      height={size}
      className={className}
      loading="lazy"
      decoding="async"
      style={{ display: 'inline-block', imageRendering: shape === 'circle' ? 'auto' : 'pixelated', verticalAlign: 'middle' }}
      onError={() => setFailed(true)}
    />
  );
}
