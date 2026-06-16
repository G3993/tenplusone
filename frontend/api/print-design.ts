/**
 * Print loop for the frozen full-time design.
 *
 *   POST /api/print-design
 *   body: { matchId, title, imageBase64 }   (imageBase64 = hi-res PNG, no data: prefix)
 *
 * Takes the frozen generated crest, uploads it to Printify, creates a tee with
 * that art as the print file, and publishes it. This is the step that turns "a
 * design that formed live" into "a shirt you can buy."
 *
 * Credential-gated. Without the Printify env vars it returns
 * { configured: false } so the UI can say "print pipeline connects when the key
 * is added" instead of erroring. Set:
 *   PRINTIFY_API_TOKEN      — Printify personal access token
 *   PRINTIFY_SHOP_ID        — the connected shop id
 *   PRINTIFY_TEE_BLUEPRINT  — blueprint id for the base tee
 *   PRINTIFY_TEE_PROVIDER   — print-provider id for that blueprint
 *
 * The product only shows on the HEADLESS storefront (www.internetfc.com) once
 * it's published to publication 145681481898. Printify publishes the product to
 * the Shopify *store*, but not to the headless sales channel — so step 4 below
 * waits for Printify to sync the Shopify product, then publishes it to the
 * headless publication via Shopify Admin (needs an shpat_ token with
 * write_publications). It's best-effort: if the admin creds are absent the mint
 * still succeeds, we just report headlessPublished:false. Set:
 *   SHOPIFY_ADMIN_TOKEN     — shpat_ token with write_publications
 *   SHOPIFY_STORE_DOMAIN    — e.g. internet-soccer-club.myshopify.com
 *   SHOPIFY_PUBLICATION_ID  — headless publication id (defaults to 145681481898)
 *
 * Runs on the Vercel Edge runtime — Web APIs only.
 */
export const config = { runtime: 'edge' };

const PRINTIFY = 'https://api.printify.com/v1';
const SHOPIFY_API_VERSION = '2024-10';
const DEFAULT_PUBLICATION_ID = '145681481898';

interface Body {
  matchId?: string;
  title?: string;
  imageBase64?: string;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return json({ error: 'POST only' }, 405);
  }

  const token = process.env.PRINTIFY_API_TOKEN;
  const shopId = process.env.PRINTIFY_SHOP_ID;
  const blueprint = process.env.PRINTIFY_TEE_BLUEPRINT;
  const provider = process.env.PRINTIFY_TEE_PROVIDER;

  if (!token || !shopId || !blueprint || !provider) {
    // Honest, non-error response: the magic is built, the pipe just isn't wired.
    return json({
      configured: false,
      message:
        'Print pipeline ready. Add PRINTIFY_API_TOKEN, PRINTIFY_SHOP_ID, ' +
        'PRINTIFY_TEE_BLUEPRINT, PRINTIFY_TEE_PROVIDER to mint frozen designs.',
    });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return json({ error: 'bad json' }, 400);
  }
  const { matchId, title, imageBase64 } = body;
  if (!imageBase64 || !title) return json({ error: 'missing title or imageBase64' }, 400);

  const auth = { Authorization: `Bearer ${token}`, 'content-type': 'application/json' };

  try {
    // 1) Upload the generated art to Printify's media library.
    const up = await fetch(`${PRINTIFY}/uploads/images.json`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ file_name: `${matchId ?? 'match'}-design.png`, contents: imageBase64 }),
    });
    if (!up.ok) return json({ error: 'upload failed', detail: await up.text() }, 502);
    const upload = await up.json();

    // 2) Create the product with that upload as the front print area.
    const create = await fetch(`${PRINTIFY}/shops/${shopId}/products.json`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({
        title,
        description: `Generated from match ${matchId ?? ''}. One-of-one full-time design.`,
        blueprint_id: Number(blueprint),
        print_provider_id: Number(provider),
        // Variants must be enabled per blueprint; left to the shop's defaults via
        // a follow-up GET in production. Print areas reference the upload id.
        print_areas: [
          { variant_ids: [], placeholders: [{ position: 'front', images: [{ id: upload.id, x: 0.5, y: 0.5, scale: 1, angle: 0 }] }] },
        ],
      }),
    });
    if (!create.ok) return json({ error: 'create failed', detail: await create.text() }, 502);
    const product = await create.json();

    // 3) Publish to the connected Shopify store.
    await fetch(`${PRINTIFY}/shops/${shopId}/products/${product.id}/publish.json`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ title: true, description: true, images: true, variants: true, tags: true }),
    });

    // 4) Publish to the headless storefront publication so it appears on
    //    www.internetfc.com. Printify syncs the Shopify product asynchronously;
    //    poll for the synced Shopify product id, then publish it via Admin API.
    const headless = await publishToHeadless(token, shopId, product.id);

    return json({ configured: true, productId: product.id, title, ...headless });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
}

/**
 * After Printify pushes a product to Shopify it populates the product's
 * `external` field with the Shopify product id. We poll for that, then publish
 * the Shopify product to the headless publication. Best-effort: any failure
 * returns headlessPublished:false with a reason instead of throwing, so the
 * mint itself is never blocked.
 */
async function publishToHeadless(
  printifyToken: string,
  shopId: string,
  printifyProductId: string,
): Promise<{ headlessPublished: boolean; headlessReason?: string; shopifyProductId?: string }> {
  const adminToken = process.env.SHOPIFY_ADMIN_TOKEN;
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const publicationId = process.env.SHOPIFY_PUBLICATION_ID ?? DEFAULT_PUBLICATION_ID;
  if (!adminToken || !domain) {
    return { headlessPublished: false, headlessReason: 'SHOPIFY_ADMIN_TOKEN / SHOPIFY_STORE_DOMAIN not set' };
  }

  // Poll Printify for the synced Shopify product id (external.id).
  const auth = { Authorization: `Bearer ${printifyToken}`, 'content-type': 'application/json' };
  let shopifyId: string | undefined;
  for (let attempt = 0; attempt < 8 && !shopifyId; attempt++) {
    if (attempt > 0) await sleep(1500);
    const r = await fetch(`${PRINTIFY}/shops/${shopId}/products/${printifyProductId}.json`, { headers: auth });
    if (!r.ok) continue;
    const p = await r.json();
    const ext = p?.external?.id;
    if (ext) shopifyId = String(ext);
  }
  if (!shopifyId) {
    return { headlessPublished: false, headlessReason: 'Shopify product id not synced from Printify yet' };
  }

  // Publish the Shopify product to the headless publication.
  const gid = `gid://shopify/Product/${shopifyId}`;
  const pubGid = `gid://shopify/Publication/${publicationId}`;
  const mutation = `mutation Publish($id: ID!, $pubId: ID!) {
    publishablePublish(id: $id, input: [{ publicationId: $pubId }]) {
      userErrors { field message }
    }
  }`;
  const res = await fetch(`https://${domain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'X-Shopify-Access-Token': adminToken, 'content-type': 'application/json' },
    body: JSON.stringify({ query: mutation, variables: { id: gid, pubId: pubGid } }),
  });
  if (!res.ok) {
    return { headlessPublished: false, headlessReason: `admin api ${res.status}`, shopifyProductId: shopifyId };
  }
  const out = await res.json();
  const errs = out?.data?.publishablePublish?.userErrors ?? out?.errors;
  if (errs && errs.length) {
    return { headlessPublished: false, headlessReason: JSON.stringify(errs), shopifyProductId: shopifyId };
  }
  return { headlessPublished: true, shopifyProductId: shopifyId };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
