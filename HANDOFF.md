# iFC — Session Handoff

internetfc.com (iFC, "internet football club") — a World Cup 2026 culture +
prediction + merch site. Brand: the people's federation, enemy = FIFA. Paste
this whole file into a fresh session to continue.

---

## Repo & deploy

- **Repo root:** `/Users/lu/tenplusone` (run vercel commands from here)
- **Frontend:** `/Users/lu/tenplusone/frontend` — Vite + React 19 + TS,
  react-router v7, Zustand, CSS Modules
- **Vercel project:** `tenplusone` (team `gonzalogelso-9384s-projects`) →
  aliases to **https://www.internetfc.com**
- **Build:** `cd frontend && npx tsc --noEmit -p tsconfig.app.json && npx vite build`
- **Deploy (MUST run from repo root for the alias line):**
  `cd /Users/lu/tenplusone && npx vercel deploy --prod --yes`
  → wait for `Aliased: https://www.internetfc.com`

### ⚠️ Vercel env-var gotcha (important)
This machine's Vercel CLI silently sets **empty** values for `vercel env add`
(interactive AND piped). Set env vars via the **REST API** instead:
- auth token: `~/Library/Application Support/com.vercel.cli/auth.json` → `.token`
- ids: `/Users/lu/tenplusone/.vercel/project.json`
  (projectId `prj_wT4K965WxRcfN1NsYQPWUdiDHI3p`, orgId `team_A8zonZNvIdGiu4W3W2fw7DM7`)
- DELETE existing then POST `https://api.vercel.com/v10/projects/{proj}/env?teamId={team}`
  with `{key,value,type:"encrypted",target:["production","preview"]}`
- verify with `npx vercel env pull --environment=production .env.x` then grep.

---

## Status by workstream

### ✅ Shopify — CONNECTED
- Store: **Internet Soccer Club**, domain **internet-soccer-club.myshopify.com**
- Storefront token `d8f0d03cc9590f558daa900d75b4036b` wired in Vercel
  (`VITE_SHOPIFY_STORE_DOMAIN` + `VITE_SHOPIFY_STOREFRONT_TOKEN`, prod+preview)
- `/merch` reads live Shopify. Shows empty state until products are published.
- Client: `frontend/src/lib/shopify.ts` (auto-leaves mock mode when env set).
- SECURITY: user pasted Admin token (`shpat_…`) + API secret (`shpss_…`) in
  chat earlier — advise rotating those. Storefront token is public/read-only.

### ⏳ Printify — token works, batch not run
- Token saved at `/tmp/ifc-printify-token` (may expire; user regenerates at
  Printify → My account → Connections → API).
- **Real shop = "IFC" (id 26998008)**, connected to the Shopify store.
  "Ten + One" (1943827) is DISCONNECTED and holds a stray Morocco test tee +
  ~15 manual tees — ignore/clean later.
- Generator: `scripts/printify-generate.mjs` — currently auto-targets the
  first shop ("Ten + One"); **must set `PRINTIFY_SHOP_ID=26998008`** (or edit
  default) before the real batch. Reads art from deployed
  `https://www.internetfc.com/logos/print/4500/{black,white}/{slug}.png`.
  Has `--list`, `--team <slug>`, `--all`, `--dry-run`, `--no-publish`,
  `--force`; skip-existing + black/white-per-print-area logic done.
- Teams data: `scripts/printify-teams.json` (48). Docs: `scripts/PRINTIFY_GENERATOR.md`.
- NEXT: confirm reference product/templates in the IFC shop → set shop id →
  `--team <test>` → verify → `--all`.

### ⏳ Logos — extracted, mapping NEEDS USER VERIFY (blocker)
- Source of truth: `/Users/lu/Documents/isc_logos.pdf` (48 upgraded crests,
  49×49pt = 45-grid + 2pt pad). Current `frontend/public/logos/*.svg` came
  from an earlier bundle with a **SCRAMBLED page→team mapping** (e.g. DFB
  eagle filed as algeria, FCF as uruguay, Türkiye crescent as czechia).
- Clean **black-pixels-only** run-length SVGs already extracted to
  `/tmp/pdf-logos/out/*.svg`; verification montage at `/tmp/pdf-logos/verify.png`.
  Extractor: `/tmp/pdf-logos/extract.py`.
- **BLOCKED:** user must confirm the page→team mapping (or correct it). Then:
  copy verified SVGs → `frontend/public/logos/`, run
  `python3 scripts/normalize-logos-print.py` + `normalize-logos-screen.py`,
  bump `LOGO_VERSION` in `frontend/src/components/team/TeamLogo.tsx` (currently 6),
  build + deploy. See memory `ifc_logo_svg_format.md`.

### ✅ Brand reposition (terminal → magazine) — shipped
Nav: "merch"→"shop", minimal `iFC` mark, `/shop` alias. Homepage: spelled-out
"Internet Football Club" + community lede + WC block ("…may the best team
win", no FIFA, no "browse/predict/own"). Homepage groups: size slider +
unified gray headers. WC26: hero row removed (tabs only); calendar bigger
logos + smaller text + countdown; matches = 2-col card grid (no line numbers,
balanced centered team stacks, "vs" centered, stage label + date + venue);
bracket cards rounded; outrights bigger; "outrights"→"winner prediction".
Team detail: bigger crest, ALL CAPS name. Odds = American + rounded chips.
Brand tokens/`SectionHead`/pixel `Wordmark` from design bundle applied.

### ✅ Social system — scaffolded (`social/`)
- `social/VOICE.md` — voice playbook (60/30/10 serious/meme/troll, FIFA enemy
  rules, do/don'ts, caption formulas, gut check).
- `social/content-engine/` — 6 pillar configs (matchday, battle-of-pixels,
  crest-lore, peoples-desk, countdown, drops), `calendar/schedule.md`,
  `queue/` (drafts→approved→posted human-approve gate), `templates/`.
- `social/platforms/` — IG/TikTok/X/FB/YouTube specs.
- `social/SIGNUP.md` — email + 5-handle recipe (USER's ~15-min task; I can't
  create accounts). Recommended handle: `@internetfc`. Human-approve gate.

### ✅ Obsidian — vault populated
- Vault: `/Users/lu/Documents/Gonzalo Gelso/tenplusone` (MCP `obsidian-tenplusone`)
- `World Cup 2026/teams/` — 48 team dossiers (crest paths, players-to-watch,
  content angles, crest-lore checklist) + `_Teams Index.md` (grouped MOC).
- Generator: `/tmp/gen-team-dossiers.mjs` (reads printify-teams.json + teamFacts.ts).

### ✅ Connections (verified working)
Obsidian ✅ · Higgsfield ✅ (5,328 credits, Creator plan) · Shopify MCP ✅.
Higgsfield tools: `mcp__claude_ai_Higgsfield__*` (generate_image, generate_video,
balance, etc.).

---

## Next actions (pick up here)

1. **Logos (highest value, blocked on user):** confirm `/tmp/pdf-logos/verify.png`
   mapping → apply 48 SVGs → regenerate print+screen → bump LOGO_VERSION → deploy.
2. **Printify batch:** point generator at IFC shop (26998008), confirm template,
   test one team, run `--all`, publish → products appear on `/merch`.
3. **Higgsfield content engine:** test a cinematic crest reveal (e.g. Argentina),
   then wire generation into the matchday/crest-lore pillars.
4. **Crest lore:** fill the empty fact checklists across the 48 Obsidian dossiers.
5. **Social accounts:** user does `social/SIGNUP.md`; then wire an aggregator
   API (Ayrshare/Postiz) for cross-posting behind the approve gate.

## Gated on external services / user
- Newsletter persistence: provision **Vercel KV** (`/api/subscribe` no-ops til then)
- Contact email: **RESEND_API_KEY** (`/api/contact` logs til then)
- Social posting: accounts (SIGNUP.md) + aggregator API; X write API is paid (~$100/mo)
- Email mailbox `hello@internetfc.com`: Google Workspace / forwarder

## Key memories
`ifc_logo_svg_format.md`, `pixel_logos_project.md`, `feedback_spacing_grid.md`
(audit spacing as a grid every UI pass).
