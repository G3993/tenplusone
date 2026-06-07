/**
 * Prediction-market helpers.
 *
 * We only store one odds snapshot per match, so there is no real price
 * history. `marketSeries` synthesises a deterministic random walk that
 * converges exactly to the current implied probability, seeded by match
 * id so it never changes between renders.
 */

/** Vig-free implied probabilities [home, draw, away] from decimal odds. */
export function impliedProbabilities(odds: [number, number, number]): [number, number, number] {
  const raw = odds.map((o) => (o > 1 ? 1 / o : 0));
  const sum = raw.reduce((a, b) => a + b, 0) || 1;
  return [raw[0] / sum, raw[1] / sum, raw[2] / sum];
}

function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministic probability history in [0.04, 0.96], length `n`,
 * whose final value equals `end` (the current implied probability).
 */
export function marketSeries(seed: string, end: number, n = 24): number[] {
  const rand = mulberry32(hashSeed(seed));
  const walk: number[] = [];
  let p = end + (rand() - 0.5) * 0.25; // start somewhere off the current price
  for (let i = 0; i < n; i++) {
    p += (rand() - 0.5) * 0.07;
    walk.push(Math.min(0.96, Math.max(0.04, p)));
  }
  // Tilt the walk so the last point lands exactly on `end`.
  const drift = end - walk[n - 1];
  return walk.map((v, i) =>
    Math.min(0.96, Math.max(0.04, v + drift * (i / (n - 1)))),
  );
}
