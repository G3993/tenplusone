#!/usr/bin/env python3
"""
iFC crest generator — single source of truth: scripts/team_pixels.json.

team_pixels.json holds, per team, a list of 1-based pixel IDs on a 32x32 grid
(the format exported by the 3D grid package / vector-grid tool). For a pid:

    idx = pid - 1
    row = idx // 32   (y, top-to-bottom)
    col = idx %  32   (x, left-to-right)

From that grid this script regenerates every downstream representation the site
and merch pipeline consume, so they can never drift apart again:

  frontend/public/logos/<slug>.svg          black run-length crest (fill #000000)
  frontend/public/logos/white/<slug>.svg    white mirror          (fill #ffffff)
  frontend/src/data/team-logos/<slug>.ts    <SLUG>_PIXELS 0-based index array

The SVGs are the source the normalizers (normalize-logos-screen.py /
normalize-logos-print.py) render into the runtime PNGs. After running this:

    python3 scripts/pixels-to-svg.py
    python3 scripts/normalize-logos-screen.py
    python3 scripts/normalize-logos-print.py
    # then bump LOGO_VERSION in src/components/team/TeamLogo.tsx

Idempotent: only rewrites a file when its content actually changes.
"""

from __future__ import annotations

import json
from pathlib import Path

GRID = 32
REPO = Path(__file__).resolve().parents[1]
JSON_SRC = Path(__file__).resolve().parent / "team_pixels.json"
LOGO_DIR = REPO / "frontend" / "public" / "logos"
WHITE_DIR = LOGO_DIR / "white"
PIXELS_DIR = REPO / "frontend" / "src" / "data" / "team-logos"

# package key -> repo slug (only the ones that differ from a 1:1 mapping)
KEY_TO_SLUG = {
    "bosnia": "bosnia-herzegovina",
    "cabo_verde": "cabo-verde",
    "dr_congo": "dr-congo",
    "ivory_coast": "cote-d-ivoire",
    "new_zealand": "new-zealand",
    "saudi_arabia": "saudi-arabia",
    "south_africa": "south-africa",
    "south_korea": "south-korea",
    "turkey": "turkiye",
    "usa": "united-states",
}


def slug_to_export(slug: str) -> str:
    return slug.upper().replace("-", "_") + "_PIXELS"


def run_length_rects(idx0: set[int]) -> str:
    """Horizontal run-length <rect>s (height 1) over the 32x32 grid."""
    rects: list[str] = []
    for row in range(GRID):
        col = 0
        while col < GRID:
            if (row * GRID + col) in idx0:
                start = col
                while col < GRID and (row * GRID + col) in idx0:
                    col += 1
                rects.append(
                    f'<rect x="{start}" y="{row}" width="{col - start}" height="1"></rect>'
                )
            else:
                col += 1
    return "".join(rects)


def svg(idx0: set[int], fill: str) -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {GRID} {GRID}" '
        f'shape-rendering="crispEdges" fill="{fill}">'
        + run_length_rects(idx0)
        + "</svg>"
    )


def write_if_changed(path: Path, content: str) -> bool:
    if path.exists() and path.read_text() == content:
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content)
    return True


def main() -> None:
    teams = json.loads(JSON_SRC.read_text())
    changed = 0
    for key, data in teams.items():
        slug = KEY_TO_SLUG.get(key, key)
        idx0 = {p - 1 for p in data["pixels"]}  # 1-based pid -> 0-based index

        wrote = []
        if write_if_changed(LOGO_DIR / f"{slug}.svg", svg(idx0, "#000000")):
            wrote.append("svg")
        if write_if_changed(WHITE_DIR / f"{slug}.svg", svg(idx0, "#ffffff")):
            wrote.append("white")

        arr = ",".join(str(i) for i in sorted(idx0))
        ts = f"export const {slug_to_export(slug)}: number[] = [{arr}];\n"
        if write_if_changed(PIXELS_DIR / f"{slug}.ts", ts):
            wrote.append("ts")

        if wrote:
            changed += 1
            print(f"  {slug:20s} {' '.join(wrote)}")

    print(f"\n{len(teams)} teams processed, {changed} with changes.")


if __name__ == "__main__":
    main()
