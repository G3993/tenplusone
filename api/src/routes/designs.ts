import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  SHOPIFY_ADMIN_TOKEN: string;
  SHOPIFY_STORE_DOMAIN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

/**
 * POST /api/designs/upload
 * Accepts multipart form data with image, matchId, title, description.
 * Stores design metadata in D1 and creates a Shopify product (without image).
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

  // For v1: store the image as base64 in D1 (simple, no R2 setup needed)
  const arrayBuffer = await image.arrayBuffer();
  const base64 = btoa(
    String.fromCharCode(...new Uint8Array(arrayBuffer))
  );
  const imageDataUrl = `data:image/png;base64,${base64}`;

  const designId = crypto.randomUUID();

  // Create Shopify product (without image -- admin must attach manually for v1)
  let shopifyProductId = '';
  try {
    shopifyProductId = await createShopifyProduct(
      c.env.SHOPIFY_STORE_DOMAIN,
      c.env.SHOPIFY_ADMIN_TOKEN,
      title,
      description || '',
      matchId
    );
  } catch (err) {
    console.error('Shopify product creation failed:', err);
    // Continue without Shopify -- design is still stored
  }

  // Ensure designs table exists (idempotent)
  await c.env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS designs (
      id TEXT PRIMARY KEY,
      match_id TEXT NOT NULL,
      image_url TEXT,
      shopify_product_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `).run();

  // Store design record
  await c.env.DB.prepare(
    'INSERT INTO designs (id, match_id, image_url, shopify_product_id) VALUES (?, ?, ?, ?)'
  ).bind(designId, matchId, imageDataUrl, shopifyProductId).run();

  return c.json({
    success: true,
    designId,
    productId: shopifyProductId || null,
    designUrl: imageDataUrl.substring(0, 50) + '...',
    note: shopifyProductId
      ? 'Product created. Attach design image manually in Shopify admin.'
      : 'Design saved. Shopify product creation skipped (no token or error).',
  });
});

/**
 * GET /api/designs/:matchId
 * Retrieve designs for a given match.
 */
app.get('/:matchId', async (c) => {
  const matchId = c.req.param('matchId');

  // Check if table exists first
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT id, match_id, shopify_product_id, created_at FROM designs WHERE match_id = ? ORDER BY created_at DESC'
    ).bind(matchId).all();
    return c.json({ designs: results });
  } catch {
    return c.json({ designs: [] });
  }
});

export const designRoutes = app;

// -- Shopify product creation helper --

async function createShopifyProduct(
  storeDomain: string,
  adminToken: string,
  title: string,
  description: string,
  matchId: string
): Promise<string> {
  if (!adminToken || !storeDomain) {
    console.log('Shopify credentials not configured, skipping product creation');
    return '';
  }

  const { createAdminApiClient } = await import('@shopify/admin-api-client');

  const admin = createAdminApiClient({
    storeDomain,
    apiVersion: '2025-10',
    accessToken: adminToken,
  });

  const CREATE_PRODUCT = `#graphql
    mutation CreateProduct($input: ProductInput!) {
      productCreate(input: $input) {
        product {
          id
          title
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const response = await admin.request(CREATE_PRODUCT, {
    variables: {
      input: {
        title,
        descriptionHtml: `<p>${description}</p>`,
        productType: 'Generative Print',
        tags: [matchId, 'generative', 'one-of-one'],
        status: 'DRAFT',
      },
    },
  });

  const data = response.data as {
    productCreate?: {
      product?: { id: string };
      userErrors?: Array<{ field: string; message: string }>;
    };
  };

  const errors = data?.productCreate?.userErrors;
  if (errors && errors.length > 0) {
    throw new Error(`Shopify product creation failed: ${errors.map((e) => e.message).join(', ')}`);
  }

  return data?.productCreate?.product?.id || '';
}
