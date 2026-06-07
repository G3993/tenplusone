#!/usr/bin/env python3
"""
iFC print-ready logo normalizer.

Reads every monochromatic SVG in `frontend/public/logos/*.svg`, renders each
one onto a 45-unit pixel grid with a 2-unit transparent inset, and writes
TWO sets of artifacts: high-res PNG masters at 300 DPI for raster printers
(Printful/Printify, screen print preview), and clean SVG masters for vector
printers (DTG file uploads that accept SVG, large-format poster work).

Output (in frontend/public/logos/print/):

  master.svg/
    black/<slug>.svg         vector master, fill #000000, 45x45 viewBox
    white/<slug>.svg         vector master, fill #ffffff, 45x45 viewBox

  4500/
    black/<slug>.png         4500x4500 PNG @ 300 DPI (15" x 15")
    white/<slug>.png         4500x4500 PNG @ 300 DPI (15" x 15")

  3000/
    black/<slug>.png         3000x3000 PNG @ 300 DPI (10" x 10")
    white/<slug>.png         3000x3000 PNG @ 300 DPI (10" x 10")

  manifest.json              { slug: { sources, sizes, dpi, padding_units } }

Both rasters use the same 45-unit grid math the screen system uses
(2-unit padding all around, content bbox-fit + centered in the 41-unit
inner area), so a logo printed at any size lands identically positioned.

Usage:
    python3 scripts/normalize-logos-print.py
"""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

try:
    from PIL import Image
except ImportError as exc:  # pragma: no cover
    sys.exit("Missing Pillow. Install with: pip3 install Pillow")

REPO = Path(__file__).resolve().parents[1]
SRC_DIR = REPO / "frontend" / "public" / "logos"
OUT_ROOT = SRC_DIR / "print"

# 45-unit grid system, identical to the screen pipeline. 2-unit padding =
# 4.44% transparent inset on all sides; inner content area = 41 units.
GRID = 45
PAD = 2
INNER = GRID - PAD * 2  # 41

# Raster sizes to generate. Multiplier maps unit -> pixels.
RASTER_SIZES = {
    # 4500x4500 -> 15" x 15" at 300 DPI. Covers most Printful/Printify
    # print areas (back of tee = 14", front = 12", hoodie front = 12").
    "4500": 100,
    # 3000x3000 -> 10" x 10" at 300 DPI. Caps, sleeve prints, posters.
    "3000": 200 // 3,  # 66.67 unrounded; we use a higher source-render scale below
}

# DPI metadata written into every PNG (Printful reads this to set physical
# size; if missing, it defaults to 72 DPI and the print comes out tiny).
PRINT_DPI = 300

# Internal render-scale: how big to render each source SVG before crop+fit.
# The source viewBoxes are ~28 units wide; rendering at ~120x source = ~3360px,
# which gives enough resolution to downsample-fit any output size without
# aliasing. NEAREST resample preserves the pixel-grid character.
INTERNAL_UNIT_PX = 120
INTERNAL_CANVAS = GRID * INTERNAL_UNIT_PX  # 5400


def color_swap_svg(text: str, fill_hex: str) -> str:
    """Swap the root fill attribute of an SVG to fill_hex."""
    # All iFC source SVGs follow the pattern fill="#000000" on the <svg> tag,
    # with rects inheriting via the root. A targeted attribute replace is
    # simpler and faster than an XML round-trip.
    if 'fill="#000000"' in text:
        return text.replace('fill="#000000"', f'fill="{fill_hex}"', 1)
    if 'fill="#FFFFFF"' in text:
        return text.replace('fill="#FFFFFF"', f'fill="{fill_hex}"', 1)
    # Fallback: insert a fill attr on the <svg> tag if there's no root fill.
    return text.replace("<svg ", f'<svg fill="{fill_hex}" ', 1)


def render_svg_to_png_bytes(svg_text: str, size_px: int) -> bytes:
    """rsvg-convert the SVG to a square PNG of size_px x size_px."""
    proc = subprocess.run(
        [
            "/opt/homebrew/bin/rsvg-convert",
            "-w",
            str(size_px),
            "-h",
            str(size_px),
            "--keep-aspect-ratio",
            "-b",
            "transparent",
        ],
        input=svg_text.encode("utf-8"),
        capture_output=True,
        check=True,
    )
    return proc.stdout


def bbox_fit_to_inner(im: Image.Image, canvas_size: int, inner_size: int) -> Image.Image:
    """
    Drop alpha bbox, scale to fit inner_size, center on a transparent
    canvas of canvas_size x canvas_size.
    """
    # Alpha bbox: smallest rectangle containing non-transparent pixels.
    bbox = im.split()[-1].getbbox()
    if bbox is None:
        return Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    cropped = im.crop(bbox)
    cw, ch = cropped.size
    scale = min(inner_size / cw, inner_size / ch)
    new_w = max(1, round(cw * scale))
    new_h = max(1, round(ch * scale))
    # NEAREST keeps the pixel-art crispness intentional in iFC's brand.
    resized = cropped.resize((new_w, new_h), Image.Resampling.NEAREST)
    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    canvas.paste(resized, ((canvas_size - new_w) // 2, (canvas_size - new_h) // 2), resized)
    return canvas


def write_vector_master(svg_text: str, slug: str, fill: str, out_path: Path) -> None:
    """
    Wrap the source SVG inside a 45-unit canvas so the printed inset is
    encoded in the vector output, not just the raster.
    """
    # Parse just to read the source viewBox.
    ET.register_namespace("", "http://www.w3.org/2000/svg")
    root = ET.fromstring(color_swap_svg(svg_text, fill))
    vb = root.attrib.get("viewBox", "0 0 28 28").split()
    src_w, src_h = float(vb[2]), float(vb[3])
    # Fit into a 41-unit inner box, center on a 45-unit canvas.
    scale = min(INNER / src_w, INNER / src_h)
    inner_w = src_w * scale
    inner_h = src_h * scale
    tx = (GRID - inner_w) / 2
    ty = (GRID - inner_h) / 2
    inner_xml = ET.tostring(root, encoding="unicode")
    out_xml = (
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'viewBox="0 0 {GRID} {GRID}" width="{GRID}" height="{GRID}" '
        f'shape-rendering="crispEdges">'
        f'<g transform="translate({tx} {ty}) scale({scale})">'
        f"{inner_xml}"
        f"</g></svg>"
    )
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(out_xml, encoding="utf-8")


def write_raster_master(svg_text: str, fill: str, canvas_size: int, out_path: Path) -> None:
    """Render an SVG, bbox-fit it into the print grid, save with DPI metadata."""
    swapped = color_swap_svg(svg_text, fill)
    inner_size = round(canvas_size * (INNER / GRID))  # 41/45 of the canvas
    # Render at the internal high resolution so the downsample is clean.
    src_px = render_svg_to_png_bytes(swapped, INTERNAL_CANVAS)
    from io import BytesIO

    im = Image.open(BytesIO(src_px)).convert("RGBA")
    fit = bbox_fit_to_inner(im, INTERNAL_CANVAS, round(INTERNAL_CANVAS * (INNER / GRID)))
    # Down/upsample to the final canvas size with NEAREST to preserve pixels.
    final = fit.resize((canvas_size, canvas_size), Image.Resampling.NEAREST)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    # PNG `pHYs` chunk stores DPI; Pillow expects (dpi_x, dpi_y) ints.
    final.save(out_path, format="PNG", optimize=True, dpi=(PRINT_DPI, PRINT_DPI))


def main() -> None:
    if OUT_ROOT.exists():
        shutil.rmtree(OUT_ROOT)
    OUT_ROOT.mkdir(parents=True, exist_ok=True)

    sources = sorted(p for p in SRC_DIR.glob("*.svg") if p.is_file())
    if not sources:
        sys.exit(f"No source SVGs found in {SRC_DIR}")

    manifest = {
        "grid_units": GRID,
        "padding_units": PAD,
        "inner_units": INNER,
        "dpi": PRINT_DPI,
        "raster_sizes_px": list(RASTER_SIZES.keys()),
        "vector_master": "master.svg",
        "logos": {},
    }

    for src in sources:
        slug = src.stem
        svg_text = src.read_text(encoding="utf-8")

        # Vector masters
        for color_name, hexcode in (("black", "#000000"), ("white", "#FFFFFF")):
            write_vector_master(
                svg_text,
                slug,
                hexcode,
                OUT_ROOT / "master.svg" / color_name / f"{slug}.svg",
            )

        # Raster masters per size + color
        for size_label in RASTER_SIZES:
            size_px = int(size_label)
            for color_name, hexcode in (("black", "#000000"), ("white", "#FFFFFF")):
                write_raster_master(
                    svg_text,
                    hexcode,
                    size_px,
                    OUT_ROOT / size_label / color_name / f"{slug}.png",
                )

        manifest["logos"][slug] = {
            "source_svg": str(src.relative_to(SRC_DIR.parent)),
            "vector_masters": [
                f"logos/print/master.svg/black/{slug}.svg",
                f"logos/print/master.svg/white/{slug}.svg",
            ],
            "raster_masters": [
                f"logos/print/{size}/{color}/{slug}.png"
                for size in RASTER_SIZES
                for color in ("black", "white")
            ],
        }
        print(f"  ✓ {slug}")

    (OUT_ROOT / "manifest.json").write_text(
        json.dumps(manifest, indent=2), encoding="utf-8"
    )
    print(f"\nGenerated {len(sources)} logos in {OUT_ROOT.relative_to(REPO)}")
    print(f"  vector masters: master.svg/{{black,white}}/<slug>.svg")
    for size in RASTER_SIZES:
        inches = int(size) / PRINT_DPI
        print(f"  raster {size}x{size} px ({inches:.1f}\" x {inches:.1f}\" @ {PRINT_DPI} dpi)")


if __name__ == "__main__":
    main()
