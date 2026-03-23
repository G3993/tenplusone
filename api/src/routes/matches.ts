import { Hono } from 'hono';

type Bindings = { DB: D1Database; FOOTBALL_API_KEY: string; FOOTBALL_API_HOST: string; SHOPIFY_ADMIN_TOKEN: string; SHOPIFY_STORE_DOMAIN: string };
const app = new Hono<{ Bindings: Bindings }>();

// GET /api/matches - list all matches (cached in D1)
app.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM matches ORDER BY kickoff ASC'
  ).all();
  return c.json({ matches: results });
});

// GET /api/matches/:id - single match detail
app.get('/:id', async (c) => {
  const id = c.req.param('id');
  const match = await c.env.DB.prepare('SELECT * FROM matches WHERE id = ?').bind(id).first();
  if (!match) return c.json({ error: 'Match not found' }, 404);
  return c.json({ match });
});

// POST /api/matches/sync - trigger API-Football sync (admin/cron only)
app.post('/sync', async (c) => {
  const { fetchAndSyncMatches } = await import('../services/football');
  const count = await fetchAndSyncMatches(c.env.DB, c.env.FOOTBALL_API_KEY, c.env.FOOTBALL_API_HOST);
  return c.json({ synced: count });
});

// POST /api/matches/seed - seed with prototype hardcoded data (dev only)
app.post('/seed', async (c) => {
  const matches = [
    { id: 'm1', home_team: 'Mexico', away_team: 'South Africa', kickoff: '2026-06-11T17:00:00-04:00', group_id: 'A', venue: 'Estadio Azteca, Mexico City', odds_home: 1.45, odds_draw: 4.20, odds_away: 7.50 },
    { id: 'm2', home_team: 'Canada', away_team: 'TBD (UEFA Path A)', kickoff: '2026-06-12T12:00:00-04:00', group_id: 'B', venue: 'BMO Field, Toronto', odds_home: 2.80, odds_draw: 3.10, odds_away: 2.60 },
    { id: 'm3', home_team: 'United States', away_team: 'Paraguay', kickoff: '2026-06-12T18:00:00-04:00', group_id: 'D', venue: 'SoFi Stadium, Los Angeles', odds_home: 1.55, odds_draw: 3.80, odds_away: 6.00 },
    { id: 'm4', home_team: 'Brazil', away_team: 'Morocco', kickoff: '2026-06-12T21:00:00-04:00', group_id: 'C', venue: 'AT&T Stadium, Dallas', odds_home: 1.90, odds_draw: 3.30, odds_away: 4.20 },
    { id: 'm5', home_team: 'Germany', away_team: 'Cura\u00e7ao', kickoff: '2026-06-13T12:00:00-04:00', group_id: 'E', venue: 'Gillette Stadium, Boston', odds_home: 1.10, odds_draw: 9.00, odds_away: 25.0 },
    { id: 'm6', home_team: 'Spain', away_team: 'Cabo Verde', kickoff: '2026-06-13T15:00:00-04:00', group_id: 'H', venue: 'MetLife Stadium, NJ', odds_home: 1.08, odds_draw: 10.0, odds_away: 28.0 },
    { id: 'm7', home_team: 'Netherlands', away_team: 'Japan', kickoff: '2026-06-13T18:00:00-04:00', group_id: 'F', venue: 'Arrowhead Stadium, KC', odds_home: 2.10, odds_draw: 3.30, odds_away: 3.50 },
    { id: 'm8', home_team: 'South Korea', away_team: 'TBD (UEFA Path D)', kickoff: '2026-06-13T21:00:00-04:00', group_id: 'A', venue: 'Estadio BBVA, Monterrey', odds_home: 2.40, odds_draw: 3.20, odds_away: 3.00 },
    { id: 'm9', home_team: 'Belgium', away_team: 'Egypt', kickoff: '2026-06-14T12:00:00-04:00', group_id: 'G', venue: 'NRG Stadium, Houston', odds_home: 1.70, odds_draw: 3.60, odds_away: 5.00 },
    { id: 'm10', home_team: 'Argentina', away_team: 'Algeria', kickoff: '2026-06-14T15:00:00-04:00', group_id: 'J', venue: 'Hard Rock Stadium, Miami', odds_home: 1.30, odds_draw: 5.50, odds_away: 10.0 },
    { id: 'm11', home_team: 'France', away_team: 'Senegal', kickoff: '2026-06-14T18:00:00-04:00', group_id: 'I', venue: 'Lumen Field, Seattle', odds_home: 1.60, odds_draw: 3.80, odds_away: 5.50 },
    { id: 'm12', home_team: 'England', away_team: 'Croatia', kickoff: '2026-06-14T21:00:00-04:00', group_id: 'L', venue: 'MetLife Stadium, NJ', odds_home: 1.85, odds_draw: 3.40, odds_away: 4.40 },
    { id: 'm13', home_team: 'Portugal', away_team: 'Colombia', kickoff: '2026-06-15T15:00:00-04:00', group_id: 'K', venue: 'AT&T Stadium, Dallas', odds_home: 2.00, odds_draw: 3.30, odds_away: 3.80 },
    { id: 'm14', home_team: 'Switzerland', away_team: 'Qatar', kickoff: '2026-06-15T18:00:00-04:00', group_id: 'B', venue: 'BMO Field, Toronto', odds_home: 1.65, odds_draw: 3.70, odds_away: 5.50 },
    { id: 'm15', home_team: 'Australia', away_team: 'TBD (UEFA Path C)', kickoff: '2026-06-15T21:00:00-04:00', group_id: 'D', venue: "Levi's Stadium, SF", odds_home: 3.20, odds_draw: 3.20, odds_away: 2.30 },
    { id: 'm16', home_team: 'Haiti', away_team: 'Scotland', kickoff: '2026-06-16T12:00:00-04:00', group_id: 'C', venue: 'NRG Stadium, Houston', odds_home: 4.50, odds_draw: 3.50, odds_away: 1.80 },
    { id: 'm17', home_team: "C\u00f4te d'Ivoire", away_team: 'Ecuador', kickoff: '2026-06-16T15:00:00-04:00', group_id: 'E', venue: 'Lincoln Financial, Philly', odds_home: 2.50, odds_draw: 3.20, odds_away: 2.90 },
    { id: 'm18', home_team: 'Saudi Arabia', away_team: 'Uruguay', kickoff: '2026-06-16T18:00:00-04:00', group_id: 'H', venue: 'Hard Rock Stadium, Miami', odds_home: 4.50, odds_draw: 3.50, odds_away: 1.80 },
    { id: 'm19', home_team: 'Tunisia', away_team: 'TBD (UEFA Path B)', kickoff: '2026-06-16T21:00:00-04:00', group_id: 'F', venue: 'AT&T Stadium, Dallas', odds_home: 3.50, odds_draw: 3.20, odds_away: 2.10 },
    { id: 'm20', home_team: 'Iran', away_team: 'New Zealand', kickoff: '2026-06-17T12:00:00-04:00', group_id: 'G', venue: 'Mercedes-Benz, Atlanta', odds_home: 1.70, odds_draw: 3.50, odds_away: 5.20 },
    { id: 'm21', home_team: 'Norway', away_team: 'TBD (IC Playoff 2)', kickoff: '2026-06-17T15:00:00-04:00', group_id: 'I', venue: "Levi's Stadium, SF", odds_home: 1.35, odds_draw: 5.00, odds_away: 9.00 },
    { id: 'm22', home_team: 'Austria', away_team: 'Jordan', kickoff: '2026-06-17T18:00:00-04:00', group_id: 'J', venue: 'Mercedes-Benz, Atlanta', odds_home: 1.50, odds_draw: 4.00, odds_away: 7.00 },
    { id: 'm23', home_team: 'Uzbekistan', away_team: 'TBD (IC Playoff 1)', kickoff: '2026-06-17T21:00:00-04:00', group_id: 'K', venue: 'Arrowhead Stadium, KC', odds_home: 2.20, odds_draw: 3.30, odds_away: 3.30 },
    { id: 'm24', home_team: 'Ghana', away_team: 'Panama', kickoff: '2026-06-17T18:00:00-04:00', group_id: 'L', venue: 'Lincoln Financial, Philly', odds_home: 2.00, odds_draw: 3.40, odds_away: 3.80 },
  ];

  for (const m of matches) {
    await c.env.DB.prepare(`
      INSERT OR REPLACE INTO matches (id, home_team, away_team, kickoff, status, group_id, venue, odds_home, odds_draw, odds_away)
      VALUES (?, ?, ?, ?, 'SCHEDULED', ?, ?, ?, ?, ?)
    `).bind(m.id, m.home_team, m.away_team, m.kickoff, m.group_id, m.venue, m.odds_home, m.odds_draw, m.odds_away).run();
  }
  return c.json({ seeded: matches.length });
});

// POST /api/matches/:id/resolve - resolve a finished match (admin)
app.post('/:id/resolve', async (c) => {
  const { resolveMatch } = await import('../services/resolver');
  const id = c.req.param('id');
  try {
    const result = await resolveMatch(c.env.DB, id, c.env.SHOPIFY_STORE_DOMAIN, c.env.SHOPIFY_ADMIN_TOKEN);
    return c.json(result);
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

export { app as matchesRoute };
