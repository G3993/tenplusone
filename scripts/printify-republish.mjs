/**
 * Re-publish every Printify product that isn't yet linked to Shopify.
 * Products can get stuck "published (200) but not synced" when the publish
 * endpoint is rate-limited mid-run. This finds the unlinked ones (no
 * external.id) and re-fires publish.json with backoff.
 *
 *   set -a; . ./.env.printify; set +a; node scripts/printify-republish.mjs
 */
const TOKEN = process.env.PRINTIFY_API_TOKEN;
const SHOP = process.env.PRINTIFY_SHOP_ID || '26998008';
const API = 'https://api.printify.com/v1';
const h = { Authorization: `Bearer ${TOKEN}`, 'User-Agent': 'iFC', 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(path, opts = {}, attempt = 0) {
  const res = await fetch(`${API}${path}`, { ...opts, headers: h });
  if ((res.status === 429 || res.status >= 500) && attempt < 8) {
    const ra = Number(res.headers.get('retry-after')) || 0;
    const wait = ra ? ra * 1000 : Math.min(60000, 2000 * 2 ** attempt);
    console.log(`    … ${res.status} — retrying in ${Math.round(wait / 1000)}s`);
    await sleep(wait);
    return api(path, opts, attempt + 1);
  }
  return res;
}

const PUBLISH_BODY = JSON.stringify({
  title: true, description: true, images: true, variants: true,
  tags: true, keyFeatures: true, shipping_template: true,
});

// Collect unlinked product ids.
let unlinked = [], page = 1;
while (true) {
  const r = await api(`/shops/${SHOP}/products.json?limit=50&page=${page}`);
  const { data = [] } = await r.json();
  for (const p of data) if (!(p.external && p.external.id)) unlinked.push({ id: p.id, title: p.title });
  if (data.length < 50) break;
  page++;
}
console.log(`unlinked products to (re)publish: ${unlinked.length}`);

let ok = 0, fail = 0;
for (const p of unlinked) {
  const r = await api(`/shops/${SHOP}/products/${p.id}/publish.json`, { method: 'POST', body: PUBLISH_BODY });
  if (r.ok) { ok++; } else { fail++; console.log(`  ✖ ${r.status} ${p.title}`); }
  if ((ok + fail) % 25 === 0) console.log(`  progress ${ok + fail}/${unlinked.length} (ok ${ok}, fail ${fail})`);
}
console.log(`\nDone. republished ok=${ok} fail=${fail}`);
