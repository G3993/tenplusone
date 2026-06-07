/**
 * Live odds proxy. Fetches real prediction-market prices from Polymarket's
 * public Gamma API (no key required) server-side, normalizes team names to
 * the site's display names, and returns a compact JSON snapshot.
 *
 * Polymarket prices ARE implied probabilities (a $0.17 share = 17% chance),
 * so no vig stripping is needed. Cached at the edge for 5 minutes.
 *
 * Runs on the Vercel Edge runtime — Web APIs only, no Node deps, no key
 * exposed to the browser.
 */
export const config = { runtime: 'edge' };

const GAMMA = 'https://gamma-api.polymarket.com/events';
const GROUPS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];

// Polymarket name variants -> our display names (see src/data/teams.ts).
const ALIAS: Record<string, string> = {
  'congo dr': 'Dr Congo',
  'dr congo': 'Dr Congo',
  'democratic republic of congo': 'Dr Congo',
  'united states': 'USA',
  usa: 'USA',
  türkiye: 'Turkey',
  turkiye: 'Turkey',
  turkey: 'Turkey',
  'cape verde': 'Cabo Verde',
  'cabo verde': 'Cabo Verde',
  curaçao: 'Curacao',
  curacao: 'Curacao',
  'bosnia and herzegovina': 'Bosnia',
  'bosnia & herzegovina': 'Bosnia',
  bosnia: 'Bosnia',
  "côte d'ivoire": 'Ivory Coast',
  'cote d ivoire': 'Ivory Coast',
  'ivory coast': 'Ivory Coast',
};

function normTeam(name: string): string {
  const key = name.trim().toLowerCase();
  return ALIAS[key] ?? name.trim();
}

interface Entry {
  team: string;
  prob: number;
}

async function fetchEvent(slug: string): Promise<Entry[]> {
  try {
    const r = await fetch(`${GAMMA}?slug=${slug}`, {
      headers: { accept: 'application/json' },
    });
    if (!r.ok) return [];
    const data = await r.json();
    const ev = Array.isArray(data) ? data[0] : null;
    const markets = ev && Array.isArray(ev.markets) ? ev.markets : [];
    const out: Entry[] = [];
    for (const m of markets) {
      const team: string | undefined =
        m.groupItemTitle ||
        (typeof m.question === 'string'
          ? (m.question.match(/Will (.+?) (?:win|finish|top)/i) || [])[1]
          : undefined);
      if (!team || /^other$/i.test(team)) continue;
      let prob: number | null = null;
      try {
        const p = JSON.parse(m.outcomePrices || '[]');
        if (Array.isArray(p) && p.length) prob = Number(p[0]);
      } catch {
        /* fall through to lastTradePrice */
      }
      if ((prob == null || Number.isNaN(prob)) && typeof m.lastTradePrice === 'number') {
        prob = m.lastTradePrice;
      }
      if (prob == null || Number.isNaN(prob) || prob <= 0) continue;
      out.push({ team: normTeam(team), prob });
    }
    return out;
  } catch {
    return [];
  }
}

export default async function handler(): Promise<Response> {
  const [winner, ...groupResults] = await Promise.all([
    fetchEvent('world-cup-winner'),
    ...GROUPS.map((g) => fetchEvent(`world-cup-group-${g}-winner`)),
  ]);

  const groups: Record<string, Entry[]> = {};
  GROUPS.forEach((g, i) => {
    const list = groupResults[i];
    if (list && list.length) groups[g.toUpperCase()] = list;
  });

  const live = winner.length > 0 || Object.keys(groups).length > 0;
  const body = JSON.stringify({
    updatedAt: Date.now(),
    source: 'polymarket',
    live,
    winner,
    groups,
  });

  return new Response(body, {
    status: 200,
    headers: {
      'content-type': 'application/json',
      // edge-cache 5 min, serve stale up to 10 min while revalidating
      'cache-control': 'public, s-maxage=300, stale-while-revalidate=600',
      'access-control-allow-origin': '*',
    },
  });
}
