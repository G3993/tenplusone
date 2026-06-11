/**
 * Build {gid, slug, code, tags} for every neon phone case, mapping the Printify
 * product (title -> team) to its Shopify product gid (external.id).
 * Writes /tmp/case_tags.json. Used to restore team tags that a bulk PUT wiped.
 *   set -a; . ./.env.printify; set +a; node scripts/build-case-tags.mjs
 */
import { writeFileSync, readFileSync } from 'node:fs';
const TOKEN = process.env.PRINTIFY_API_TOKEN, SHOP = process.env.PRINTIFY_SHOP_ID || '26998008';
const API = 'https://api.printify.com/v1';
const h = { Authorization: `Bearer ${TOKEN}`, 'User-Agent': 'iFC' };
const teams = JSON.parse(readFileSync('/Users/lu/tenplusone/scripts/printify-teams.json', 'utf8'));
const byName = new Map(teams.map((t) => [t.name, t]));

let page = 1, out = [], unmatched = [], nogid = [];
while (true) {
  const { data = [] } = await (await fetch(`${API}/shops/${SHOP}/products.json?limit=50&page=${page}`, { headers: h })).json();
  for (const p of data) {
    if (!/ Phone Case$/.test(p.title)) continue;
    const name = p.title.replace(/ Phone Case$/, '');
    const team = byName.get(name);
    if (!team) { unmatched.push(p.title); continue; }      // skips old "Argentina Phone Case" ref? no, that matches too
    if (!(p.external && p.external.id)) { nogid.push(p.title); continue; }
    const tags = [team.slug, team.code.toLowerCase(), 'ifc', 'world-cup-2026', 'phone-case', 'neon-3d', 'motif:3d'];
    out.push({ printifyId: p.id, gid: `gid://shopify/Product/${p.external.id}`, slug: team.slug, tags });
  }
  if (data.length < 50) break; page++;
}
// de-dupe by gid (two products can share a title e.g. old Argentina ref)
const seen = new Set(); const deduped = out.filter((o) => (seen.has(o.gid) ? false : seen.add(o.gid)));
writeFileSync('/tmp/case_tags.json', JSON.stringify(deduped, null, 0));
console.log(`cases mapped: ${deduped.length} | unmatched titles: ${unmatched.length} | linked-but-nogid: ${nogid.length}`);
if (unmatched.length) console.log('  unmatched:', unmatched.join(', '));
