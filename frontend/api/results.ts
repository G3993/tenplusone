/**
 * All tournament results so far, from ESPN's public World Cup feed.
 *
 *   GET /api/results
 *
 * Returns every fixture from the tournament start through today:
 *   { results: [{ home, away, homeGoals, awayGoals, state }] }
 * state: 'pre' | 'in' | 'post'. The client computes group standings from
 * the 'post' games and marks 'in' games as live.
 *
 * Runs on the Vercel Edge runtime — Web APIs only.
 */
export const config = { runtime: 'edge' };

const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world';
const START = Date.UTC(2026, 5, 11); // tournament kickoff, Jun 11 2026

interface ResultRow {
  home: string;
  away: string;
  homeGoals: number;
  awayGoals: number;
  state: 'pre' | 'in' | 'post';
  minute?: string;
}

function ymd(t: number): string {
  const d = new Date(t);
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
}

export default async function handler(): Promise<Response> {
  // every tournament day from kickoff through tomorrow (UTC skew safety)
  const days: string[] = [];
  for (let t = START; t <= Date.now() + 86_400_000; t += 86_400_000) days.push(ymd(t));

  const results: ResultRow[] = [];
  await Promise.all(
    days.map(async (d) => {
      try {
        const sb = await fetch(`${ESPN}/scoreboard?dates=${d}`).then((r) => r.json());
        for (const e of sb.events || []) {
          const comp = e.competitions?.[0];
          if (!comp) continue;
          const homeC = (comp.competitors || []).find((c: any) => c.homeAway === 'home');
          const awayC = (comp.competitors || []).find((c: any) => c.homeAway === 'away');
          if (!homeC || !awayC) continue;
          results.push({
            home: homeC.team?.displayName || '',
            away: awayC.team?.displayName || '',
            homeGoals: Number(homeC.score ?? 0),
            awayGoals: Number(awayC.score ?? 0),
            state: comp.status?.type?.state ?? 'pre',
            minute: comp.status?.displayClock,
          });
        }
      } catch {
        /* skip a bad day rather than failing the whole board */
      }
    }),
  );

  return new Response(JSON.stringify({ results }), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      // refresh every 2 minutes so live games keep the board moving
      'cache-control': 'public, s-maxage=120',
    },
  });
}
