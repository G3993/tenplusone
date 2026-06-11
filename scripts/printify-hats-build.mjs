/**
 * Clone the reference "Argentina Hat" (blueprint 2041, provider 99 — black,
 * AVAILABLE, DTF white crest) across every other team. Replaces the broken
 * embroidered caps (blueprint 1742, discontinued black variant).
 * Per-team art = white crest from internetfc.com/logos/print/4500/white/<slug>.png.
 * Creates as drafts (no publish — Printify publish is rate-limited).
 *
 *   set -a; . ./.env.printify; set +a; node scripts/printify-hats-build.mjs
 */
import { readFileSync } from 'node:fs';
const TOKEN = process.env.PRINTIFY_API_TOKEN, SHOP = process.env.PRINTIFY_SHOP_ID || '26998008';
const API = 'https://api.printify.com/v1';
const h = { Authorization: `Bearer ${TOKEN}`, 'User-Agent': 'iFC', 'Content-Type': 'application/json' };
const REF_ID = '6a2807fec1d3ca0a1907a59b';
const ART = (slug) => `https://www.internetfc.com/logos/print/4500/white/${slug}.png`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const req = async (path, opts = {}, attempt = 0) => {
  const r = await fetch(`${API}${path}`, { ...opts, headers: h });
  if ((r.status === 429 || r.status >= 500) && attempt < 6) {
    const ra = Number(r.headers.get('retry-after')) || 0;
    await sleep(ra ? ra * 1000 : Math.min(60000, 2000 * 2 ** attempt)); return req(path, opts, attempt + 1);
  }
  const t = await r.text(); let b; try { b = JSON.parse(t); } catch { b = t; }
  if (!r.ok) throw new Error(`${r.status} ${path} :: ${typeof b === 'string' ? b.slice(0, 150) : JSON.stringify(b).slice(0, 150)}`);
  return b;
};

const teams = JSON.parse(readFileSync('/Users/lu/tenplusone/scripts/printify-teams.json', 'utf8'));
const ref = await req(`/shops/${SHOP}/products/${REF_ID}.json`);
const refVariants = ref.variants.map((v) => ({ id: v.id, price: v.price, is_enabled: v.is_enabled }));
const refAreas = ref.print_areas; // two areas, front_dtf, geometry {x,y,scale,angle}
console.log(`template: bp ${ref.blueprint_id} prov ${ref.print_provider_id}, ${refVariants.filter((v) => v.is_enabled).length} enabled @ $${refVariants.find((v) => v.is_enabled).price / 100}`);

// existing hats (idempotent)
const existing = new Set();
for (let page = 1; ; page++) {
  const { data = [] } = await req(`/shops/${SHOP}/products.json?limit=50&page=${page}`);
  for (const p of data) if (/ Hat$/.test(p.title)) existing.add(p.title);
  if (data.length < 50) break;
}

let ok = 0, skip = 0, fail = 0;
for (const team of teams) {
  const title = `${team.name} Hat`;
  if (team.slug === 'argentina' || existing.has(title)) { skip++; console.log(`  skip ${title}`); continue; }
  try {
    const up = await req('/uploads/images.json', { method: 'POST', body: JSON.stringify({ file_name: `hat-white-${team.slug}.png`, url: ART(team.slug) }) });
    const print_areas = refAreas.map((a) => ({
      variant_ids: a.variant_ids,
      placeholders: a.placeholders.map((ph) => ({
        position: ph.position,
        images: [{ id: up.id, x: ph.images[0].x, y: ph.images[0].y, scale: ph.images[0].scale, angle: ph.images[0].angle }],
      })),
    }));
    const payload = {
      title,
      description: `Official iFC World Cup 2026 hat, ${team.name} edition. White crest on a black cap.`,
      blueprint_id: ref.blueprint_id,
      print_provider_id: ref.print_provider_id,
      tags: [team.slug, team.code.toLowerCase(), 'ifc', 'world-cup-2026', 'hat'],
      variants: refVariants,
      print_areas,
    };
    const created = await req(`/shops/${SHOP}/products.json`, { method: 'POST', body: JSON.stringify(payload) });
    ok++; console.log(`  ok   ${title.padEnd(34)} id=${created.id}`);
  } catch (e) { fail++; console.log(`  FAIL ${title}: ${e.message}`); }
  await sleep(600);
}
console.log(`\nDone. created=${ok} skipped=${skip} failed=${fail} (UNPUBLISHED)`);
