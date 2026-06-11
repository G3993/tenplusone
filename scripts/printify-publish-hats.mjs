/**
 * Publish all unlinked "<Team> Hat" products (blueprint 2041, black, available).
 * Paced ~10s apart to stay under Printify's ~200/30min publish budget once the
 * current cooldown clears; backs off on 429 by honoring retry-after.
 *   set -a; . ./.env.printify; set +a; node scripts/printify-publish-hats.mjs
 */
const TOKEN = process.env.PRINTIFY_API_TOKEN, SHOP = process.env.PRINTIFY_SHOP_ID || '26998008';
const API = 'https://api.printify.com/v1';
const h = { Authorization: `Bearer ${TOKEN}`, 'User-Agent': 'iFC', 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PACE = 10000;
const BODY = JSON.stringify({ title: true, description: true, images: true, variants: true, tags: true, keyFeatures: true, shipping_template: true });

const req = async (path, opts = {}, attempt = 0) => {
  const r = await fetch(`${API}${path}`, { ...opts, headers: h });
  if (r.status === 429 && attempt < 5) {
    const ra = Number(r.headers.get('retry-after')) || 1200;
    console.log(`    … 429, waiting ${ra}s (attempt ${attempt + 1})`); await sleep((ra + 3) * 1000); return req(path, opts, attempt + 1);
  }
  if (r.status >= 500 && attempt < 5) { await sleep(5000); return req(path, opts, attempt + 1); }
  const t = await r.text(); let b; try { b = JSON.parse(t); } catch { b = t; }
  return { ok: r.ok, status: r.status, body: b };
};

async function unlinkedHats() {
  let out = [];
  for (let page = 1; ; page++) {
    const { body } = await req(`/shops/${SHOP}/products.json?limit=50&page=${page}`);
    const data = body.data || [];
    for (const p of data) if (/ Hat$/.test(p.title) && !(p.external && p.external.id)) out.push({ id: p.id, title: p.title });
    if (data.length < 50) break;
  }
  return out;
}

for (let pass = 1; pass <= 2; pass++) {
  const hats = await unlinkedHats();
  console.log(`\n=== pass ${pass}: ${hats.length} unlinked hats ===`);
  if (!hats.length) break;
  let ok = 0, fail = 0;
  for (const hat of hats) {
    const r = await req(`/shops/${SHOP}/products/${hat.id}/publish.json`, { method: 'POST', body: BODY });
    if (r.ok) { ok++; console.log(`  ok   ${hat.title}`); } else { fail++; console.log(`  ✖ ${r.status} ${hat.title}`); }
    await sleep(PACE);
  }
  console.log(`pass ${pass}: ok=${ok} fail=${fail}`);
  if (pass === 1) await sleep(30000);
}
const left = await unlinkedHats();
console.log(`\nDone. hats still unlinked: ${left.length}${left.length ? ' -> ' + left.map((x) => x.title).join(', ') : ''}`);
