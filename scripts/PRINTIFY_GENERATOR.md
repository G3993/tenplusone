# iFC Printify Product Generator

Build one reference product per type by hand, then this script clones each
across all 48 teams and publishes them to Shopify. Decided 2026-05-22:
Printify is the source of truth and publishes into Shopify; the iFC site
reads Shopify.

## Why this works

Every crest is normalized to the same 45×45 grid with 2px padding (see
`frontend/public/logos/print/`). So the exact artwork placement you set on
the reference product is correct for all 48 teams — the script only swaps
the uploaded image. One placement, 48 correct prints.

## Step 1 — Build the reference set (by hand, once)

In Printify, create ONE product per product type you want to sell. Use any
single team's print file as the artwork (Argentina is a good reference).
For each, dial in:

- Blueprint (e.g. Bella+Canvas 3001 tee)
- Print provider
- Enabled variants (sizes/colors) + prices
- Artwork placement + scale on the print area
- Title/description don't matter on the reference — the script overwrites them

Upload artwork from the deployed print files, e.g.:
```
https://www.internetfc.com/logos/print/4500/white/argentina.png   (dark garments)
https://www.internetfc.com/logos/print/4500/black/argentina.png   (light garments)
```

## Step 2 — Get your API token + product ids

1. Printify → My account → Connections → API → generate a personal token.
2. ```bash
   export PRINTIFY_API_TOKEN=your_token_here
   ```
3. List your products to grab the reference ids:
   ```bash
   node scripts/printify-generate.mjs --list
   ```

## Step 3 — Fill in TEMPLATES

Open `scripts/printify-generate.mjs` and fill the `TEMPLATES` array with the
ids from `--list`. One entry per reference product:

```js
const TEMPLATES = [
  { type: 'tee',    templateId: '66xxxxxxxxxxxxxxxxxxxxxx', logoColor: 'white', typeLabel: 'Terminal Tee' },
  { type: 'hoodie', templateId: '66xxxxxxxxxxxxxxxxxxxxxx', logoColor: 'white', typeLabel: 'Hoodie' },
  { type: 'cap',    templateId: '66xxxxxxxxxxxxxxxxxxxxxx', logoColor: 'black', typeLabel: 'Cap' },
  // …one per product type
];
```

`logoColor` picks the print file: `white` for dark garments, `black` for
light garments.

## Step 4 — Test with ONE team

```bash
node scripts/printify-generate.mjs --team argentina --dry-run   # preview, no API writes
node scripts/printify-generate.mjs --team argentina             # really create + publish
```

Open the generated products in Printify. Check:
- Artwork centered, correct scale, no clipping
- Right garment colors enabled
- Price correct
- Published to Shopify (appears in Shopify admin → Products)

## Step 5 — Generate all 48

Once one team looks perfect:

```bash
node scripts/printify-generate.mjs --all               # create + publish all
node scripts/printify-generate.mjs --all --no-publish  # create only, publish later in Printify UI
```

That's 48 teams × (number of templates) products. The script logs each one
and keeps going if any single product errors.

## Re-running

The script is idempotent only in the sense that it always *creates new*
products — it does not dedupe. If you re-run `--all`, you'll get duplicates.
To change a price or placement across the catalog: update the reference
product(s), delete the old generated products in Printify (bulk select),
then re-run.

## Files

- `scripts/printify-generate.mjs` — the generator
- `scripts/printify-teams.json` — all 48 teams (name, slug, code, group), regenerated from `frontend/src/data/teams.ts`
- `frontend/public/logos/print/` — the print-ready artwork the script uploads
