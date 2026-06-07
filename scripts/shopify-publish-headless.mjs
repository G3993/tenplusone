/**
 * Publish every active product to the "Internet Soccer Club Headless" channel
 * so the iFC storefront (which reads that publication) shows them.
 *
 *   set -a; . ./.env.printify; set +a; node scripts/shopify-publish-headless.mjs
 */
const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || 'internet-soccer-club.myshopify.com';
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const PUB = 'gid://shopify/Publication/145681481898';
const URL = `https://${DOMAIN}/admin/api/2025-10/graphql.json`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (!TOKEN) { console.error('SHOPIFY_ADMIN_TOKEN not set'); process.exit(1); }

async function gql(query, variables = {}) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': TOKEN },
      body: JSON.stringify({ query, variables }),
    });
    const j = await res.json();
    const throttled = j.errors && j.errors.some((e) => (e.extensions?.code === 'THROTTLED') || /throttle/i.test(e.message || ''));
    if (throttled && attempt < 10) { await sleep(2000 + attempt * 1000); continue; }
    if (j.errors) throw new Error(JSON.stringify(j.errors));
    // pace by leftover cost budget
    const ts = j.extensions?.cost?.throttleStatus;
    if (ts && ts.currentlyAvailable < 200) await sleep(800);
    return j.data;
  }
}

// 1. verify access
const shop = await gql(`{ shop { name } publication(id:"${PUB}"){ name } }`);
console.log(`✓ admin access: ${shop.shop.name} | publication: ${shop.publication?.name}`);

// 2. product IDs come from the JSONL built off Printify's linked Shopify ids
//    (the token lacks read_products, and publishing is idempotent anyway).
const fs = await import('node:fs');
const targets = fs.readFileSync('/tmp/publish.jsonl', 'utf8')
  .split('\n').filter(Boolean).map((l) => JSON.parse(l).id);
console.log(`products to publish (from Printify link list): ${targets.length}`);

// 3. publish in batches
const BATCH = 40;
let done = 0, failed = 0;
for (let i = 0; i < targets.length; i += BATCH) {
  const chunk = targets.slice(i, i + BATCH);
  const body = chunk.map((id, n) => `p${n}: publishablePublish(id:"${id}", input:{publicationId:$pub}){ userErrors{ message } }`).join('\n');
  const data = await gql(`mutation($pub:ID!){ ${body} }`, { pub: PUB });
  for (const k of Object.keys(data)) {
    const errs = data[k].userErrors || [];
    if (errs.length) { failed++; console.log(`  ✖ ${chunk[Number(k.slice(1))]}: ${errs[0].message}`); } else done++;
  }
  console.log(`  ${Math.min(i + BATCH, targets.length)}/${targets.length} (ok ${done}, fail ${failed})`);
}
console.log(`\nDone. published ${done}, failed ${failed}.`);
