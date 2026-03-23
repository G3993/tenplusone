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
    // TODO: Poll API-Football for live match updates
    // TODO: Resolve finished matches
  },
};
