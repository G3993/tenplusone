#!/usr/bin/env python3
"""
iFC logo system builder — the single generator behind the logo hub + the
Obsidian "Logo Bible".

Source of truth: scripts/team_pixels.json (1-based pixel IDs on a 32x32 grid;
idx = pid-1, row = idx//32, col = idx%32). For every team it produces vector +
print variations, all normalized into the SAME 45-unit frame with a 2-unit
(4.44%) transparent inset, bbox-fit + centered — so every crest carries uniform
margins (drop any two side by side and the optical weight matches).

Variations
  black SVG    fill #000000, logo only, transparent elsewhere
  white SVG    fill #ffffff mirror
  cutout SVG   solid black 45x45 square with the logo punched out transparent
               (mask-based stencil — "see through where the black used to be")
  print PNG    4500x4500 @ 300 DPI (15"x15"), black, padding baked in

Outputs
  frontend/public/logos/final/{svg,white,cutout}/<slug>.svg   (served by /logos)
  <vault>/iFC Logo System/Final Logos/{SVG,Cutout,PNG}/<slug>.{svg,png}
  <vault>/iFC Logo System/team_pixels.json                    (pixel source)

Usage: python3 scripts/build-logo-system.py
"""

from __future__ import annotations
import json, subprocess, sys
from io import BytesIO
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Missing Pillow: pip3 install Pillow")

REPO = Path(__file__).resolve().parents[1]
SRC = REPO / "scripts" / "team_pixels.json"
WEB = REPO / "frontend" / "public" / "logos" / "final"
VAULT = Path("/Users/lu/Documents/Gonzalo Gelso/tenplusone/iFC Logo System")
RSVG = "/opt/homebrew/bin/rsvg-convert"

GRID32 = 32
GRID = 45            # normalized frame
PAD = 2              # transparent inset on every side
INNER = GRID - PAD * 2   # 41
PRINT_PX = 4500     # 15" x 15" @ 300 DPI  (standard apparel)
LARGE_PX = 6000     # 20" x 20" @ 300 DPI  (Printify large / all-over-print)
CUTOUT_PX = 2000    # stencil raster (>= 1000)
PRINT_DPI = 300

# package key -> repo slug (matches scripts/pixels-to-svg.py)
KEY_TO_SLUG = {
    "bosnia": "bosnia-herzegovina", "cabo_verde": "cabo-verde", "dr_congo": "dr-congo",
    "ivory_coast": "cote-d-ivoire", "new_zealand": "new-zealand", "saudi_arabia": "saudi-arabia",
    "south_africa": "south-africa", "south_korea": "south-korea", "turkey": "turkiye",
    "usa": "united-states",
}


def f(x: float) -> str:
    """Compact float formatting for SVG coords."""
    return f"{x:.4f}".rstrip("0").rstrip(".")


def normalized_rects(pixels: list[int]) -> list[tuple[float, float, float, float]]:
    """Return (x,y,w,h) rects in the 45-frame, bbox-fit + centered, run-length per row."""
    idx0 = {p - 1 for p in pixels}
    cols = [i % GRID32 for i in idx0]
    rows = [i // GRID32 for i in idx0]
    minc, maxc, minr, maxr = min(cols), max(cols), min(rows), max(rows)
    bw, bh = maxc - minc + 1, maxr - minr + 1
    scale = INNER / max(bw, bh)
    x0 = PAD + (INNER - bw * scale) / 2
    y0 = PAD + (INNER - bh * scale) / 2
    rects = []
    for r in range(minr, maxr + 1):
        c = minc
        while c <= maxc:
            if (r * GRID32 + c) in idx0:
                start = c
                while c <= maxc and (r * GRID32 + c) in idx0:
                    c += 1
                rects.append((
                    x0 + (start - minc) * scale, y0 + (r - minr) * scale,
                    (c - start) * scale, scale,
                ))
            else:
                c += 1
    return rects


def rects_markup(rects, fill: str) -> str:
    body = "".join(
        f'<rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}"></rect>'
        for x, y, w, h in rects
    )
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {GRID} {GRID}" '
        f'width="{GRID}" height="{GRID}" shape-rendering="crispEdges" fill="{fill}">{body}</svg>'
    )


def cutout_markup(rects, fill: str) -> str:
    """Solid `fill`-colored square with the logo masked out (transparent holes)."""
    holes = "".join(
        f'<rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}"></rect>'
        for x, y, w, h in rects
    )
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {GRID} {GRID}" '
        f'width="{GRID}" height="{GRID}" shape-rendering="crispEdges">'
        f'<defs><mask id="cut" maskUnits="userSpaceOnUse" x="0" y="0" width="{GRID}" height="{GRID}">'
        f'<rect width="{GRID}" height="{GRID}" fill="#ffffff"></rect>'
        f'<g fill="#000000">{holes}</g></mask></defs>'
        f'<rect width="{GRID}" height="{GRID}" fill="{fill}" mask="url(#cut)"></rect></svg>'
    )


def write(path: Path, text: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text)


def render_png(svg: str, out: Path, px: int, dpi: int = PRINT_DPI):
    png = subprocess.run(
        [RSVG, "-w", str(px), "-h", str(px), "--format=png"],
        input=svg.encode(), capture_output=True, check=True,
    ).stdout
    im = Image.open(BytesIO(png)).convert("RGBA")
    out.parent.mkdir(parents=True, exist_ok=True)
    im.save(out, dpi=(dpi, dpi))


def main():
    teams = json.loads(SRC.read_text())
    # co-locate the pixel source in the vault
    (VAULT).mkdir(parents=True, exist_ok=True)
    (VAULT / "team_pixels.json").write_text(SRC.read_text())

    fl = VAULT / "Final Logos"
    n = 0
    for key, data in teams.items():
        slug = KEY_TO_SLUG.get(key, key)
        rects = normalized_rects(data["pixels"])

        # Four variants × build the markup once each. (vault label, web subdir, svg)
        variants = [
            ("Black",        "svg",          rects_markup(rects, "#000000")),
            ("White",        "white",        rects_markup(rects, "#ffffff")),
            ("Cutout Black", "cutout",       cutout_markup(rects, "#000000")),
            ("Cutout White", "cutout-white", cutout_markup(rects, "#ffffff")),
        ]

        for label, web_sub, svg in variants:
            # web vectors (served by /logos)
            write(WEB / web_sub / f"{slug}.svg", svg)
            # vault vectors
            write(fl / "SVG" / label / f"{slug}.svg", svg)
            # vault raster — standard (4500) + large (6000), every variant both colors
            render_png(svg, fl / "PNG" / label / f"{slug}.png", PRINT_PX)
            render_png(svg, fl / "PNG Large" / label / f"{slug}.png", LARGE_PX)

        n += 1
        print(f"  {slug:20s} 4 variants × (svg + png4500 + png6000)")
    print(f"\n{n} teams · web → {WEB} · vault → {VAULT}")


if __name__ == "__main__":
    main()
