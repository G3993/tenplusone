#!/usr/bin/env bash
# Phase A: bake each team's neon-3D crest onto a 1190x2085 BLACK phone-case
# canvas (crest ~65% of width, centred). Outputs print-ready case art to
# /tmp/neon_cases/<slug>.png. Requires vite on :5173 + gstack browse CLI.
set -uo pipefail

B="$HOME/.claude/skills/gstack/browse/dist/browse"
SRC="/Users/lu/Documents/Gonzalo Gelso/tenplusone/iFC Logo System/Final Logos/iFC_PNG_XL/Neon 3D Teams"
PUB="/Users/lu/tenplusone/frontend/public/_neon_tmp"
OUT="/tmp/neon_cases"
TEAMS_JSON="/Users/lu/tenplusone/scripts/printify-teams.json"
CW=774   # crest width in px (~65% of 1190)
mkdir -p "$OUT" "$PUB"

slugs=$(node -e 'JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).forEach(t=>console.log(t.slug))' "$TEAMS_JSON")

# serve all neon crests through vite's public dir
for s in $slugs; do cp "$SRC/$s.png" "$PUB/$s.png"; done

"$B" restart >/dev/null 2>&1
"$B" viewport "400x700" >/dev/null 2>&1
"$B" goto "http://localhost:5173/" >/dev/null 2>&1
"$B" wait --networkidle >/dev/null 2>&1

ok=0; fail=0
for s in $slugs; do
  "$B" js "window.__m=null;var img=new Image();img.onload=function(){var c=document.createElement('canvas');c.width=1190;c.height=2085;var x=c.getContext('2d');x.imageSmoothingQuality='high';x.fillStyle='#000000';x.fillRect(0,0,c.width,c.height);var w=$CW,h=$CW;x.drawImage(img,(c.width-w)/2,(c.height-h)/2,w,h);window.__m=c.toDataURL('image/png');};img.onerror=function(){window.__m='ERR';};img.src='/_neon_tmp/$s.png?'+Date.now();'go'" >/dev/null 2>&1
  sleep 1.8
  "$B" js 'window.__m' > /tmp/_case.out 2>/dev/null
  grep -o 'base64,[A-Za-z0-9+/=]*' /tmp/_case.out | head -1 | sed 's/^base64,//' | base64 -d > "$OUT/$s.png" 2>/dev/null
  sz=$(wc -c < "$OUT/$s.png" 2>/dev/null || echo 0)
  if [ "$sz" -gt 5000 ]; then ok=$((ok+1)); printf '  ok   %-22s %s bytes\n' "$s" "$sz"; else fail=$((fail+1)); printf '  FAIL %-22s %s bytes\n' "$s" "$sz"; fi
done

rm -rf "$PUB"
echo "case art baked ok=$ok fail=$fail into $OUT"
