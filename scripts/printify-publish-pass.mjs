#!/usr/bin/env node
/**
 * iFC Printify → Shopify PUBLISH PASS (paced).
 *
 * Printify's publish endpoint is hard rate-limited (~200 req / 30 min, with
 * ~18-23 min cooldowns once tripped). Publishing immediately after every edit
 * burns the bucket and stalls. This script publishes products at a SAFE PACE
 * so the Printify→Shopify sync of edited products (e.g. newly-enabled white
 * variants, or freshly created 3D products) lands without tripping cooldowns.
 *
 * It is decoupled on purpose: enable/create products fast with --no-publish,
 * then run this to sync them to Shopify over time. Idempotent + resumable.
 *
 * USAGE
 *   export PRINTIFY_API_TOKEN=...
 *   node scripts/printify-publish-pass.mjs --types        # publish the 5 white-target types, all teams
 *   node scripts/printify-publish-pass.mjs --team argentina
 *   node scripts/printify-publish-pass.mjs --all          # publish every product (slow)
 *   node scripts/printify-publish-pass.mjs --types --interval 12   # seconds between publishes (default 12)
 */

const API = 'https://api.printify.com/v1';
const TOKEN = process.env.PRINTIFY_API_TOKEN || '';
const SHOP_ID = process.env.PRINTIFY_SHOP_ID || '26998008';
const TARGET_TYPES = ['Tank Top', 'Hoodie Dark', 'Crop Top', "Women's Tank", 'Dad Hat'];

function die(m) { console.error(`\n✖ ${m}\n`); process.exit(1); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s || '').toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ').trim();

async function api(pathname, { method = 'GET', body } = {}, attempt = 0) {
  if (!TOKEN) die('PRINTIFY_API_TOKEN is not set.');
  const res = await fetch(`${API}${pathname}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'iFC-publish-pass' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if ((res.status === 429 || res.status >= 500) && attempt < 8) {
    const retryAfter = Number(res.headers.get('retry-after')) || 0;
    const wait = retryAfter ? retryAfter * 1000 : Math.min(120000, 3000 * 2 ** attempt);
    console.log(`    … ${res.status} — cooldown ${Math.round(wait / 1000)}s (attempt ${attempt + 1})`);
    await sleep(wait);
    return api(pathname, { method, body }, attempt + 1);
  }
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`${method} ${pathname} → ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

function typeOf(title) { const t = norm(title); return TARGET_TYPES.find((tt) => t.endsWith(norm(tt))) || null; }

async function listAll() {
  const out = [];
  for (let page = 1; ; page++) {
    const d = await api(`/shops/${SHOP_ID}/products.json?limit=50&page=${page}`);
    const data = d.data || [];
    out.push(...data);
    if (data.length < 50) break;
  }
  return out;
}

async function run() {
  const args = process.argv.slice(2);
  const flag = (f) => args.includes(f);
  const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
  const interval = (Number(opt('--interval')) || 12) * 1000;
  const teamArg = opt('--team');

  if (!flag('--all') && !flag('--types') && !teamArg && !opt('--tag')) die('Pass --types, --all, --team <slug>, or --tag <tag>.');

  const tagArg = opt('--tag');
  const all = await listAll();
  // Union of selections so e.g. --types --tag motif:3d publishes both sets once.
  let targets;
  if (flag('--all')) {
    targets = all;
  } else {
    const picked = new Map();
    if (flag('--types')) all.filter((p) => typeOf(p.title)).forEach((p) => picked.set(p.id, p));
    if (tagArg) all.filter((p) => (p.tags || []).includes(tagArg)).forEach((p) => picked.set(p.id, p));
    if (teamArg) { const tn = norm(teamArg); all.filter((p) => norm(p.title).startsWith(tn) || norm(p.title).includes(tn)).forEach((p) => picked.set(p.id, p)); }
    targets = [...picked.values()];
  }

  console.log(`• publishing ${targets.length} products at ${interval / 1000}s pace (safe under the publish limit)\n`);
  let ok = 0, fail = 0;
  for (let i = 0; i < targets.length; i++) {
    const p = targets[i];
    const label = (p.title || '').trim();
    try {
      await api(`/shops/${SHOP_ID}/products/${p.id}/publish.json`, {
        method: 'POST',
        body: { title: true, description: true, images: true, variants: true, tags: true, keyFeatures: true, shipping_template: true },
      });
      ok++;
      console.log(`  ✓ [${i + 1}/${targets.length}] published ${label}`);
    } catch (err) {
      fail++;
      console.error(`  ✖ [${i + 1}/${targets.length}] ${label}: ${err.message}`);
    }
    if (i < targets.length - 1) await sleep(interval);
  }
  console.log(`\nDone. published=${ok} failed=${fail}`);
}

run().catch((err) => die(err.stack || err.message));
