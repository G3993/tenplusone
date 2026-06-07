import { useParams, useSearchParams } from 'react-router';
import { MotifCrest, type MotifId } from '../components/logos/MotifCrest';
import { teamSeed } from '../components/logos/spectrumMotif';
import { getLogoPixels } from '../data/team-logos/index.ts';
import { getTeamBySlug } from '../data/teams';

/**
 * Offline render target for print artwork. Paints a single crest in a chosen
 * motif at an arbitrary resolution on a transparent backdrop, so a headless
 * browser can grab `canvas.toDataURL()` and save a print-ready PNG.
 *   /render/crest/:slug?motif=cube&size=2048
 * Not linked anywhere — tooling-only.
 */
export function RenderCrest() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [sp] = useSearchParams();
  const size = Math.max(64, Math.min(4512, Number(sp.get('size') || 2048)));
  const motif = (sp.get('motif') || 'cube') as MotifId;
  const team = getTeamBySlug(slug);
  const pixels = getLogoPixels(slug, team ? team.name[0] : 'A');

  return (
    <div
      id="render-root"
      data-slug={slug}
      style={{ background: 'transparent', width: size, height: size }}
    >
      <MotifCrest
        pixels={pixels}
        seed={teamSeed(slug)}
        size={size}
        motif={motif}
        teamId={slug}
      />
    </div>
  );
}
