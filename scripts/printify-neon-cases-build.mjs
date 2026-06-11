/**
 * Phase B: create a NEON 3D phone case for every team by cloning the reference
 * "Argentina Phone Case" (bp 269, prov 1) and swapping in the pre-baked
 * black case art from /tmp/neon_cases/<slug>.png (black baked in, full-bleed).
 * iPhone 17 variant enabled, matching the reference. Tags each product so it
 * appears on its team page once published. Does NOT publish.
 *
 *   set -a; . ./.env.printify; set +a; node scripts/printify-neon-cases-build.mjs
 */
import { readFileSync, existsSync } from 'node:fs';

const TOKEN = process.env.PRINTIFY_API_TOKEN;
const SHOP = process.env.PRINTIFY_SHOP_ID || '26998008';
const API = 'https://api.printify.com/v1';
const h = { Authorization: `Bearer ${TOKEN}`, 'User-Agent': 'iFC', 'Content-Type': 'application/json' };
const REF_ID = '6a1ddb2843839351ae0afe88';
const ART_DIR = '/tmp/neon_cases';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const j = async (path, opts = {}, attempt = 0) => {
  const r = await fetch(`${API}${path}`, { ...opts, headers: h });
  if ((r.status === 429 || r.status >= 500) && attempt < 6) {
    const wait = Math.min(30000, 2000 * 2 ** attempt);
    await sleep(wait); return j(path, opts, attempt + 1);
  }
  const t = await r.text(); let b; try { b = JSON.parse(t); } catch { b = t; }
  if (!r.ok) throw new Error(`${r.status} :: ${typeof b === 'string' ? b : JSON.stringify(b)}`);
  return b;
};

const teams = JSON.parse(readFileSync('/Users/lu/tenplusone/scripts/printify-teams.json', 'utf8'));
const ref = await j(`/shops/${SHOP}/products/${REF_ID}.json`);
const ALL_VARIANT_IDS = ref.variants.map((v) => v.id);
const enabled = ref.variants.filter((v) => v.is_enabled).map((v) => ({ id: v.id, price: v.price }));
console.log(`reference: ${ALL_VARIANT_IDS.length} variants, ${enabled.length} enabled (iPhone 17 @ $${(enabled[0].price/100).toFixed(2)})`);

// Skip teams that already have a neon case (idempotent re-runs).
const existing = new Set();
for (let page = 1; ; page++) {
  const { data = [] } = await j(`/shops/${SHOP}/products.json?limit=50&page=${page}`);
  for (const p of data) if (/Neon 3D Phone Case/i.test(p.title)) existing.add(p.title);
  if (data.length < 50) break;
}

let ok = 0, skip = 0, fail = 0;
for (const team of teams) {
  const title = `${team.name} Neon 3D Phone Case`;
  if (existing.has(title)) { skip++; console.log(`  skip ${team.slug} (exists)`); continue; }
  const art = `${ART_DIR}/${team.slug}.png`;
  if (!existsSync(art)) { fail++; console.log(`  FAIL ${team.slug} (no baked art)`); continue; }
  try {
    const b64 = readFileSync(art).toString('base64');
    const up = await j('/uploads/images.json', { method: 'POST', body: JSON.stringify({ file_name: `neon3d-case-${team.slug}.png`, contents: b64 }) });
    const payload = {
      title,
      description: 'Neon 3D crest in team colours on a black case — internet FC, World Cup 2026.',
      blueprint_id: ref.blueprint_id,
      print_provider_id: ref.print_provider_id,
      tags: [team.slug, team.code.toLowerCase(), 'ifc', 'world-cup-2026', 'phone-case', 'neon-3d', 'motif:3d'],
      variants: enabled.map((v) => ({ id: v.id, price: v.price, is_enabled: true })),
      print_areas: [{
        variant_ids: ALL_VARIANT_IDS,
        background: '#000000',
        placeholders: [{ position: 'front', images: [{ id: up.id, x: 0.5, y: 0.5, scale: 1.05, angle: 0 }] }],
      }],
    };
    const created = await j(`/shops/${SHOP}/products.json`, { method: 'POST', body: JSON.stringify(payload) });
    ok++; console.log(`  ok   ${team.slug.padEnd(20)} id=${created.id}`);
  } catch (e) {
    fail++; console.log(`  FAIL ${team.slug}: ${String(e.message).slice(0, 120)}`);
  }
  await sleep(700);
}
console.log(`\nDone. created=${ok} skipped=${skip} failed=${fail} (all UNPUBLISHED)`);
