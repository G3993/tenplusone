#!/usr/bin/env node
/**
 * iFC Printify product generator.
 *
 * Workflow this script assumes (decided 2026-05-22):
 *   1. You hand-build a REFERENCE SET on Printify — one product per product
 *      type (one tee, one hoodie, one cap, …), using ANY single team's print
 *      file, with blueprint + print provider + variants + price + artwork
 *      placement all dialed in. That locks the template.
 *   2. This script reads each template product back via the Printify API and
 *      replays it for all 48 teams, swapping ONLY the artwork image. Because
 *      every crest is normalized to the same 45×45 grid (2px pad), the single
 *      placement you set is correct for every team.
 *   3. Each generated product is published to the connected Shopify store.
 *
 * Source of truth: Printify → publishes to Shopify (the iFC site reads Shopify).
 *
 * SAFE ROLLOUT (default): generate ONE test team first, verify in Printify,
 * then run --all.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * SETUP
 *   export PRINTIFY_API_TOKEN=...        # Printify → My account → Connections → API
 *   # (optional) export PRINTIFY_SHOP_ID=...  # auto-detected if omitted
 *
 * Fill in TEMPLATES below with the product IDs from your hand-built reference
 * set (open a product in Printify; the id is in the URL and in the API list).
 *
 * USAGE
 *   node scripts/printify-generate.mjs --list                 # list shops + products (sanity check)
 *   node scripts/printify-generate.mjs --team argentina       # generate one team across all templates
 *   node scripts/printify-generate.mjs --team argentina --dry-run
 *   node scripts/printify-generate.mjs --all                  # generate all 48 teams
 *   node scripts/printify-generate.mjs --all --no-publish     # create but don't publish to Shopify
 *
 * The artwork is pulled from the deployed site so Printify can fetch by URL:
 *   https://www.internetfc.com/logos/print/4500/{color}/{slug}.png
 * (Make sure the print files are deployed first — they live in
 *  frontend/public/logos/print/. They are, as of the last deploy.)
 * ──────────────────────────────────────────────────────────────────────────
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Config you fill in after building the reference set ───────────────────

/**
 * One entry per product type in your reference set.
 *   templateId  — the Printify product id of the hand-built reference product
 *   typeLabel   — used to compose the product title ("{Nation} {typeLabel}")
 *
 * The black/white logo choice is read PER PRINT AREA from the reference
 * product itself: any placed image whose source name contains "white" gets
 * the team's white print file; everything else gets the black file. So a
 * reference that puts a white crest on dark variants and a black crest on
 * light variants just works — clones inherit the same split.
 */
const TEMPLATES = [
  // NEON line: full-colour 3D crest art (ART_STYLE=3d) on the existing boxy-tee
  // and tote references — same blueprints/variants/placement, colour artwork.
  { type: 'neon-tee', templateId: '6a1d8926dd788c501308502d', typeLabel: 'Neon Tee' },
  { type: 'neon-tote', templateId: '6a0f213f76a738b4c204436a', typeLabel: 'Neon Tote' },
  // Earlier references (kept):
  // { type: 'embroidered-cap', templateId: '6a1ef812c91489211d03058c', typeLabel: 'Embroidered Cap' },
  // { type: 'tee', templateId: '69cd37f123e97cd05d03472d', typeLabel: 'Terminal Tee' },
];

const ART_BASE = 'https://www.internetfc.com/logos/print/4500';      // flat mono crests (white/black split)
const ART_BASE_3D = 'https://www.internetfc.com/logos/print/3d';     // full-colour 3D crests (one file, any garment)
const ART_STYLE = process.env.ART_STYLE || '3d';                     // '3d' (default) | 'flat'
const REFERENCE_TEAM = process.env.REFERENCE_TEAM || 'Argentina';    // products titled "Argentina …" are the per-type reference set
const PUBLISH_DEFAULT = true;

// ─── End config ────────────────────────────────────────────────────────────

const API = 'https://api.printify.com/v1';
const TOKEN = process.env.PRINTIFY_API_TOKEN || '';
let SHOP_ID = process.env.PRINTIFY_SHOP_ID || '';

const TEAMS = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'printify-teams.json'), 'utf8'),
);

function die(msg) {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(pathname, { method = 'GET', body } = {}, attempt = 0) {
  if (!TOKEN) die('PRINTIFY_API_TOKEN is not set. export it first.');
  const res = await fetch(`${API}${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'iFC-product-generator',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  // Back off and retry on rate limit (429) or transient 5xx.
  if ((res.status === 429 || res.status >= 500) && attempt < 6) {
    const retryAfter = Number(res.headers.get('retry-after')) || 0;
    const wait = retryAfter ? retryAfter * 1000 : Math.min(30000, 2000 * 2 ** attempt);
    console.log(`    … ${res.status} on ${method} ${pathname.split('?')[0]} — retrying in ${Math.round(wait / 1000)}s`);
    await sleep(wait);
    return api(pathname, { method, body }, attempt + 1);
  }
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(`${method} ${pathname} → ${res.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

async function resolveShopId() {
  if (SHOP_ID) return SHOP_ID;
  const shops = await api('/shops.json');
  if (!shops?.length) die('No Printify shops found on this account.');
  // Prefer the Shopify-connected shop (the one the iFC site actually reads).
  const chosen = shops.find((s) => s.sales_channel === 'shopify') || shops[0];
  SHOP_ID = String(chosen.id);
  console.log(`• using shop: ${chosen.title} (id ${SHOP_ID})`);
  if (shops.length > 1) {
    console.log('  (multiple shops exist — set PRINTIFY_SHOP_ID to override)');
  }
  return SHOP_ID;
}

/** Short type slug from a product label, e.g. "Coffee Mug Black 15oz" → "coffee-mug". */
function slugifyType(label) {
  return (
    label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40) || 'item'
  );
}

/**
 * Auto-build TEMPLATES from reference products titled "<REFERENCE_TEAM> …".
 *
 * The reference team can now own MULTIPLE motif sets (the original flat/default
 * set has no motif tag; the 3D set is tagged "motif:3d", etc.). So filter by
 * motif to avoid mixing sets:
 *   REF_MOTIF unset  → the DEFAULT set (references with NO "motif:" tag)
 *   REF_MOTIF=motif:3d → only references tagged motif:3d
 */
async function discoverTemplates() {
  const prefix = REFERENCE_TEAM.toLowerCase();
  const refMotif = process.env.REF_MOTIF || '';
  const out = [];
  for (let page = 1; ; page++) {
    const products = await api(`/shops/${SHOP_ID}/products.json?limit=50&page=${page}`);
    const data = products.data ?? [];
    for (const p of data) {
      if (!(p.title || '').trim().toLowerCase().startsWith(prefix)) continue;
      const tags = p.tags || [];
      const hasMotif = tags.some((t) => /^motif:/i.test(t));
      // Skip refs that don't belong to the requested set.
      if (refMotif ? !tags.includes(refMotif) : hasMotif) continue;
      const typeLabel = (p.title || '').replace(new RegExp(`^${REFERENCE_TEAM}\\s*`, 'i'), '').trim();
      out.push({ type: slugifyType(typeLabel), templateId: p.id, typeLabel });
    }
    if (data.length < 50) break;
  }
  return out;
}

// Cache uploaded art per "slug:color" so we upload each file at most once.
const artCache = new Map();

/** Upload a team's print art by URL. Returns the Printify image id (cached). */
async function uploadArt(slug, color) {
  // 3D crests are one full-colour file per team (garment colour irrelevant);
  // flat crests split into white (dark garments) / black (light garments).
  const is3d = ART_STYLE === '3d';
  const key = is3d ? `3d:${slug}` : `${slug}:${color}`;
  if (artCache.has(key)) return artCache.get(key);
  const url = is3d ? `${ART_BASE_3D}/${slug}.png` : `${ART_BASE}/${color}/${slug}.png`;
  const out = await api('/uploads/images.json', {
    method: 'POST',
    body: { file_name: is3d ? `${slug}-3d.png` : `${slug}-${color}.png`, url },
  });
  artCache.set(key, out.id);
  return out.id;
}

/** Decide which team print file a reference image maps to, by its source name. */
function colorForRefImage(img) {
  return /white/i.test(img.name || '') ? 'white' : 'black';
}

/** Garment colour is "dark" → needs the WHITE crest (else the black one). */
function isDarkColor(title) {
  return /\bblack\b|charcoal|graphite|\bnavy\b|forest|maroon|\bred\b|royal|indigo|olive|military|dark/.test(String(title || '').toLowerCase());
}

/** Garment colour is "neutral" = black / white / beige / light-gray only. */
function isNeutralColor(title) {
  const s = String(title || '').toLowerCase();
  if (/dark|charcoal|graphite|navy|forest|maroon|\bred\b|pink|blue|green|royal|indigo|olive|military|sport dark|heather sport dark/.test(s)) return false;
  return /\bblack\b|\bwhite\b|natural|beige|bone|ivory|cream|sand|oatmeal|\btan\b|toast|stone|almond|athletic heather|sport gr[ea]y|light gr[ea]y|\bash\b|silver/.test(s);
}

/** Compose per-team product fields, cloning the reference and swapping art. */
async function teamProductFields(template, refProduct, team) {
  // NEUTRAL_ONLY: enable only black/white/beige/light-gray colourways (every
  // size of them, as long as the print area covers the variant). Otherwise
  // clone the reference's enabled set verbatim.
  const colorOpt = (refProduct.options || []).find((o) => /colou?r/i.test(o.name) || /colou?r/i.test(o.type));
  const neutralIds = new Set((colorOpt?.values || []).filter((v) => isNeutralColor(v.title)).map((v) => v.id));
  const paCovered = new Set();
  (refProduct.print_areas || []).forEach((a) => (a.variant_ids || []).forEach((id) => paCovered.add(id)));
  const neutralOnly = !!process.env.NEUTRAL_ONLY && neutralIds.size > 0;
  // Clone variants (id + price + enabled) from the reference.
  const variants = refProduct.variants.map((v) => ({
    id: v.id,
    price: v.price,
    is_enabled: neutralOnly
      ? v.options.some((oid) => neutralIds.has(oid)) && paCovered.has(v.id)
      : v.is_enabled,
  }));
  if (neutralOnly && !variants.some((v) => v.is_enabled)) {
    // Safety: never ship a product with zero enabled variants.
    refProduct.variants.forEach((v, i) => { if (v.is_enabled) variants[i].is_enabled = true; });
  }

  // Collect the reference crest placement(s): position + transform of each
  // placed crest image (ignore text/overlay SVGs that can't be re-referenced).
  const places = [];
  const seenPlace = new Set();
  for (const area of refProduct.print_areas) {
    for (const ph of area.placeholders || []) {
      for (const img of ph.images || []) {
        if (!(img.name || '').toLowerCase().includes(REFERENCE_TEAM.toLowerCase())) continue;
        // References repeat the same placement across per-variant print-area
        // splits (and black/white art pairs) — dedupe so we don't stack copies.
        const key = `${ph.position}|${img.x}|${img.y}|${img.scale}|${img.angle}`;
        if (seenPlace.has(key)) continue;
        seenPlace.add(key);
        places.push({ position: ph.position, x: img.x, y: img.y, scale: img.scale, angle: img.angle });
      }
    }
  }
  const background = process.env.PRINT_BG || refProduct.print_areas?.[0]?.background;
  const bg = background ? { background } : {};
  // Build placeholders (grouped by position) that place one crest image id.
  const mkPlaceholders = (imageId) => {
    const byPos = {};
    for (const pl of places) (byPos[pl.position] ??= []).push({ id: imageId, x: pl.x, y: pl.y, scale: pl.scale, angle: pl.angle });
    return Object.entries(byPos).map(([position, images]) => ({ position, images }));
  };

  const print_areas = [];
  const isFlat = ART_STYLE === 'flat';
  if (isFlat && places.length && colorOpt) {
    // FLAT split: black crest on light garments, WHITE crest on dark garments
    // (so a black/navy tee shows a visible white crest). Every variant must be
    // covered by some print area, so split ALL variants by garment darkness.
    const idToColor = {};
    colorOpt.values.forEach((v) => { idToColor[v.id] = v.title; });
    const colorOf = (v) => v.options.map((o) => idToColor[o]).find(Boolean);
    const lightIds = [], darkIds = [];
    for (const v of refProduct.variants) (isDarkColor(colorOf(v)) ? darkIds : lightIds).push(v.id);
    const blackId = await uploadArt(team.slug, 'black');
    const whiteId = await uploadArt(team.slug, 'white');
    if (lightIds.length) print_areas.push({ variant_ids: lightIds, ...bg, placeholders: mkPlaceholders(blackId) });
    if (darkIds.length) print_areas.push({ variant_ids: darkIds, ...bg, placeholders: mkPlaceholders(whiteId) });
  } else {
    // Non-flat (or no colour option): single crest image across all variants.
    const color = places.length ? colorForRefImage({ name: '' }) : 'black';
    const imageId = await uploadArt(team.slug, color);
    print_areas.push({ variant_ids: refProduct.variants.map((v) => v.id), ...bg, placeholders: mkPlaceholders(imageId) });
  }

  const title = `${team.name} ${template.typeLabel}`;
  const description =
    `Official iFC World Cup 2026 ${template.typeLabel.toLowerCase()}, ${team.name} edition. ` +
    `Crest rendered on the iFC 32×32 pixel grid. Printed on demand.`;

  return {
    title,
    description,
    blueprint_id: refProduct.blueprint_id,
    print_provider_id: refProduct.print_provider_id,
    variants,
    print_areas,
    tags: [team.slug, team.code.toLowerCase(), template.type, 'world-cup-2026', 'ifc',
      ...(process.env.MOTIF_TAG ? [process.env.MOTIF_TAG] : [])],
  };
}

// Titles of products that already exist, lowercased, for skip-existing.
let EXISTING_TITLES = [];

/** True if a product for this team + type already exists in the shop. */
function alreadyExists(team, template) {
  const name = team.name.toLowerCase();
  const type = template.type.toLowerCase();
  const typeWord = template.typeLabel.split(' ').pop().toLowerCase(); // "tee", "hoodie"…
  return EXISTING_TITLES.some(
    (t) => t.startsWith(name) && (t.includes(type) || t.includes(typeWord)),
  );
}

async function generateForTeam(team, { publish, dryRun, force }) {
  for (const template of TEMPLATES) {
    const refProduct = template._ref; // pre-fetched in run()
    const label = `${team.name} · ${template.type}`;

    if (!force && alreadyExists(team, template)) {
      console.log(`  ⤼ skip ${label} (already in shop; --force to make another)`);
      continue;
    }
    if (dryRun) {
      console.log(`  [dry-run] would create + ${publish ? 'publish' : 'save'}: ${label}`);
      continue;
    }
    try {
      const fields = await teamProductFields(template, refProduct, team);
      const created = await api(`/shops/${SHOP_ID}/products.json`, {
        method: 'POST',
        body: fields,
      });
      console.log(`  ✓ created ${label}  (id ${created.id})`);
      if (publish) {
        await api(`/shops/${SHOP_ID}/products/${created.id}/publish.json`, {
          method: 'POST',
          body: {
            title: true, description: true, images: true, variants: true,
            tags: true, keyFeatures: true, shipping_template: true,
          },
        });
        console.log(`    ↳ published to Shopify`);
      }
    } catch (err) {
      console.error(`  ✖ ${label}: ${err.message}`);
    }
  }
}

async function run() {
  const args = process.argv.slice(2);
  const flag = (f) => args.includes(f);
  const teamArg = (() => {
    const i = args.indexOf('--team');
    return i >= 0 ? args[i + 1] : null;
  })();

  await resolveShopId();

  if (flag('--list')) {
    const products = await api(`/shops/${SHOP_ID}/products.json`);
    console.log(`\n${products.data?.length ?? 0} products in shop ${SHOP_ID}:`);
    for (const p of products.data ?? []) {
      console.log(`  ${p.id}  ${p.title}`);
    }
    console.log('\nCopy the ids of your reference set into the TEMPLATES array.');
    return;
  }

  // --auto: discover the reference set from the shop instead of the hardcoded list.
  if (flag('--auto')) {
    const found = await discoverTemplates();
    TEMPLATES.length = 0;
    TEMPLATES.push(...found);
    console.log(`• auto-discovered ${TEMPLATES.length} reference products (titled "${REFERENCE_TEAM} …"); art style: ${ART_STYLE}`);
  }

  // ONLY_TYPES restricts generation to specific product-type slugs (e.g.
  // "boxy-tee,hoodie,tote-bag") — used to keep a motif to a simplified subset.
  if (process.env.ONLY_TYPES) {
    const want = process.env.ONLY_TYPES.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    const before = TEMPLATES.length;
    const kept = TEMPLATES.filter((t) => want.includes(t.type));
    TEMPLATES.length = 0;
    TEMPLATES.push(...kept);
    console.log(`• ONLY_TYPES: kept ${TEMPLATES.length}/${before} templates → ${TEMPLATES.map((t) => t.type).join(', ') || '(none matched!)'}`);
  }

  if (!TEMPLATES.length) {
    die('TEMPLATES is empty. Run with --auto, or run --list and fill in TEMPLATES.');
  }

  // Pre-fetch each reference product once.
  for (const t of TEMPLATES) {
    t._ref = await api(`/shops/${SHOP_ID}/products/${t.templateId}.json`);
    console.log(`• template loaded: ${t.type} ← "${t._ref.title}" (${t._ref.variants.length} variants)`);
  }

  // Snapshot existing product titles so we can skip duplicates.
  EXISTING_TITLES = [];
  for (let page = 1; ; page++) {
    const res = await api(`/shops/${SHOP_ID}/products.json?limit=50&page=${page}`);
    const data = res.data ?? [];
    EXISTING_TITLES.push(...data.map((p) => (p.title || '').toLowerCase()));
    if (data.length < 50) break;
  }
  console.log(`• ${EXISTING_TITLES.length} existing products snapshotted (skip-existing)`);

  const publish = !flag('--no-publish') && PUBLISH_DEFAULT;
  const dryRun = flag('--dry-run');
  const force = flag('--force');

  let targets;
  if (teamArg) {
    const team = TEAMS.find((t) => t.slug === teamArg);
    if (!team) die(`Unknown team slug "${teamArg}". See scripts/printify-teams.json.`);
    targets = [team];
  } else if (flag('--all')) {
    // The reference team already exists as the sample set — skip re-cloning it.
    // EXCLUDE_TEAMS (comma-separated slugs/names) skips teams already generated
    // for this motif (so --force runs don't duplicate finished teams).
    const exclude = (process.env.EXCLUDE_TEAMS || '')
      .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    targets = TEAMS.filter((t) =>
      t.name.toLowerCase() !== REFERENCE_TEAM.toLowerCase()
      && !exclude.includes(t.slug)
      && !exclude.includes(t.name.toLowerCase()));
  } else {
    die('Pass --team <slug> for a single team, or --all for every team. Add --dry-run to preview.');
  }

  console.log(`\nGenerating ${targets.length} team(s) × ${TEMPLATES.length} template(s)` +
    `${dryRun ? ' (dry run)' : ''}${publish ? '' : ' (no publish)'}…\n`);

  for (const team of targets) {
    console.log(team.name);
    await generateForTeam(team, { publish, dryRun, force });
  }

  console.log('\nDone.');
}

run().catch((err) => die(err.stack || err.message));
