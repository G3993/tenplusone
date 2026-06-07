/**
 * Team strength ratings + a match-odds projection model.
 *
 * These ratings drive the *projected* 1X2 odds shown on match cards before
 * sportsbooks/prediction-markets price individual games. They are a model,
 * not a live market — the UI labels them as such. The live layer
 * (`src/lib/odds.ts`) can re-derive strengths from Polymarket's live
 * tournament-winner probabilities and feed them through `matchProbs` so the
 * same model stays consistent whether seeded by the baseline or by the market.
 *
 * Ratings are on a ~50–90 scale reflecting June 2026 form / market standing.
 * Names MUST match the display names in `teams.ts` exactly.
 */
export const STRENGTH: Record<string, number> = {
  // top tier
  France: 90, Spain: 90, Argentina: 85, England: 85, Brazil: 84, Portugal: 83,
  Germany: 80, Netherlands: 79,
  // strong
  Belgium: 76, Croatia: 75, Uruguay: 75, Colombia: 74, Morocco: 74,
  Norway: 73, Switzerland: 72, Senegal: 72, Japan: 71, Turkey: 71, USA: 71,
  Mexico: 70, Ecuador: 70, Austria: 70, 'South Korea': 70, Czechia: 70,
  Sweden: 70, Egypt: 70,
  // mid
  'Ivory Coast': 69, Canada: 69, Australia: 68, Algeria: 68, Iran: 68,
  Bosnia: 67, Paraguay: 66, Scotland: 66, 'Dr Congo': 65, Ghana: 65,
  Tunisia: 65, Qatar: 64, 'Saudi Arabia': 63, Uzbekistan: 63,
  // lower
  'South Africa': 62, Iraq: 61, Panama: 60, Jordan: 59, 'Cabo Verde': 58,
  'New Zealand': 58, Haiti: 57, Curacao: 53,
};

const DEFAULT_RATING = 68;

export function ratingOf(team: string): number {
  return STRENGTH[team] ?? DEFAULT_RATING;
}

/**
 * Project [home, draw, away] probabilities from two strength ratings.
 * `homeEdge` is a small nudge for the nominal home side (group stage only).
 */
export function matchProbs(
  homeRating: number,
  awayRating: number,
  homeEdge = 2.5,
): [number, number, number] {
  const diff = homeRating + homeEdge - awayRating;
  // logistic split of the decisive (non-draw) mass toward the stronger side
  const pHomeCore = 1 / (1 + Math.pow(10, -diff / 15));
  // draw mass peaks (~0.30) for even matchups, shrinks for mismatches
  const pDraw = 0.17 + 0.13 * Math.exp(-Math.abs(diff) / 9);
  const decisive = 1 - pDraw;
  return [pHomeCore * decisive, pDraw, (1 - pHomeCore) * decisive];
}

/** Fair decimal odds from probabilities (no vig — the UI strips vig anyway). */
export function probsToOdds(p: [number, number, number]): [number, number, number] {
  const d = (x: number) => +(1 / Math.max(0.02, x)).toFixed(2);
  return [d(p[0]), d(p[1]), d(p[2])];
}

/** Convenience: decimal 1X2 odds projected straight from team names. */
export function projectOdds(
  home: string,
  away: string,
  homeEdge = 2.5,
): [number, number, number] {
  return probsToOdds(matchProbs(ratingOf(home), ratingOf(away), homeEdge));
}
