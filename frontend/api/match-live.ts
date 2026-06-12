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
  /** Full 11-attribute team stat lines (the numbers that drive the art). */
  teamStats: { home: TeamStatLine; away: TeamStatLine };
  /** For LIVE games: the real current minute the playhead should hold at. */
  liveMinute?: number;
  events: MatchEvent[];
}

export interface TeamStatLine {
  goals: number;
  shots: number;
  shotsOnTarget: number;
  possession: number;
  passes: number;
  passAccuracy: number;
  fouls: number;
  yellowCards: number;
  redCards: number;
  offsides: number;
  corners: number;
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

  // Split the match into two full 11-attribute stat lines. Shares lean with
  // possession so the lines feel like one coherent game.
  const homeShare = possession / 100;
  const homeShots = Math.max(homeGoals, Math.round(shots * (0.3 + homeShare * 0.7)));
  const awayShots = Math.max(awayGoals, shots - homeShots);
  const homeCards = events.filter((e) => e.type === 'card' && e.team === 'home').length;
  const awayCards = cardCount - homeCards;
  const mk = (goals: number, sh: number, poss: number, yc: number): TeamStatLine => {
    const passes = Math.round(poss * (7 + rng() * 4));
    return {
      goals,
      shots: sh,
      shotsOnTarget: Math.max(goals, Math.round(sh * (0.3 + rng() * 0.3))),
      possession: poss,
      passes,
      passAccuracy: Math.round(74 + poss * 0.25 + rng() * 6),
      fouls: 5 + Math.floor(rng() * 10),
      yellowCards: yc,
      redCards: rng() < 0.06 ? 1 : 0,
      offsides: Math.floor(rng() * 4),
      corners: Math.max(0, Math.round(sh * (0.25 + rng() * 0.2))),
    };
  };
  const teamStats = {
    home: mk(homeGoals, homeShots, possession, homeCards),
    away: mk(awayGoals, awayShots, 100 - possession, awayCards),
  };

  return {
    id,
    source: 'simulated',
    status: 'FINISHED',
    playSeconds: 90, // replay the 90' over 90s so the morph is watchable
    final: { homeGoals, awayGoals, possession, cards: cardCount, shots, xg },
    teamStats,
    events,
  };
}

/**
 * Real feed adapter — ESPN's public World Cup API (no key needed).
 * Maps our match (team names + ISO date) to the ESPN event, then normalizes
 * the box score into our 11-attribute lines and the key events into our
 * timeline. Returns null on any miss so the caller falls back to simulation.
 */
import { MATCHES } from '../src/data/matches';

const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world';

/* Team-name matching: fold diacritics (Türkiye, Curaçao), strip to a-z, then
 * map our short display names to ESPN's official forms. */
/* note: no alias for Bosnia — 'bosnia' substring-matches both of ESPN's
 * forms ("Bosnia and Herzegovina" / "Bosnia-Herzegovina") */
const TEAM_ALIASES: Record<string, string> = {
  usa: 'unitedstates',
  turkey: 'turkiye',
  ivorycoast: 'cotedivoire',
  capeverde: 'caboverde',
};
const norm = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '');
const canon = (s: string) => {
  const n = norm(s);
  return TEAM_ALIASES[n] ?? n;
};
const sameName = (a: string, b: string) => {
  const ca = canon(a);
  const cb = canon(b);
  return ca === cb || ca.includes(cb) || cb.includes(ca);
};

/* Kickoff instant for a fixture: iso carries local stadium time, t carries the
 * timezone label — add its UTC offset so "hasn't kicked off yet" is real. */
const TZ_HOURS: Record<string, number> = { PDT: 7, PST: 8, MDT: 6, MST: 7, CDT: 5, CST: 6, EDT: 4, EST: 5 };
function kickoffMs(m: { iso?: string; t?: string }): number | null {
  if (!m.iso) return null;
  const t = Date.parse(`${m.iso}:00Z`);
  if (!Number.isFinite(t)) return null;
  const tz = (m.t ?? '').split(' ')[1] ?? '';
  return t + (TZ_HOURS[tz] ?? 5) * 3_600_000;
}

function clockToMinute(v: string | undefined): number {
  if (!v) return 0;
  const m = v.match(/(\d+)'(?:\+(\d+))?/);
  return m ? Math.min(120, Number(m[1]) + (m[2] ? Number(m[2]) : 0)) : 0;
}

function num(stats: Record<string, string>, key: string): number {
  const v = parseFloat(stats[key] ?? '0');
  return Number.isFinite(v) ? v : 0;
}

function lineFrom(stats: Record<string, string>, goals: number): TeamStatLine {
  return {
    goals,
    shots: Math.round(num(stats, 'totalShots')),
    shotsOnTarget: Math.round(num(stats, 'shotsOnTarget')),
    possession: Math.round(num(stats, 'possessionPct')),
    passes: Math.round(num(stats, 'totalPasses')),
    passAccuracy: Math.round(num(stats, 'passPct') * 100),
    fouls: Math.round(num(stats, 'foulsCommitted')),
    yellowCards: Math.round(num(stats, 'yellowCards')),
    redCards: Math.round(num(stats, 'redCards')),
    offsides: Math.round(num(stats, 'offsides')),
    corners: Math.round(num(stats, 'wonCorners')),
  };
}

async function fetchLive(id: string): Promise<LivePayload | null> {
  try {
    const match = MATCHES.find((m) => m.id === id);
    if (!match || !match.iso) return null;
    const ymd = match.iso.slice(0, 10).replace(/-/g, '');

    // 1. find the ESPN event for this fixture by date + team names
    const sb = await fetch(`${ESPN}/scoreboard?dates=${ymd}`).then((r) => r.json());
    const event = (sb.events || []).find((e: any) => {
      const names = (e.competitions?.[0]?.competitors || []).map((c: any) => c.team?.displayName || '');
      return [match.h, match.a].every((w) => names.some((n: string) => sameName(n, w)));
    });
    if (!event) return null;

    // 2. pull the box score + timeline
    const sum = await fetch(`${ESPN}/summary?event=${event.id}`).then((r) => r.json());
    const comp = event.competitions[0];
    const byName = (name: string) =>
      (comp.competitors || []).find((c: any) => sameName(c.team?.displayName || '', name));
    const homeC = byName(match.h);
    const awayC = byName(match.a);
    if (!homeC || !awayC) return null;
    const homeGoals = Number(homeC.score ?? 0);
    const awayGoals = Number(awayC.score ?? 0);

    const statsFor = (c: any): Record<string, string> => {
      const t = (sum.boxscore?.teams || []).find((b: any) => b.team?.id === c.team?.id);
      const out: Record<string, string> = {};
      for (const s of t?.statistics || []) out[s.name] = s.displayValue;
      return out;
    };
    const home = lineFrom(statsFor(homeC), homeGoals);
    const away = lineFrom(statsFor(awayC), awayGoals);

    // 3. timeline: goals + cards with real minutes
    const events: MatchEvent[] = [];
    for (const k of sum.keyEvents || []) {
      const text = (k.type?.text || '').toLowerCase();
      const teamName = k.team?.displayName || '';
      const side: 'home' | 'away' | null = teamName
        ? sameName(teamName, match.h) ? 'home'
        : sameName(teamName, match.a) ? 'away'
        : null
        : null;
      if (!side) continue;
      const minute = clockToMinute(k.clock?.displayValue);
      if (text.includes('goal') && !text.includes('own goal called back')) {
        events.push({ minute, type: 'goal', team: side });
      } else if (text.includes('card')) {
        events.push({ minute, type: 'card', team: side });
      }
    }
    events.sort((a, b) => a.minute - b.minute);

    const state = comp.status?.type?.state; // 'pre' | 'in' | 'post'
    const status = state === 'post' ? 'FINISHED' : state === 'in' ? 'LIVE' : 'SCHEDULED';
    const liveMinute = status === 'LIVE' ? clockToMinute(comp.status?.displayClock) : 90;

    return {
      id,
      source: 'live',
      status,
      // finished games replay the full 90' over 90s; live games catch up fast
      playSeconds: status === 'LIVE' ? 8 : 90,
      liveMinute,
      final: {
        homeGoals,
        awayGoals,
        possession: home.possession,
        cards: home.yellowCards + home.redCards + away.yellowCards + away.redCards,
        shots: home.shots + away.shots,
        xg: 0,
      },
      teamStats: { home, away },
      events,
    };
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

  let payload: LivePayload | null = await fetchLive(id);
  if (!payload) {
    payload = simulate(id);
    // Never fabricate a result for a game that hasn't kicked off — the
    // simulator is a post-kickoff fallback only.
    const match = MATCHES.find((m) => m.id === id);
    const kick = match ? kickoffMs(match) : null;
    if (kick !== null && Date.now() < kick) payload.status = 'SCHEDULED';
  }

  const cache =
    payload.source === 'simulated' ? 'public, s-maxage=60'
    : payload.status === 'FINISHED' ? 'public, s-maxage=300'
    : 'no-store';
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json', 'cache-control': cache },
  });
}
