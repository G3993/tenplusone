import { useMemo } from 'react';
import { MotifCrest } from '../logos/MotifCrest';
import { teamSeed } from '../logos/spectrumMotif';
import { getLogoPixels } from '../../data/team-logos/index.ts';

interface Props {
  slug: string;
  name: string;
  /** rendered pixel size of the crest */
  size?: number;
}

/**
 * The animated Team 3D crest for a match-up header — the live canvas motif
 * (extruded/rotating 3D), each team in its own colours. Replaces the static
 * 3D PNG so the two crests playing each other actually animate.
 */
export function MatchCrest3D({ slug, name, size = 180 }: Props) {
  const pixels = useMemo(() => getLogoPixels(slug, name[0]), [slug, name]);
  const seed = useMemo(() => teamSeed(slug), [slug]);
  return <MotifCrest pixels={pixels} seed={seed} size={size} motif="team3d" teamId={slug} />;
}
