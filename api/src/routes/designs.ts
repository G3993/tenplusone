import { Hono } from 'hono';
import { createPrintfulProduct } from '../services/printful';

type Bindings = {
  DB: D1Database;
  DESIGNS_BUCKET: R2Bucket;
  PRINTFUL_API_TOKEN: string;
  R2_PUBLIC_URL: string;
  SHOPIFY_ADMIN_TOKEN: string;
  SHOPIFY_STORE_DOMAIN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

/**
 * POST /api/designs/upload
 * Accepts multipart form data with image, matchId, title, description.
 * Uploads image to R2 and creates a Printful sync product.
 */
app.post('/upload', async (c) => {
  const formData = await c.req.formData();
  const image = formData.get('image') as File | null;
  const matchId = formData.get('matchId') as string | null;
  const title = formData.get('title') as string | null;
  const description = formData.get('description') as string | null;

  if (!image || !matchId || !title) {
    return c.json({ error: 'Missing required fields: image, matchId, title' }, 400);
  }

  const designId = crypto.randomUUID();

  // Upload image to R2
  const arrayBuffer = await image.arrayBuffer();
  const key = `designs/${designId}.png`;
  await c.env.DESIGNS_BUCKET.put(key, arrayBuffer, {
    httpMetadata: { contentType: 'image/png' },
  });
  const imageUrl = `${c.env.R2_PUBLIC_URL}/${key}`;

  // Create Printful product (continue on failure)
  let printfulProductId = '';
  let syncStatus = 'pending';
  try {
    const result = await createPrintfulProduct(
      c.env.PRINTFUL_API_TOKEN,
      title,
      imageUrl
    );
    printfulProductId = String(result.id);
    syncStatus = 'synced';
  } catch (err) {
    console.error('Printful product creation failed:', err);
    syncStatus = 'failed';
  }

  // Ensure designs table exists (idempotent)
  await c.env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS designs (
      id TEXT PRIMARY KEY,
      match_id TEXT NOT NULL,
      image_url TEXT,
      shopify_product_id TEXT,
      printful_product_id TEXT,
      printful_sync_status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `).run();

  // Store design record
  await c.env.DB.prepare(
    'INSERT INTO designs (id, match_id, image_url, printful_product_id, printful_sync_status) VALUES (?, ?, ?, ?, ?)'
  ).bind(designId, matchId, imageUrl, printfulProductId, syncStatus).run();

  return c.json({
    success: true,
    designId,
    imageUrl,
    printfulProductId: printfulProductId || null,
    syncStatus,
    note: syncStatus === 'synced'
      ? 'Product created in Printful. It will auto-sync to Shopify.'
      : syncStatus === 'failed'
      ? 'Design saved to R2. Printful product creation failed -- retry or create manually.'
      : 'Design saved. Printful not configured.',
  });
});

/**
 * GET /api/designs/:matchId
 * Retrieve designs for a given match.
 */
app.get('/:matchId', async (c) => {
  const matchId = c.req.param('matchId');

  try {
    const { results } = await c.env.DB.prepare(
      'SELECT id, match_id, image_url, printful_product_id, printful_sync_status, created_at FROM designs WHERE match_id = ? ORDER BY created_at DESC'
    ).bind(matchId).all();
    return c.json({ designs: results });
  } catch {
    return c.json({ designs: [] });
  }
});

/**
 * POST /api/designs/retry/:designId
 * Retry failed Printful sync for a design.
 */
app.post('/retry/:designId', async (c) => {
  const designId = c.req.param('designId');
  const design = await c.env.DB.prepare(
    'SELECT id, image_url FROM designs WHERE id = ?'
  ).bind(designId).first();

  if (!design) return c.json({ error: 'Design not found' }, 404);
  if (!design.image_url) return c.json({ error: 'No image URL' }, 400);

  try {
    const result = await createPrintfulProduct(
      c.env.PRINTFUL_API_TOKEN,
      `Match Design ${designId.substring(0, 8)}`,
      design.image_url as string
    );
    await c.env.DB.prepare(
      'UPDATE designs SET printful_product_id = ?, printful_sync_status = ? WHERE id = ?'
    ).bind(String(result.id), 'synced', designId).run();
    return c.json({ success: true, printfulProductId: result.id });
  } catch (err) {
    return c.json({ error: 'Printful sync failed', details: String(err) }, 502);
  }
});

export const designRoutes = app;
