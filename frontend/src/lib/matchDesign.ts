// The heart of the generative live-merch engine: a match's stats -> a bounded,
// deterministic set of visual parameters that drive the crest treatment. This
// is the swap that replaces teamSeed(slug) with a match-derived seed, so the
// crest becomes a fingerprint of what actually happened on the pitch.
//
// Every output is bounded so that ANY match — a 0-0 grind or a 7-1 demolition —
// produces a wearable design, never raw noise (design premise #3).

import type { MotifId } from '../components/logos/MotifCrest';

/** Live (or final) match stats the design reads from. All optional past the
 *  score so a thin feed still produces a valid design. */
export interface MatchStats {
  homeGoals: number;
  awayGoals: number;
  /** Home share of possession, 0..100. Defaults to 50 (even). */
  possession?: number;
  /** Total cards (both teams). Drives fracture/glitch. */
  cards?: number;
  /** Total shots (both teams). Adds intensity. */
  shots?: number;
  /** Combined expected goals. Adds intensity when the game was lively. */
  xg?: number;
  /** Match minute elapsed (0..90+). 0 pre-kickoff. */
  minute: number;
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED';
}

export interface DesignParams {
  /** Deterministic seed feeding the crest generator. */
  seed: number;
  /** Color treatment. The base is mono (B&W); a decisive game earns full spectrum. */
  variant: 'spectrum' | 'mono' | 'outline';
  /** Structural motif overlay, or null for the plain spectrum/mono crest. */
  motif: MotifId | null;
  /** 0..1 — visual density (more goals = denser). */
  density: number;
  /** 0..1 — overall energy/saturation. */
  intensity: number;
  /** 0..1 — fracture/glitch from cards (the chaos of the match). */
  glitch: number;
  /** 0..360 — hue rotation; result + comeback shift it. */
  hue: number;
  /** -1..1 — left/right weighting from possession (home positive). */
  balance: number;
  /** 0..1 — motion speed of the live animation. */
  motion: number;
  /** Convenience: 'home' | 'away' | 'draw' (pending while live & level). */
  result: 'home' | 'away' | 'draw';
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Deterministic seed from the match id + its stats. Same match + same stats
 *  always yields the same design — so the frozen full-time design is reproducible
 *  for the print file. */
export function matchSeed(matchId: string, s: MatchStats): number {
  let total = 0;
  for (let i = 0; i < matchId.length; i++) total += matchId.charCodeAt(i);
  // Fold the score and discipline into the seed so the silhouette of the
  // generated pattern shifts with the result, not just the colors.
  total += s.homeGoals * 31 + s.awayGoals * 17 + (s.cards ?? 0) * 7;
  return total;
}

/**
 * Map a match (live or final) to bounded design parameters.
 *
 * Pre-kickoff the crest is the muted B&W base; as the game is played it gains
 * density, color and motion, and "decides" into a full-spectrum treatment when
 * there's a clear result. A goalless or undecided game stays restrained.
 */
export function designForMatch(matchId: string, s: MatchStats): DesignParams {
  const totalGoals = s.homeGoals + s.awayGoals;
  const diff = s.homeGoals - s.awayGoals;
  const possession = s.possession ?? 50;
  const cards = s.cards ?? 0;
  const shots = s.shots ?? 0;
  const xg = s.xg ?? totalGoals * 0.9;

  const result: DesignParams['result'] = diff > 0 ? 'home' : diff < 0 ? 'away' : 'draw';

  // How "settled" the match is: pre-kickoff 0, builds with the minute, full at FT.
  const progress = s.status === 'FINISHED' ? 1 : clamp01(s.minute / 90);
  // How "decisive" the outcome is (a blowout earns more than a 1-0).
  const decisiveness = clamp01(Math.abs(diff) / 4);

  // The base is black & white. A live, decided game earns color; a still-level
  // or pre-kickoff crest stays mono; a tense low-event game reads as outline.
  let variant: DesignParams['variant'];
  if (s.status === 'SCHEDULED') variant = 'mono';
  else if (result === 'draw') variant = totalGoals === 0 ? 'outline' : 'mono';
  else variant = progress > 0.5 && decisiveness > 0.15 ? 'spectrum' : 'mono';

  // Motif overlay: pick a structural family from the match's character, but only
  // once the game has texture (keeps early minutes clean).
  let motif: MotifId | null = null;
  if (s.status !== 'SCHEDULED' && totalGoals + cards > 0) {
    if (cards >= 3) motif = 'abstract';        // chaotic, card-heavy
    else if (totalGoals >= 4) motif = 'pattern'; // goal-fest
    else if (possession > 62 || possession < 38) motif = 'lines'; // one-sided
    else motif = 'mesh';                          // even contest
  }

  return {
    seed: matchSeed(matchId, s),
    variant,
    motif,
    density: clamp01(totalGoals / 6) * 0.7 + progress * 0.3,
    intensity: clamp01(decisiveness * 0.5 + clamp01(shots / 24) * 0.25 + clamp01(xg / 5) * 0.25),
    glitch: clamp01(cards / 8),
    // Home win warms toward gold/green, away cools toward blue/violet; draw centers.
    hue: clamp(180 + diff * 28 + (result === 'draw' ? 0 : 0), 0, 360) % 360,
    balance: clamp((possession - 50) / 50, -1, 1),
    motion: clamp01(0.25 + progress * 0.5 + decisiveness * 0.25),
    result,
  };
}

/** Stats for a not-yet-started match (the muted B&W base every shirt starts as). */
export function baseStats(): MatchStats {
  return { homeGoals: 0, awayGoals: 0, minute: 0, status: 'SCHEDULED' };
}
