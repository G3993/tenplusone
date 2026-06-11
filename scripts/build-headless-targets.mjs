/**
 * Collect Shopify product GIDs (from Printify external ids) for products that
 * need adding to the headless publication — phone cases + embroidered caps.
 * Writes /tmp/headless_targets.json as ["gid://shopify/Product/...", ...].
 *   set -a; . ./.env.printify; set +a; node scripts/build-headless-targets.mjs
 */
import { writeFileSync } from 'node:fs';
const TOKEN = process.env.PRINTIFY_API_TOKEN, SHOP = process.env.PRINTIFY_SHOP_ID || '26998008';
const API = 'https://api.printify.com/v1';
const h = { Authorization: `Bearer ${TOKEN}`, 'User-Agent': 'iFC' };
let page = 1, gids = [], unlinked = [];
while (true) {
  const r = await fetch(`${API}/shops/${SHOP}/products.json?limit=50&page=${page}`, { headers: h });
  const { data = [] } = await r.json();
  for (const p of data) {
    if (!/(phone case$|embroidered cap)/i.test(p.title)) continue;
    if (p.external && p.external.id) gids.push(`gid://shopify/Product/${p.external.id}`);
    else unlinked.push(p.title);
  }
  if (data.length < 50) break; page++;
}
writeFileSync('/tmp/headless_targets.json', JSON.stringify(gids));
console.log(`cases+caps linked to Shopify: ${gids.length}  | still unlinked: ${unlinked.length}`);
if (unlinked.length) console.log('  unlinked:', unlinked.join(', '));
