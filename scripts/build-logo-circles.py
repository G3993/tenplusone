#!/usr/bin/env python3
"""
iFC circle-pixel logo variants — same crests, but every pixel is a centered
disc instead of a square. Mirrors build-logo-system.py's variant matrix.

Source: scripts/team_pixels.json. Normalized 45-unit frame / 2-unit pad.

Outputs (square's siblings):
  frontend/public/logos/final-circle/{svg,white,cutout,cutout-white}/<slug>.svg
  <vault>/iFC Logo System/Final Logos Circle/{SVG,PNG,PNG Large}/<Variant>/<slug>.{svg,png}

Usage: python3 scripts/build-logo-circles.py [--no-png]
"""
from __future__ import annotations
import json, subprocess, sys
from io import BytesIO
from pathlib import Path
from PIL import Image

REPO = Path(__file__).resolve().parents[1]
SRC = REPO / "scripts" / "team_pixels.json"
WEB = REPO / "frontend" / "public" / "logos" / "final-circle"
VAULT = Path("/Users/lu/Documents/Gonzalo Gelso/tenplusone/iFC Logo System/Final Logos Circle")
RSVG = "/opt/homebrew/bin/rsvg-convert"

GRID32 = 32
GRID, PAD = 45, 2
INNER = GRID - PAD * 2
PRINT_PX, LARGE_PX, DPI = 4500, 6000, 300
DO_PNG = "--no-png" not in sys.argv

KEY_TO_SLUG = {
    "bosnia": "bosnia-herzegovina", "cabo_verde": "cabo-verde", "dr_congo": "dr-congo",
    "ivory_coast": "cote-d-ivoire", "new_zealand": "new-zealand", "saudi_arabia": "saudi-arabia",
    "south_africa": "south-africa", "south_korea": "south-korea", "turkey": "turkiye", "usa": "united-states",
}


def f(x): return f"{x:.4f}".rstrip("0").rstrip(".")


def circles(pixels):
    """(cx, cy, r) per on-pixel, bbox-fit + centered in the 45 frame."""
    idx0 = {p - 1 for p in pixels}
    cols = [i % GRID32 for i in idx0]; rows = [i // GRID32 for i in idx0]
    minc, maxc, minr, maxr = min(cols), max(cols), min(rows), max(rows)
    bw, bh = maxc - minc + 1, maxr - minr + 1
    scale = INNER / max(bw, bh)
    x0 = PAD + (INNER - bw * scale) / 2
    y0 = PAD + (INNER - bh * scale) / 2
    r = scale / 2
    return [(x0 + (i % GRID32 - minc + 0.5) * scale, y0 + (i // GRID32 - minr + 0.5) * scale, r) for i in idx0]


def svg_circles(cells, fill):
    body = "".join(f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}"></circle>' for cx, cy, r in cells)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {GRID} {GRID}" '
            f'width="{GRID}" height="{GRID}" fill="{fill}">{body}</svg>')


def svg_cutout(cells, fill):
    holes = "".join(f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}"></circle>' for cx, cy, r in cells)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {GRID} {GRID}" width="{GRID}" height="{GRID}">'
            f'<defs><mask id="c" maskUnits="userSpaceOnUse" x="0" y="0" width="{GRID}" height="{GRID}">'
            f'<rect width="{GRID}" height="{GRID}" fill="#ffffff"></rect>'
            f'<g fill="#000000">{holes}</g></mask></defs>'
            f'<rect width="{GRID}" height="{GRID}" fill="{fill}" mask="url(#c)"></rect></svg>')


def write(p, t): p.parent.mkdir(parents=True, exist_ok=True); p.write_text(t)


def png(svg, out, px):
    raw = subprocess.run([RSVG, "-w", str(px), "-h", str(px), "--format=png"],
                         input=svg.encode(), capture_output=True, check=True).stdout
    out.parent.mkdir(parents=True, exist_ok=True)
    Image.open(BytesIO(raw)).convert("RGBA").save(out, dpi=(DPI, DPI))


def main():
    teams = json.loads(SRC.read_text())
    n = 0
    for key, d in teams.items():
        slug = KEY_TO_SLUG.get(key, key)
        cells = circles(d["pixels"])
        variants = [
            ("Black", "svg", svg_circles(cells, "#000000")),
            ("White", "white", svg_circles(cells, "#ffffff")),
            ("Cutout Black", "cutout", svg_cutout(cells, "#000000")),
            ("Cutout White", "cutout-white", svg_cutout(cells, "#ffffff")),
        ]
        for label, web_sub, svg in variants:
            write(WEB / web_sub / f"{slug}.svg", svg)
            write(VAULT / "SVG" / label / f"{slug}.svg", svg)
            if DO_PNG:
                png(svg, VAULT / "PNG" / label / f"{slug}.png", PRINT_PX)
                png(svg, VAULT / "PNG Large" / label / f"{slug}.png", LARGE_PX)
        n += 1
        print(f"  {slug:20s} circle x4")
    print(f"\n{n} teams -> web {WEB}  vault {VAULT}  png={DO_PNG}")


if __name__ == "__main__":
    main()
