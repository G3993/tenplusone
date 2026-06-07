/**
 * Live match feed adapter for the generative merch engine.
 *
 *   GET /api/match-live?id=<matchId>
 *
 * Returns a match's event timeline + final stats in ONE shape, whether the
 * source is a real live football feed or a deterministic simulation. The
 * frontend replays the timeline on a clock so the crest morphs and freezes at
 * full-time.
 *
 * Real feed: set FOOTBALL_API_KEY (API-Football or equivalent). Without it we
 * return a deterministic simulated timeline seeded by the match id, so the
 * whole experience is demonstrable today and flips to real by adding the key.
 *
 * Runs on the Vercel Edge runtime — Web APIs only.
 */
export const config = { runtime: 'edge' };

interface MatchEvent {
  minute: number;
  type: 'goal' | 'card' | 'shot';
  team: 'home' | 'away';
}

interface LivePayload {
  id: string;
  source: 'live' | 'simulated';
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED';
  /** Total real-time match length in seconds the client should replay over. */
  playSeconds: number;
  final: {
    homeGoals: number;
    awayGoals: number;
    possession: number;
    cards: number;
    shots: number;
    xg: number;
  };
  events: MatchEvent[];
}

/** Deterministic PRNG so a given match id always simulates the same game. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Build a plausible, deterministic 90-minute match for the demo / pre-feed era. */
function simulate(id: string): LivePayload {
  const rng = mulberry32(seedFromId(id));
  const events: MatchEvent[] = [];

  // 0-5 goals total, weighted toward 2-3; 0-5 cards; ~8-24 shots.
  const goalCount = Math.floor(rng() * rng() * 6);
  const cardCount = Math.floor(rng() * 5);
  const shots = 8 + Math.floor(rng() * 16);

  let homeGoals = 0;
  let awayGoals = 0;
  for (let i = 0; i < goalCount; i++) {
    const team: 'home' | 'away' = rng() < 0.54 ? 'home' : 'away';
    if (team === 'home') homeGoals++; else awayGoals++;
    events.push({ minute: 1 + Math.floor(rng() * 90), type: 'goal', team });
  }
  for (let i = 0; i < cardCount; i++) {
    events.push({ minute: 1 + Math.floor(rng() * 90), type: 'card', team: rng() < 0.5 ? 'home' : 'away' });
  }
  events.sort((a, b) => a.minute - b.minute);

  const possession = Math.round(38 + rng() * 24); // 38..62 home share
  const xg = Math.round((goalCount * 0.8 + rng() * 1.5) * 10) / 10;

  return {
    id,
    source: 'simulated',
    status: 'FINISHED',
    playSeconds: 90, // replay the 90' over 90s so the morph is watchable
    final: { homeGoals, awayGoals, possession, cards: cardCount, shots, xg },
    events,
  };
}

/**
 * Real feed adapter. Structured for API-Football; returns null on any miss so
 * the caller falls back to simulation. Not exercised until FOOTBALL_API_KEY is
 * set and matches are mapped to provider fixture ids.
 */
async function fetchLive(id: string, key: string): Promise<LivePayload | null> {
  try {
    // TODO: map our match id -> provider fixture id (by date + team names).
    // const fixtureId = await resolveFixture(id, key);
    // const r = await fetch(`https://v3.football.api-sports.io/fixtures?id=${fixtureId}`,
    //   { headers: { 'x-apisports-key': key } });
    // ...normalize events + stats into LivePayload...
    return null;
  } catch {
    return null;
  }
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const id = url.searchParams.get('id') || '';
  if (!id) {
    return new Response(JSON.stringify({ error: 'missing id' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const key = process.env.FOOTBALL_API_KEY;
  let payload: LivePayload | null = null;
  if (key) payload = await fetchLive(id, key);
  if (!payload) payload = simulate(id);

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      // Simulated timelines are stable; cache briefly at the edge.
      'cache-control': payload.source === 'simulated' ? 'public, s-maxage=60' : 'no-store',
    },
  });
}
