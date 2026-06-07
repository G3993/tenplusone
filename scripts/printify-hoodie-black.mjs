#!/usr/bin/env node
// Set every hoodie's enabled colorways to exactly Ash + White + Black, then
// publish to Shopify. The black/white crest SPLIT already exists in Printify
// (light variants → black crest, Black variants → white crest), so we only
// toggle is_enabled and republish. Idempotent + paced for Printify rate limits
// (600-token bucket → 429 retry-after ~638s; publish endpoint ~200/30min).
//
//   node scripts/printify-hoodie-black.mjs
//
// Env: PRINTIFY_API_TOKEN (from .env.printify). Shop IFC 26998008.

import fs from 'node:fs';

const TOKEN = process.env.PRINTIFY_API_TOKEN;
const SHOP = process.env.PRINTIFY_SHOP_ID || '26998008';
if (!TOKEN) { console.error('no PRINTIFY_API_TOKEN'); process.exit(1); }

const KEEP = new Set(['ash', 'white', 'black']); // colorway titles to keep enabled
const BASE = `https://api.printify.com/v1/shops/${SHOP}`;
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const LOG = '/tmp/hoodie-black.log';
const log = (m) => { const s = `[${new Date().toISOString()}] ${m}`; console.log(s); fs.appendFileSync(LOG, s + '\n'); };

// fetch with 429 cooldown handling
async function api(path, opts = {}, tries = 0) {
  const r = await fetch(BASE + path, { headers: H, ...opts });
  if (r.status === 429) {
    const wait = (parseInt(r.headers.get('retry-after') || '638', 10) + 5) * 1000;
    log(`429 rate-limited; sleeping ${Math.round(wait / 1000)}s`);
    await sleep(wait);
    if (tries < 6) return api(path, opts, tries + 1);
  }
  const text = await r.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  if (!r.ok) throw new Error(`${r.status} ${path} :: ${typeof json === 'string' ? json.slice(0, 300) : JSON.stringify(json).slice(0, 300)}`);
  return json;
}

async function allHoodies() {
  const out = [];
  for (let page = 1; page <= 50; page++) {
    const d = await api(`/products.json?limit=50&page=${page}`);
    const data = d.data || d;
    if (!data || !data.length) break;
    for (const p of data) if (/hoodie/i.test(p.title)) out.push({ id: p.id, title: p.title });
    if (data.length < 50) break;
    await sleep(700);
  }
  return out;
}

function colorTitleMap(product) {
  const m = {};
  for (const o of product.options || []) {
    if (o.type === 'color' || /colou?r/i.test(o.name || '')) for (const v of o.values) m[v.id] = v.title;
  }
  return m;
}

async function run() {
  let hoodies = await allHoodies();
  const LIMIT = parseInt(process.env.LIMIT || '0', 10);
  if (LIMIT) hoodies = hoodies.slice(0, LIMIT);
  log(`found ${hoodies.length} hoodie products${LIMIT ? ` (LIMIT ${LIMIT})` : ''}`);
  let changed = 0, skipped = 0, failed = 0;
  for (const h of hoodies) {
    try {
      const p = await api(`/products/${h.id}.json`);
      const cmap = colorTitleMap(p);
      // desired enabled set = variants whose colorway title is Ash/White/Black
      const desired = (v) => KEEP.has((cmap[v.options[0]] || '').toLowerCase());
      const curEnabled = p.variants.filter((v) => v.is_enabled).map((v) => v.id).sort();
      const wantEnabled = p.variants.filter(desired).map((v) => v.id).sort();
      const same = curEnabled.length === wantEnabled.length && curEnabled.every((x, i) => x === wantEnabled[i]);
      const enabledColors = [...new Set(p.variants.filter(desired).map((v) => cmap[v.options[0]]))];
      if (same) { skipped++; log(`skip (already Ash/White/Black): ${h.title}`); continue; }
      if (!enabledColors.some((c) => /black/i.test(c))) { failed++; log(`WARN no Black colorway found: ${h.title} — colors: ${[...new Set(Object.values(cmap))].join(',')}`); continue; }
      // toggle is_enabled in place; send full variants + tags (tags get wiped otherwise)
      const variants = p.variants.map((v) => ({ ...v, is_enabled: desired(v) }));
      await api(`/products/${h.id}.json`, { method: 'PUT', body: JSON.stringify({ variants, tags: p.tags }) });
      log(`PUT ok: ${h.title} → enabled ${enabledColors.join('/')} (${wantEnabled.length} variants)`);
      await sleep(1500);
      // publish to Shopify
      await api(`/products/${h.id}/publish.json`, { method: 'POST', body: JSON.stringify({ title: true, description: true, images: true, variants: true, tags: true, keyFeatures: true, shipping_template: true }) });
      log(`PUBLISH ok: ${h.title}`);
      changed++;
      await sleep(4000); // pace publishes
    } catch (e) {
      failed++; log(`FAIL ${h.title}: ${e.message}`);
      await sleep(3000);
    }
  }
  log(`DONE changed=${changed} skipped=${skipped} failed=${failed}`);
}

run().catch((e) => { log('FATAL ' + e.message); process.exit(1); });
