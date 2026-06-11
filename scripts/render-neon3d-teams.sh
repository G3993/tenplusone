#!/usr/bin/env bash
# Render every team's NEON 3D ("team3d") crest — team colours, neonized, on a
# transparent background — into the Obsidian XL logo folder.
#   SIZE=4000 bash scripts/render-neon3d-teams.sh
set -uo pipefail

B="$HOME/.claude/skills/gstack/browse/dist/browse"
OUT="/Users/lu/Documents/Gonzalo Gelso/tenplusone/iFC Logo System/Final Logos/iFC_PNG_XL/Neon 3D Teams"
SIZE="${SIZE:-4000}"
TEAMS_JSON="/Users/lu/tenplusone/scripts/printify-teams.json"
mkdir -p "$OUT"

slugs=$(node -e 'JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).forEach(t=>console.log(t.slug))' "$TEAMS_JSON")

"$B" restart >/dev/null 2>&1
"$B" viewport "$((SIZE + 80))x$((SIZE + 80))" >/dev/null 2>&1

ok=0; fail=0
for slug in $slugs; do
  "$B" goto "http://localhost:5173/render/crest/$slug?motif=team3d&size=$SIZE" >/dev/null 2>&1
  "$B" wait --networkidle >/dev/null 2>&1
  sleep 1.5
  "$B" js 'document.querySelector("#render-root canvas").toDataURL("image/png")' > /tmp/neon3d.out 2>/dev/null
  grep -o 'base64,[A-Za-z0-9+/=]*' /tmp/neon3d.out | head -1 | sed 's/^base64,//' | base64 -d > "$OUT/$slug.png" 2>/dev/null
  sz=$(wc -c < "$OUT/$slug.png" 2>/dev/null || echo 0)
  if [ "$sz" -gt 5000 ]; then ok=$((ok+1)); printf '  ok   %-22s %s bytes\n' "$slug" "$sz";
  else fail=$((fail+1)); printf '  FAIL %-22s %s bytes\n' "$slug" "$sz"; fi
done
echo "rendered ok=$ok fail=$fail into: $OUT"
