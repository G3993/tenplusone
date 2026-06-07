// Local persistence layer. Predictions and match lookups used to hit a
// localhost backend that never shipped to production; this version
// reads matches from the static dataset and persists wagers to
// localStorage so the predictions tab actually works.
//
// When a real backend exists (Vercel KV / Supabase), swap the impls
// here — every consumer keeps the same interface.

import { MATCHES } from '../data/matches';

const STORAGE_KEY = 'tenplusone-wagers';

export interface ApiMatch {
  id: string;
  home_team: string;
  away_team: string;
  kickoff: string;
  group_id: string;
  venue: string;
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED';
  score_home?: number;
  score_away?: number;
  odds_home: number;
  odds_draw: number;
  odds_away: number;
}

export interface ApiWager {
  id: string;
  user_email: string;
  match_id: string;
  pick: 'home' | 'away' | 'draw';
  status: 'PENDING' | 'WON' | 'LOST';
  product_id?: string;
  discount_code?: string;
  home_team?: string;
  away_team?: string;
  score_home?: number;
  score_away?: number;
}

function toApiMatch(m: typeof MATCHES[number]): ApiMatch {
  return {
    id: m.id,
    home_team: m.h,
    away_team: m.a,
    kickoff: `${m.d} · ${m.t}`,
    group_id: m.grp,
    venue: m.v,
    status: 'SCHEDULED',
    odds_home: m.odds[0],
    odds_draw: m.odds[1],
    odds_away: m.odds[2],
  };
}

function readWagers(): ApiWager[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ApiWager[]) : [];
  } catch {
    return [];
  }
}

function writeWagers(w: ApiWager[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(w));
  } catch {
    /* storage full or unavailable */
  }
}

export async function fetchMatches(): Promise<ApiMatch[]> {
  return MATCHES.map(toApiMatch);
}

export async function fetchMatch(id: string): Promise<ApiMatch | null> {
  const m = MATCHES.find((x) => x.id === id);
  return m ? toApiMatch(m) : null;
}

export async function placeWager(params: {
  email: string;
  matchId: string;
  pick: 'home' | 'away' | 'draw';
  productId?: string;
}): Promise<{ wager: ApiWager }> {
  const all = readWagers();
  // one wager per (email, match) — replace if it exists
  const filtered = all.filter(
    (w) => !(w.user_email === params.email && w.match_id === params.matchId),
  );
  const match = MATCHES.find((m) => m.id === params.matchId);
  const wager: ApiWager = {
    id: `w_${params.matchId}_${Date.now()}`,
    user_email: params.email,
    match_id: params.matchId,
    pick: params.pick,
    status: 'PENDING',
    product_id: params.productId,
    home_team: match?.h,
    away_team: match?.a,
  };
  writeWagers([...filtered, wager]);
  return { wager };
}

export async function fetchMyWagers(email: string): Promise<ApiWager[]> {
  return readWagers().filter((w) => w.user_email === email);
}

export async function fetchWagerForMatch(
  email: string,
  matchId: string,
): Promise<ApiWager | null> {
  const mine = await fetchMyWagers(email);
  return mine.find((w) => w.match_id === matchId) ?? null;
}
