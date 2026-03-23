const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export async function fetchMatches() {
  const res = await fetch(`${API_BASE}/api/matches`);
  if (!res.ok) throw new Error('Failed to fetch matches');
  const data = await res.json();
  return data.matches;
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

export async function fetchMyWagers(email: string) {
  const res = await fetch(`${API_BASE}/api/wagers?email=${encodeURIComponent(email)}`);
  if (!res.ok) throw new Error('Failed to fetch wagers');
  const data = await res.json();
  return data.wagers;
}
