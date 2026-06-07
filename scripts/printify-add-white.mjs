#!/usr/bin/env node
/**
 * iFC Printify — add a WHITE (or nearest near-white) colorway to the apparel
 * product types whose blueprint actually offers one.
 *
 * Context: the per-team line was cloned from "Argentina …" reference products
 * (see printify-generate.mjs), so each team inherited only the colorways that
 * were enabled on the reference. Probing every blueprint showed white is only
 * *available and not yet enabled* on these 5 types:
 *
 *     Tank Top        +5  (White / S…2XL)
 *     Hoodie Dark     +8  (White / S…5XL)
 *     Crop Top        +5  (Solid White Blend / S…2XL)
 *     Women's Tank    +6  (Solid White / XS…2XL)
 *     Dad Hat         +1  (White / One size)
 *
 * (Hoodie, Boxy Tee already ship white; Sweat Shorts/Canvas Tote already ship
 * Ivory/Natural; everything else — mugs, cases, jewelry, the camo "Military
 * Green", the Scarf's navy/white *combos* — has no genuine white colorway.)
 *
 * KEY SIMPLIFICATION: on all 5 types the single print_area's variant_ids list
 * already covers EVERY blueprint variant (the crest placeholder applies to all
 * sizes/colors). So the white variants already inherit the exact crest
 * placement — we only flip `is_enabled` + set a size-matched price. print_areas
 * are sent back unchanged so the crest and any neck/embroidery layers persist.
 *
 * Idempotent: a product whose white variants are already enabled is skipped.
 * Resumable: just re-run; finished products skip themselves.
 *
 * USAGE
 *   export PRINTIFY_API_TOKEN=...                 # or: set -a; . ./.env.printify; set +a
 *   node scripts/printify-add-white.mjs --dry-run             # preview every change
 *   node scripts/printify-add-white.mjs --team argentina      # one team (all 5 types)
 *   node scripts/printify-add-white.mjs --type "Dad Hat"      # one type (all teams)
 *   node scripts/printify-add-white.mjs --all                 # every team, every type
 *   node scripts/printify-add-white.mjs --all --no-publish    # update only, publish later
 */

const API = 'https://api.printify.com/v1';
const TOKEN = process.env.PRINTIFY_API_TOKEN || '';
let SHOP_ID = process.env.PRINTIFY_SHOP_ID || '26998008';

// Product types to touch, matched against the END of a product title
// ("Brazil Hoodie Dark" → "Hoodie Dark"). Apostrophes are normalized so the
// curly/straight variants of "Women's" both match.
const TARGET_TYPES = ['Tank Top', 'Hoodie Dark', 'Crop Top', "Women's Tank", 'Dad Hat'];

// Which catalog colorways count as "white". Deliberately excludes multi-color
// combos (the Scarf's "Navy/White") — those aren't a white product.
const NEARWHITE = /\b(solid white blend|solid white|white|ivory|natural|cream|pfd|bone)\b/i;
// Reject combos: a title naming two colors separated by "/" inside the color
// segment (e.g. "True Navy/ White") is not a solid white.
const COMBO = /\/\s*\w[\w' ]*\/|\b(navy|red|royal|purple|blue|black|green|gold)\b.*\/.*white/i;

function die(m) { console.error(`\n✖ ${m}\n`); process.exit(1); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s || '').toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ').trim();

async function api(pathname, { method = 'GET', body } = {}, attempt = 0) {
  if (!TOKEN) die('PRINTIFY_API_TOKEN is not set.');
  const res = await fetch(`${API}${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'iFC-add-white',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if ((res.status === 429 || res.status >= 500) && attempt < 7) {
    const retryAfter = Number(res.headers.get('retry-after')) || 0;
    const wait = retryAfter ? retryAfter * 1000 : Math.min(60000, 2000 * 2 ** attempt);
    console.log(`    … ${res.status} on ${method} ${pathname.split('?')[0]} — retry in ${Math.round(wait / 1000)}s`);
    await sleep(wait);
    return api(pathname, { method, body }, attempt + 1);
  }
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`${method} ${pathname} → ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

// Catalog variants per blueprint:provider (which ids are white, and their size).
const catalogCache = new Map();
async function whiteVariantIds(bp, pp) {
  const key = `${bp}:${pp}`;
  if (catalogCache.has(key)) return catalogCache.get(key);
  const d = await api(`/catalog/blueprints/${bp}/print_providers/${pp}/variants.json`);
  const ids = new Map(); // id -> title
  for (const v of d.variants || []) {
    if (NEARWHITE.test(v.title) && !COMBO.test(v.title)) ids.set(v.id, v.title);
  }
  catalogCache.set(key, ids);
  return ids;
}

/** Size token from a variant title, e.g. "White / 2XL" or "S / Solid White" → "2XL"/"S". */
function sizeOf(title) {
  const parts = String(title).split('/').map((s) => s.trim());
  const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', 'One size', 'One Size'];
  for (const p of parts) {
    const hit = SIZES.find((s) => s.toLowerCase() === p.toLowerCase());
    if (hit) return hit.toLowerCase();
  }
  return null;
}

function typeOf(title) {
  const t = norm(title);
  return TARGET_TYPES.find((tt) => t.endsWith(norm(tt))) || null;
}

async function listAllProducts() {
  const out = [];
  for (let page = 1; ; page++) {
    const d = await api(`/shops/${SHOP_ID}/products.json?limit=50&page=${page}`);
    const data = d.data || [];
    out.push(...data);
    if (data.length < 50) break;
  }
  return out;
}

/** Returns {changed, addable:[titles]} after enabling white variants on a product. */
async function addWhiteToProduct(prodSummary, { dryRun, publish }) {
  const full = await api(`/shops/${SHOP_ID}/products/${prodSummary.id}.json`);
  const whiteIds = await whiteVariantIds(full.blueprint_id, full.print_provider_id);

  const enabled = full.variants.filter((v) => v.is_enabled);
  // Size → price, from currently-enabled variants (so White / 3XL matches Black / 3XL).
  const priceBySize = new Map();
  let fallbackPrice = 0;
  for (const v of enabled) {
    fallbackPrice = Math.max(fallbackPrice, v.price);
    const sz = sizeOf(v.title);
    if (sz && !priceBySize.has(sz)) priceBySize.set(sz, v.price);
  }

  const toEnable = full.variants.filter((v) => whiteIds.has(v.id) && !v.is_enabled);
  if (!toEnable.length) return { changed: false, addable: [] };

  const variants = full.variants.map((v) => {
    const base = { id: v.id, price: v.price, is_enabled: v.is_enabled };
    if (whiteIds.has(v.id) && !v.is_enabled) {
      base.is_enabled = true;
      const sz = sizeOf(v.title);
      base.price = (sz && priceBySize.get(sz)) || fallbackPrice || v.price;
    }
    return base;
  });

  // Send print_areas back unchanged (ids already cover all variants) so the
  // crest + any neck/embroidery layers stay attached to the new white variants.
  const print_areas = full.print_areas.map((pa) => ({
    variant_ids: pa.variant_ids,
    placeholders: pa.placeholders
      .filter((ph) => ph.images?.length)
      .map((ph) => ({
        position: ph.position,
        images: ph.images.map((im) => ({
          id: im.id, x: im.x, y: im.y, scale: im.scale, angle: im.angle,
        })),
      })),
  }));

  const addable = toEnable.map((v) => v.title);
  if (dryRun) return { changed: true, addable, dry: true };

  // Send ONLY variants. The existing print_area's variant_ids already cover the
  // white variants, so they inherit the crest automatically — and we avoid
  // re-sending overlay image ids (text_layer.svg) that Printify can't resolve
  // on update (error 8253). Omitted fields are left untouched. (print_areas
  // kept above for reference / debugging only.)
  void print_areas;
  await api(`/shops/${SHOP_ID}/products/${full.id}.json`, {
    method: 'PUT',
    body: { variants },
  });
  if (publish) {
    await api(`/shops/${SHOP_ID}/products/${full.id}/publish.json`, {
      method: 'POST',
      body: {
        title: true, description: true, images: true, variants: true,
        tags: true, keyFeatures: true, shipping_template: true,
      },
    });
  }
  return { changed: true, addable };
}

async function run() {
  const args = process.argv.slice(2);
  const flag = (f) => args.includes(f);
  const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };

  const dryRun = flag('--dry-run');
  const publish = !flag('--no-publish');
  const teamArg = opt('--team');       // slug or name fragment
  const typeArg = opt('--type');       // e.g. "Dad Hat"

  if (!flag('--all') && !teamArg && !typeArg) {
    die('Pass --all, or --team <slug>, or --type "<label>". Add --dry-run to preview.');
  }

  console.log(`• shop ${SHOP_ID} — adding white colorway${dryRun ? ' (DRY RUN)' : ''}${publish ? '' : ' (no publish)'}`);
  const all = await listAllProducts();
  console.log(`• ${all.length} products in shop`);

  // Filter to target types, then optionally a single team / type.
  let targets = all.filter((p) => typeOf(p.title));
  if (typeArg) targets = targets.filter((p) => norm(p.title).endsWith(norm(typeArg)));
  if (teamArg) {
    const tn = norm(teamArg);
    targets = targets.filter((p) => norm(p.title).startsWith(tn) || norm(p.title).includes(tn));
  }
  console.log(`• ${targets.length} candidate products across types: ${TARGET_TYPES.join(', ')}\n`);

  let changed = 0, skipped = 0, failed = 0;
  for (const p of targets) {
    const label = (p.title || '').trim();
    try {
      const r = await addWhiteToProduct(p, { dryRun, publish });
      if (!r.changed) { skipped++; console.log(`  ⤼ ${label} (white already enabled)`); continue; }
      changed++;
      console.log(`  ${r.dry ? '[dry] ' : '✓ '}${label}  +${r.addable.length}: ${r.addable.join(', ')}`);
    } catch (err) {
      failed++;
      console.error(`  ✖ ${label}: ${err.message}`);
    }
  }
  console.log(`\nDone. changed=${changed} skipped=${skipped} failed=${failed}${dryRun ? ' (dry run — nothing written)' : ''}`);
}

run().catch((err) => die(err.stack || err.message));
