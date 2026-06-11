/**
 * Publish every draft "<Team> Embroidered Cap" (black cap, white crest) to
 * Shopify. One clean publish per product, paced — repeated rapid publishes on
 * the SAME product break the sync (learned from Morocco), so we never retry a
 * product in-loop; a second pass handles any stragglers.
 *
 *   set -a; . ./.env.printify; set +a; node scripts/printify-publish-caps.mjs
 */
const TOKEN = process.env.PRINTIFY_API_TOKEN;
const SHOP = process.env.PRINTIFY_SHOP_ID || '26998008';
const API = 'https://api.printify.com/v1';
const h = { Authorization: `Bearer ${TOKEN}`, 'User-Agent': 'iFC', 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PUBLISH_BODY = JSON.stringify({ title: true, description: true, images: true, variants: true, tags: true, keyFeatures: true, shipping_template: true });

const req = async (path, opts = {}, attempt = 0) => {
  const r = await fetch(`${API}${path}`, { ...opts, headers: h });
  if ((r.status === 429 || r.status >= 500) && attempt < 7) {
    const ra = Number(r.headers.get('retry-after')) || 0;
    const wait = ra ? ra * 1000 : Math.min(60000, 2000 * 2 ** attempt);
    console.log(`    … ${r.status} retry in ${Math.round(wait / 1000)}s`); await sleep(wait); return req(path, opts, attempt + 1);
  }
  const t = await r.text(); let b; try { b = JSON.parse(t); } catch { b = t; }
  return { ok: r.ok, status: r.status, body: b };
};

async function draftCaps() {
  let out = [];
  for (let page = 1; ; page++) {
    const { body } = await req(`/shops/${SHOP}/products.json?limit=50&page=${page}`);
    const data = body.data || [];
    for (const p of data) if (/embroidered cap/i.test(p.title) && !(p.external && p.external.id)) out.push({ id: p.id, title: p.title });
    if (data.length < 50) break;
  }
  return out;
}

for (let pass = 1; pass <= 2; pass++) {
  const caps = await draftCaps();
  console.log(`\n=== pass ${pass}: ${caps.length} draft caps ===`);
  if (!caps.length) break;
  let ok = 0, fail = 0;
  for (const c of caps) {
    const r = await req(`/shops/${SHOP}/products/${c.id}/publish.json`, { method: 'POST', body: PUBLISH_BODY });
    if (r.ok) { ok++; console.log(`  ok   ${c.title}`); } else { fail++; console.log(`  ✖ ${r.status} ${c.title}`); }
    await sleep(1300);
  }
  console.log(`pass ${pass}: publish-calls ok=${ok} fail=${fail}`);
  if (pass === 1) { console.log('waiting 30s for Shopify sync before re-checking…'); await sleep(30000); }
}

const left = await draftCaps();
console.log(`\nDone. caps still unlinked: ${left.length}${left.length ? ' -> ' + left.map((c) => c.title).join(', ') : ''}`);
