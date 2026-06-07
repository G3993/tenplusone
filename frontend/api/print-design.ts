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
 * NOTE (known blocker, see memory ifc_3d_product_line): even after Printify
 * publishes to Shopify, the product only shows on the HEADLESS storefront once
 * it's published to publication 145681481898 — which needs an shpat_ admin token
 * with write_publications. That final publish is stubbed below.
 *
 * Runs on the Vercel Edge runtime — Web APIs only.
 */
export const config = { runtime: 'edge' };

const PRINTIFY = 'https://api.printify.com/v1';

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

    // 4) TODO (known blocker): publish to the headless storefront publication
    //    145681481898 via Shopify Admin (needs shpat_ with write_publications),
    //    otherwise the product won't appear on www.internetfc.com.

    return json({ configured: true, productId: product.id, title });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
}

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
