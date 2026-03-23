const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787';

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

export async function fetchMatches() {
  const res = await fetch(`${API_BASE}/api/matches`);
  if (!res.ok) throw new Error('Failed to fetch matches');
  const data = await res.json();
  return data.matches;
}

export async function fetchMatch(id: string): Promise<ApiMatch | null> {
  try {
    const res = await fetch(`${API_BASE}/api/matches/${id}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.match as ApiMatch;
  } catch {
    return null;
  }
}

export async function placeWager(params: {
  email: string;
  matchId: string;
  pick: 'home' | 'away' | 'draw';
  productId?: string;
}) {
  const res = await fetch(`${API_BASE}/api/wagers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to place prediction');
  }
  return res.json();
}

export async function fetchMyWagers(email: string): Promise<ApiWager[]> {
  const res = await fetch(`${API_BASE}/api/wagers?email=${encodeURIComponent(email)}`);
  if (!res.ok) throw new Error('Failed to fetch wagers');
  const data = await res.json();
  return data.wagers;
}

export async function fetchWagerForMatch(
  email: string,
  matchId: string
): Promise<ApiWager | null> {
  try {
    const wagers = await fetchMyWagers(email);
    return wagers.find((w: ApiWager) => w.match_id === matchId) || null;
  } catch {
    return null;
  }
}
