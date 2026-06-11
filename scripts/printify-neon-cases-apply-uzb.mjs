/**
 * Apply the Uzbekistan edits to every other neon phone case, then publish:
 *   - rename "<Team> Neon 3D Phone Case" -> "<Team> Phone Case"
 *   - set crest scale 1.05 -> 0.881517949935498 (centred)
 *   - publish.json (Printify->Shopify is reconnected & working)
 *
 *   set -a; . ./.env.printify; set +a; node scripts/printify-neon-cases-apply-uzb.mjs
 */
const TOKEN = process.env.PRINTIFY_API_TOKEN;
const SHOP = process.env.PRINTIFY_SHOP_ID || '26998008';
const API = 'https://api.printify.com/v1';
const h = { Authorization: `Bearer ${TOKEN}`, 'User-Agent': 'iFC', 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SCALE = 0.881517949935498;
const UZB_ID = '6a272b3dfc1a62a9900e5732'; // already done by hand

const req = async (path, opts = {}, attempt = 0) => {
  const r = await fetch(`${API}${path}`, { ...opts, headers: h });
  if ((r.status === 429 || r.status >= 500) && attempt < 7) {
    const ra = Number(r.headers.get('retry-after')) || 0;
    const wait = ra ? ra * 1000 : Math.min(60000, 2000 * 2 ** attempt);
    console.log(`    … ${r.status} retry in ${Math.round(wait / 1000)}s`);
    await sleep(wait); return req(path, opts, attempt + 1);
  }
  const t = await r.text(); let b; try { b = JSON.parse(t); } catch { b = t; }
  return { ok: r.ok, status: r.status, body: b };
};

const PUBLISH_BODY = JSON.stringify({ title: true, description: true, images: true, variants: true, tags: true, keyFeatures: true, shipping_template: true });

// collect all neon cases
let cases = [];
for (let page = 1; ; page++) {
  const { body } = await req(`/shops/${SHOP}/products.json?limit=50&page=${page}`);
  const data = body.data || [];
  for (const p of data) if (/Neon 3D Phone Case/i.test(p.title)) cases.push(p.id);
  if (data.length < 50) break;
}
console.log(`neon cases to update: ${cases.length}`);

let upd = 0, pub = 0, fail = 0;
for (const id of cases) {
  if (id === UZB_ID) continue;
  const { body: p } = await req(`/shops/${SHOP}/products/${id}.json`);
  const newTitle = p.title.replace(/ Neon 3D Phone Case$/i, ' Phone Case');
  const ALL = p.variants.map((v) => v.id);
  const bg = p.print_areas?.[0]?.background || '#ffffff';
  const img = p.print_areas[0].placeholders.find((x) => x.position === 'front').images[0];
  const put = await req(`/shops/${SHOP}/products/${id}.json`, {
    method: 'PUT',
    body: JSON.stringify({
      title: newTitle,
      print_areas: [{ variant_ids: ALL, background: bg, placeholders: [{ position: 'front', images: [{ id: img.id, x: 0.5, y: 0.5, scale: SCALE, angle: 0 }] }] }],
    }),
  });
  if (!put.ok) { fail++; console.log(`  ✖ update ${p.title}: ${put.status} ${JSON.stringify(put.body).slice(0,100)}`); continue; }
  upd++;
  const publish = await req(`/shops/${SHOP}/products/${id}/publish.json`, { method: 'POST', body: PUBLISH_BODY });
  if (publish.ok) { pub++; console.log(`  ok   ${newTitle.padEnd(34)} updated + published`); }
  else { fail++; console.log(`  ⚠ ${newTitle}: published-call ${publish.status}`); }
  await sleep(900);
}
console.log(`\nDone. updated=${upd} published=${pub} fail=${fail}`);
