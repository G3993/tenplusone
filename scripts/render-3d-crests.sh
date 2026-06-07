#!/usr/bin/env bash
# Render every team's 3D ("cube") crest to a transparent, print-ready PNG.
# Requires the vite dev server running on :5173 and the gstack browse CLI.
#   SIZE=1600 bash scripts/render-3d-crests.sh
set -uo pipefail

B="$HOME/.claude/skills/gstack/browse/dist/browse"
OUT="/Users/lu/tenplusone/frontend/public/logos/print/3d"
SIZE="${SIZE:-1600}"
TEAMS_JSON="/Users/lu/tenplusone/scripts/printify-teams.json"
mkdir -p "$OUT"

slugs=$(node -e 'JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).forEach(t=>console.log(t.slug))' "$TEAMS_JSON")

"$B" restart >/dev/null 2>&1
"$B" viewport "$((SIZE + 80))x$((SIZE + 80))" >/dev/null 2>&1

ok=0; fail=0
for slug in $slugs; do
  "$B" goto "http://localhost:5173/render/crest/$slug?motif=cube&size=$SIZE" >/dev/null 2>&1
  "$B" wait --networkidle >/dev/null 2>&1
  sleep 1.5
  "$B" js 'document.querySelector("#render-root canvas").toDataURL("image/png")' > /tmp/crest.out 2>/dev/null
  grep -o 'base64,[A-Za-z0-9+/=]*' /tmp/crest.out | head -1 | sed 's/^base64,//' | base64 -d > "$OUT/$slug.png" 2>/dev/null
  sz=$(wc -c < "$OUT/$slug.png" 2>/dev/null || echo 0)
  if [ "$sz" -gt 2000 ]; then ok=$((ok+1)); printf '  ok   %-22s %s bytes\n' "$slug" "$sz";
  else fail=$((fail+1)); printf '  FAIL %-22s %s bytes\n' "$slug" "$sz"; fi
done
echo "rendered ok=$ok fail=$fail into $OUT"
