import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { matchesRoute } from './routes/matches';
import { wagersRoute } from './routes/wagers';

type Bindings = {
  DB: D1Database;
  SHOPIFY_ADMIN_TOKEN: string;
  SHOPIFY_STORE_DOMAIN: string;
  FOOTBALL_API_KEY: string;
  FOOTBALL_API_HOST: string;
  FRONTEND_ORIGIN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('/*', cors({
  origin: (origin, c) => {
    const allowed = [c.env.FRONTEND_ORIGIN, 'https://tenplusone.pages.dev'];
    return allowed.includes(origin) ? origin : '';
  },
}));

app.route('/api/matches', matchesRoute);
app.route('/api/wagers', wagersRoute);

app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    const { fetchAndSyncMatches } = await import('./services/football');
    const { resolveMatch } = await import('./services/resolver');

    // Sync matches from API-Football
    try {
      await fetchAndSyncMatches(env.DB, env.FOOTBALL_API_KEY, env.FOOTBALL_API_HOST);
    } catch (e) {
      console.error('Match sync failed:', e);
    }

    // Check for newly finished matches with unresolved wagers
    const { results: finishedMatches } = await env.DB.prepare(`
      SELECT DISTINCT m.id FROM matches m
      JOIN wagers w ON w.match_id = m.id
      WHERE m.status = 'FINISHED' AND w.status = 'PENDING'
    `).all();

    for (const match of finishedMatches) {
      try {
        await resolveMatch(env.DB, match.id as string, env.SHOPIFY_STORE_DOMAIN, env.SHOPIFY_ADMIN_TOKEN);
      } catch (e) {
        console.error(`Resolution failed for match ${match.id}:`, e);
      }
    }
  },
};
