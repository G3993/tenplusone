#!/usr/bin/env python3
"""
iFC screen-size logo normalizer.

Renders every SVG in frontend/public/logos/*.svg onto a 540×540 canvas
(45-unit grid × 12 px) with a 2-unit (24 px) transparent inset, content
bbox-fit + centered. Writes black + white silhouette variants used by the
website's <TeamLogo> at runtime:

  frontend/public/logos/norm/black/<slug>.png   (black crest, transparent bg)
  frontend/public/logos/norm/white/<slug>.png   (white crest, transparent bg)

Mirror of the print pipeline (scripts/normalize-logos-print.py) but sized
for the screen. Re-run after any source SVG change, then bump LOGO_VERSION
in src/components/team/TeamLogo.tsx.

Usage:
    python3 scripts/normalize-logos-screen.py
"""

from __future__ import annotations

import shutil
import subprocess
import sys
from io import BytesIO
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Missing Pillow. Install with: pip3 install Pillow")

REPO = Path(__file__).resolve().parents[1]
SRC_DIR = REPO / "frontend" / "public" / "logos"
OUT_ROOT = SRC_DIR / "norm"

GRID = 45
PAD = 2
INNER = GRID - PAD * 2          # 41
SCALE = 12                      # px per unit
CANVAS = GRID * SCALE           # 540
INNER_PX = INNER * SCALE        # 492
INTERNAL = GRID * 100           # high-res render before downsample


def color_swap(text: str, fill_hex: str) -> str:
    if 'fill="#000000"' in text:
        return text.replace('fill="#000000"', f'fill="{fill_hex}"', 1)
    if 'fill="#FFFFFF"' in text:
        return text.replace('fill="#FFFFFF"', f'fill="{fill_hex}"', 1)
    return text.replace("<svg ", f'<svg fill="{fill_hex}" ', 1)


def render(svg_text: str, px: int) -> bytes:
    return subprocess.run(
        ["/opt/homebrew/bin/rsvg-convert", "-w", str(px), "-h", str(px),
         "--keep-aspect-ratio", "-b", "transparent"],
        input=svg_text.encode("utf-8"), capture_output=True, check=True,
    ).stdout


def fit(im: Image.Image, canvas: int, inner: int) -> Image.Image:
    bbox = im.split()[-1].getbbox()
    if bbox is None:
        return Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    crop = im.crop(bbox)
    cw, ch = crop.size
    s = min(inner / cw, inner / ch)
    nw, nh = max(1, round(cw * s)), max(1, round(ch * s))
    resized = crop.resize((nw, nh), Image.Resampling.NEAREST)
    out = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    out.paste(resized, ((canvas - nw) // 2, (canvas - nh) // 2), resized)
    return out


def main() -> None:
    if OUT_ROOT.exists():
        shutil.rmtree(OUT_ROOT)
    for color in ("black", "white"):
        (OUT_ROOT / color).mkdir(parents=True, exist_ok=True)

    sources = sorted(p for p in SRC_DIR.glob("*.svg") if p.is_file())
    if not sources:
        sys.exit(f"No source SVGs in {SRC_DIR}")

    for src in sources:
        slug = src.stem
        text = src.read_text(encoding="utf-8")
        for color, hexcode in (("black", "#000000"), ("white", "#FFFFFF")):
            png = render(color_swap(text, hexcode), INTERNAL)
            im = Image.open(BytesIO(png)).convert("RGBA")
            fitted = fit(im, INTERNAL, round(INTERNAL * (INNER / GRID)))
            final = fitted.resize((CANVAS, CANVAS), Image.Resampling.NEAREST)
            final.save(OUT_ROOT / color / f"{slug}.png", format="PNG", optimize=True)
        print(f"  ✓ {slug}")

    print(f"\nGenerated {len(sources)} logos × 2 colors → {OUT_ROOT.relative_to(REPO)}")
    print("Remember to bump LOGO_VERSION in src/components/team/TeamLogo.tsx")


if __name__ == "__main__":
    main()
