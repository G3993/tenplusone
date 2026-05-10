#!/usr/bin/env python3
"""
Import 32x32 pixel-art logos from a folder of country-named PNGs and emit:
  - frontend/src/data/team-logos/{slug}.ts          flat indices into 32x32 grid
  - frontend/public/logos/{slug}.svg                cropped black logo, 1px rects
  - frontend/public/logos/white/{slug}.svg          cropped white logo
  - frontend/public/print/{slug}.png                4500x5400 padded silhouette

Usage: /usr/bin/python3 scripts/import-pdf-logos.py /path/to/named-pngs

Each input PNG should already be a clean 32x32 pixel-art logo rendered at any
DPI (the script downsamples to 32x32 and thresholds). Filename (minus extension)
becomes the slug; e.g. mexico.png -> MEXICO_PIXELS, mexico.svg, mexico.png.
"""
import os, sys, json
from pathlib import Path
from PIL import Image

GRID = 32
PRINT_W = 4500
PRINT_H = 5400
PRINT_PAD = 0.10
THRESHOLD = 128          # gray <= 128 is logo
LOGO_FRAC_LIMIT = 0.92   # reject as "all-black blob" if more pixels than this

ROOT = Path(__file__).resolve().parents[1]
PIXELS_DIR = ROOT / "frontend/src/data/team-logos"
LOGO_DIR   = ROOT / "frontend/public/logos"
LOGO_W_DIR = LOGO_DIR / "white"
PRINT_DIR  = ROOT / "frontend/public/print"

def slug_to_const(slug: str) -> str:
    return slug.upper().replace("-", "_") + "_PIXELS"

def png_to_grid(path: Path) -> list[list[int]]:
    """Resize to 32x32, grayscale, threshold to binary grid (1 = logo, 0 = bg)."""
    im = Image.open(path).convert("L")
    # crop to non-white bbox first so resize captures the logo, not whitespace
    w, h = im.size
    px = im.load()
    inv = im.point(lambda v: 255 - v)
    bbox = inv.point(lambda v: 255 if v > 15 else 0).getbbox()
    if bbox:
        im = im.crop(bbox)
    # square-pad so aspect ratio survives the resize
    sq = max(im.size)
    canvas = Image.new("L", (sq, sq), 255)
    canvas.paste(im, ((sq - im.size[0]) // 2, (sq - im.size[1]) // 2))
    canvas = canvas.resize((GRID, GRID), Image.LANCZOS)
    grid = [[1 if canvas.getpixel((x, y)) <= THRESHOLD else 0
             for x in range(GRID)] for y in range(GRID)]
    return grid

def grid_to_pixels(grid) -> list[int]:
    out = []
    for y in range(GRID):
        for x in range(GRID):
            if grid[y][x]:
                out.append(y * GRID + x)
    return out

def write_pixels_ts(slug: str, pixels: list[int]):
    name = slug_to_const(slug)
    flat = ",".join(str(p) for p in pixels)
    body = f"export const {name}: number[] = [{flat}];\n"
    (PIXELS_DIR / f"{slug}.ts").write_text(body, encoding="utf-8")

def grid_bbox(grid):
    min_x, min_y, max_x, max_y = GRID, GRID, -1, -1
    for y in range(GRID):
        for x in range(GRID):
            if grid[y][x]:
                if x < min_x: min_x = x
                if y < min_y: min_y = y
                if x > max_x: max_x = x
                if y > max_y: max_y = y
    if max_x < 0:
        return 0, 0, 1, 1
    return min_x, min_y, max_x - min_x + 1, max_y - min_y + 1

def write_svg(slug: str, grid, out_dir: Path, fill: str):
    out_dir.mkdir(parents=True, exist_ok=True)
    bx, by, bw, bh = grid_bbox(grid)
    rects = []
    for y in range(GRID):
        for x in range(GRID):
            if grid[y][x]:
                rects.append(f'<rect x="{x - bx}" y="{y - by}" width="1" height="1"/>')
    body = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {bw} {bh}" '
        f'shape-rendering="crispEdges" fill="{fill}">'
        + "".join(rects)
        + "</svg>"
    )
    (out_dir / f"{slug}.svg").write_text(body, encoding="utf-8")

def write_print_png(slug: str, grid):
    """Generate 4500x5400 silhouette PNG with PRINT_PAD margin, transparent bg."""
    PRINT_DIR.mkdir(parents=True, exist_ok=True)
    bx, by, bw, bh = grid_bbox(grid)
    # available area inside padding
    pad_w = int(PRINT_W * PRINT_PAD)
    pad_h = int(PRINT_H * PRINT_PAD)
    avail_w = PRINT_W - 2 * pad_w
    avail_h = PRINT_H - 2 * pad_h
    cell = min(avail_w // bw, avail_h // bh)
    art_w = bw * cell
    art_h = bh * cell
    off_x = (PRINT_W - art_w) // 2
    off_y = (PRINT_H - art_h) // 2
    img = Image.new("RGBA", (PRINT_W, PRINT_H), (0, 0, 0, 0))
    px = img.load()
    for y in range(GRID):
        for x in range(GRID):
            if not grid[y][x]:
                continue
            rx = off_x + (x - bx) * cell
            ry = off_y + (y - by) * cell
            for dy in range(cell):
                for dx in range(cell):
                    px[rx + dx, ry + dy] = (0, 0, 0, 255)
    img.save(PRINT_DIR / f"{slug}.png", optimize=True)

def main():
    if len(sys.argv) != 2:
        print("usage: import-pdf-logos.py <named-pngs-dir>"); sys.exit(2)
    src_dir = Path(sys.argv[1])
    pngs = sorted(src_dir.glob("*.png"))
    if not pngs:
        print(f"no PNGs in {src_dir}"); sys.exit(2)
    print(f"importing {len(pngs)} logos from {src_dir}")
    summary = []
    for png in pngs:
        slug = png.stem
        grid = png_to_grid(png)
        pixels = grid_to_pixels(grid)
        density = len(pixels) / (GRID * GRID)
        flag = " (PLACEHOLDER blob)" if density >= LOGO_FRAC_LIMIT else ""
        write_pixels_ts(slug, pixels)
        write_svg(slug, grid, LOGO_DIR, "#000000")
        write_svg(slug, grid, LOGO_W_DIR, "#ffffff")
        write_print_png(slug, grid)
        print(f"  {slug:<25}  {len(pixels):>4} px  ({density:5.1%}){flag}")
        summary.append({"slug": slug, "pixels": len(pixels), "density": density})
    print(f"done. wrote {len(pngs)*4} files.")

if __name__ == "__main__":
    main()
