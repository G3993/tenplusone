/**
 * Build ONE neon-3D phone-case prototype by cloning the reference
 * "Argentina Phone Case" (blueprint 269, provider 1) but swapping in the
 * team3d NEON crest art (transparent → the black #000000 print-area
 * background shows through). Matches the reference variant set exactly
 * (only the already-enabled variants). Does NOT publish.
 *
 *   set -a; . ./.env.printify; set +a; node scripts/printify-neon-case-prototype.mjs
 */
import { readFileSync } from 'node:fs';

const TOKEN = process.env.PRINTIFY_API_TOKEN;
const SHOP = process.env.PRINTIFY_SHOP_ID || '26998008';
const API = 'https://api.printify.com/v1';
const h = { Authorization: `Bearer ${TOKEN}`, 'User-Agent': 'iFC', 'Content-Type': 'application/json' };

const REF_ID = '6a1ddb2843839351ae0afe88';        // Argentina Phone Case (reference)
const SLUG = process.env.TEAM_SLUG || 'argentina';
const TITLE = process.env.CASE_TITLE || 'Argentina Neon 3D Phone Case';
const ART = `/Users/lu/Documents/Gonzalo Gelso/tenplusone/iFC Logo System/Final Logos/iFC_PNG_XL/Neon 3D Teams/${SLUG}.png`;

const j = async (path, opts = {}) => {
  const r = await fetch(`${API}${path}`, { ...opts, headers: h });
  const t = await r.text();
  let body; try { body = JSON.parse(t); } catch { body = t; }
  if (!r.ok) throw new Error(`${r.status} ${path} :: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  return body;
};

// 1) Read the reference product for blueprint/provider/variants/geometry.
const ref = await j(`/shops/${SHOP}/products/${REF_ID}.json`);
const enabled = ref.variants.filter((v) => v.is_enabled);
console.log(`reference: bp ${ref.blueprint_id} prov ${ref.print_provider_id}, enabled variants: ${enabled.length}`);

// Geometry of the placed crest (position/scale/angle) from the reference.
const refPh = (ref.print_areas?.[0]?.placeholders || []).find((p) => p.position === 'front');
const refImg = refPh?.images?.[0] || { x: 0.5, y: 0.5, scale: 0.3828500280501631, angle: 0 };
const bg = ref.print_areas?.[0]?.background || '#000000';

// 2) Upload the neon art (base64) — Printify stores it and returns an image id.
const b64 = readFileSync(ART).toString('base64');
const up = await j('/uploads/images.json', {
  method: 'POST',
  body: JSON.stringify({ file_name: `neon3d-${SLUG}.png`, contents: b64 }),
});
console.log(`uploaded neon art -> image id ${up.id} (${up.width}x${up.height})`);

// 3) Create the new product cloning the reference's variants + geometry.
const variantIds = enabled.map((v) => v.id);
const payload = {
  title: TITLE,
  description: ref.description || 'Neon 3D crest in team colours on a black case. Part of the internet FC World Cup 2026 collection.',
  blueprint_id: ref.blueprint_id,
  print_provider_id: ref.print_provider_id,
  variants: enabled.map((v) => ({ id: v.id, price: v.price, is_enabled: true })),
  print_areas: [
    {
      variant_ids: variantIds,
      background: bg,
      placeholders: [
        {
          position: 'front',
          images: [{ id: up.id, x: refImg.x, y: refImg.y, scale: refImg.scale, angle: refImg.angle }],
        },
      ],
    },
  ],
};

const created = await j(`/shops/${SHOP}/products.json`, { method: 'POST', body: JSON.stringify(payload) });
console.log(`\n✅ created prototype: "${created.title}"`);
console.log(`   id=${created.id}  bg=${bg}  variants=${variantIds.length}  (UNPUBLISHED)`);
console.log(`   view in Printify: https://printify.com/app/store/products/${created.id}`);
