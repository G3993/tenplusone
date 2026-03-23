import { Hono } from 'hono';

type Bindings = { DB: D1Database; SHOPIFY_ADMIN_TOKEN: string; SHOPIFY_STORE_DOMAIN: string };
const app = new Hono<{ Bindings: Bindings }>();

// POST /api/wagers - place a prediction
app.post('/', async (c) => {
  const body = await c.req.json<{
    email: string;
    matchId: string;
    pick: 'home' | 'away' | 'draw';
    productId?: string;
  }>();

  // Validate match exists and is SCHEDULED
  const match = await c.env.DB.prepare(
    'SELECT * FROM matches WHERE id = ? AND status = ?'
  ).bind(body.matchId, 'SCHEDULED').first();
  if (!match) return c.json({ error: 'Match not available for predictions' }, 400);

  // Check for existing wager on this match by this email
  const existing = await c.env.DB.prepare(
    'SELECT id FROM wagers WHERE user_email = ? AND match_id = ?'
  ).bind(body.email, body.matchId).first();
  if (existing) return c.json({ error: 'Already predicted on this match' }, 409);

  // Create wager
  const id = crypto.randomUUID();
  await c.env.DB.prepare(`
    INSERT INTO wagers (id, user_email, match_id, pick, product_id, status)
    VALUES (?, ?, ?, ?, ?, 'PENDING')
  `).bind(id, body.email, body.matchId, body.pick, body.productId || null).run();

  return c.json({ wager: { id, matchId: body.matchId, pick: body.pick, status: 'PENDING' } }, 201);
});

// GET /api/wagers?email=xxx - get user's wagers
app.get('/', async (c) => {
  const email = c.req.query('email');
  if (!email) return c.json({ error: 'email query param required' }, 400);
  const { results } = await c.env.DB.prepare(
    'SELECT w.*, m.home_team, m.away_team, m.score_home, m.score_away FROM wagers w JOIN matches m ON w.match_id = m.id WHERE w.user_email = ? ORDER BY w.created_at DESC'
  ).bind(email).all();
  return c.json({ wagers: results });
});

// GET /api/wagers/:id - single wager detail
app.get('/:id', async (c) => {
  const id = c.req.param('id');
  const wager = await c.env.DB.prepare(
    'SELECT w.*, m.home_team, m.away_team, m.score_home, m.score_away FROM wagers w JOIN matches m ON w.match_id = m.id WHERE w.id = ?'
  ).bind(id).first();
  if (!wager) return c.json({ error: 'Wager not found' }, 404);
  return c.json({ wager });
});

export { app as wagersRoute };
