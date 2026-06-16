import { getTeamByName, teamAccent } from '../../data/teams';
import { getLogoPixels } from '../../data/team-logos/index.ts';
import { teamSeed } from '../logos/spectrumMotif';
import { teamClashColors, setMotif, setMotifDark, setMotifShape, setMotifSeed, renderMotif } from '../logos/motifEngine';
import { FIELD_CONCEPTS, renderField } from '../logos/fieldEngine';

const rgbHex = (c: number[]) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

export interface PaintIdentityOpts {
  /** team whose identity to paint */
  name: string;
  /** the match's home team name — used to pick the home/away stat line */
  home: string;
  /** the two teams' live stat lines (from useMatchLive); may be undefined.
   *  Loosely typed — the engine reads stat keys off it and casts internally. */
  teams?: { home: unknown; away: unknown } | null;
  /** per-player roster line {num, scored, name} for name/number-driven styles */
  roster?: Array<{ num: number | null; scored?: boolean; name?: string }>;
  /** logo style motif key (team3d, abstract, internet, …) */
  variantMotif: string;
  /** stat-field concept key for the negative-space field */
  fieldConcept: string;
  /** colour mood: 'team' | 'bw' | 'spectrum' */
  palette: string;
  /** pixels per grid cell (size = 32 * capCell) */
  capCell: number;
  /** animation time in seconds; when set the field + logo animate */
  time?: number;
  /** background fill behind the grid */
  bg?: string;
}

/** The full printable symbol — black background + aligned grid + stat field +
 *  logo — painted onto `cv` at 32*capCell square. The single source of truth for
 *  the game identity, shared by the identity card, the result export, and the
 *  merch mockups so they never drift apart. */
export function paintIdentity(cv: HTMLCanvasElement, o: PaintIdentityOpts): void {
  const team = getTeamByName(o.name);
  if (!team) return;
  const line = o.teams ? (o.name === o.home ? o.teams.home : o.teams.away) : undefined;
  const pixels0 = getLogoPixels(team.slug, team.name[0]);
  const W = 32 * o.capCell;
  cv.width = W; cv.height = W;
  const ctx = cv.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = o.bg ?? '#000000';
  ctx.fillRect(0, 0, W, W);
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 1;
  for (let k = 0; k <= 32; k++) {
    const p = Math.round(k * o.capCell) + 0.5;
    ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, W); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(W, p); ctx.stroke();
  }

  const concept = (FIELD_CONCEPTS.find((c) => c.key === o.fieldConcept) ?? FIELD_CONCEPTS[0]).key;
  const fcv = document.createElement('canvas');
  renderField(fcv, pixels0, {
    cell: o.capCell, concept, stats: line as unknown as Record<string, number>,
    colors: teamClashColors(team.slug).map(rgbHex), seed: teamSeed(team.slug),
    roster: o.roster, palette: o.palette, forExport: true, bg: 'rgba(0,0,0,0)',
    time: o.time, animate: o.time != null,
  });
  ctx.drawImage(fcv, 0, 0, W, W);

  const lcv = document.createElement('canvas');
  setMotif(o.variantMotif); setMotifDark(true); setMotifShape('square'); setMotifSeed(teamSeed(team.slug));
  renderMotif(lcv, pixels0.map((v) => v + 1), {
    cell: o.capCell, applyFill: true, teamId: team.slug,
    animate: o.time != null, time: o.time ?? 0, forExport: true,
    bg: 'rgba(0,0,0,0)', off: 'rgba(0,0,0,0)', roster: o.roster,
  });
  ctx.drawImage(lcv, 0, 0, W, W);
}

export { teamAccent };
