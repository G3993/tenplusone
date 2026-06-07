#!/usr/bin/env python3
"""
iFC motif animations — render each crest mask filled with the pixel-logo
generator's animated "motifs" and export looping GIFs.

Faithful port of the generator engine (every motif is axis-aligned rects, so
PIL reproduces it exactly). Each pixel of the crest carries a color + an inner
motif symbol; the animation toggles each pixel between its motif and its
ALTERNATE motif, staggered per pixel so the fill shimmers.

Source mask: scripts/team_pixels.json (32x32, 1-based pids).
Output: <vault>/iFC Logo System/Final Logos/Motifs/<Mode>/<slug>.gif
"""
from __future__ import annotations
import json
from pathlib import Path
from PIL import Image, ImageDraw

REPO = Path(__file__).resolve().parents[1]
SRC = REPO / "scripts" / "team_pixels.json"
OUT = Path("/Users/lu/Documents/Gonzalo Gelso/tenplusone/iFC Logo System/Final Logos/Motifs")

GRID = 32
CELL = 34                 # render at 34px cells -> 1088px (clean integer cells)
SIZE = GRID * CELL
OUT_SIZE = 1080           # final HD export, nearest-neighbor so pixels stay crisp
FRAMES = 8
DURATION = 110            # ms/frame

KEY_TO_SLUG = {
    "bosnia": "bosnia-herzegovina", "cabo_verde": "cabo-verde", "dr_congo": "dr-congo",
    "ivory_coast": "cote-d-ivoire", "new_zealand": "new-zealand", "saudi_arabia": "saudi-arabia",
    "south_africa": "south-africa", "south_korea": "south-korea", "turkey": "turkiye", "usa": "united-states",
}

PATTERN_COLORS = ["#e10600", "#23599a", "#11864a", "#f5bd19", "#050505"]
SPECTRUM_COLORS = ["#ff003c", "#ff7a00", "#ffe600", "#00d084", "#00e5ff", "#0057ff", "#050505"]
COLLAGE = ["#050505", "#f4edcf", "#1f9a78", "#ffd400", "#ef5734", "#2c6cb0", "#9fd3dc", "#ff8a00"]
YELLOWS = {"#f5bd19", "#ffcd00", "#ffce00", "#f1bf00", "#ffe600"}

STATS = {"passes": 486, "possession": 58, "goals": 2, "shots": 6, "corners": 5, "cards": 2, "offsides": 3, "fouls": 11}
STAT_MOTIF = {"passes": "pass", "possession": "possession", "goals": "goal", "shots": "shot",
              "corners": "corner", "cards": "card", "offsides": "offside", "fouls": "foul"}
STAT_TONE = {"passes": 1, "possession": 2, "goals": 3, "shots": 0, "corners": 3, "cards": 3, "offsides": 5, "fouls": 4}
INTERNET = ["cursor", "link", "hash", "at", "wifi", "code", "play", "upload", "node"]

# Folder name -> fill mode (only the modes whose motif actually animates).
MODES = {"Spectrum": "spectrum", "OpArt": "opArt", "Symbols": "symbols",
         "Checks": "checks", "Match": "match", "Collage": "checkerCollage"}


def hexrgb(h):
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def pattern_seed(index, seed):
    x, y = index % GRID, index // GRID
    a = (x * 73856093) & 0xFFFFFFFF
    b = (y * 19349663) & 0xFFFFFFFF
    c = (seed * 83492791) & 0xFFFFFFFF
    v = (a ^ b ^ c) & 0xFFFFFFFF
    if v >= 0x80000000:
        v -= 0x100000000
    return abs(v)


def team_seed(team_id):
    return sum(ord(ch) for ch in team_id)


def match_stat_for_pixel(index, seed):
    weights = [
        ("passes", max(1, round(STATS["passes"] / 28))),
        ("possession", max(1, round(STATS["possession"] / 8))),
        ("goals", max(0, STATS["goals"] * 8)),
        ("shots", max(1, STATS["shots"] * 3)),
        ("corners", max(1, STATS["corners"] * 2)),
        ("cards", max(0, STATS["cards"] * 4)),
        ("offsides", max(0, STATS["offsides"] * 3)),
        ("fouls", max(1, STATS["fouls"] * 2)),
    ]
    total = sum(w for _, w in weights)
    cursor = pattern_seed(index, seed) % max(1, total)
    for key, w in weights:
        cursor -= w
        if cursor < 0:
            return key
    return "passes"


def color_for_pixel(index, seed, mode):
    if mode == "spectrum":
        return SPECTRUM_COLORS[(index + seed) % len(SPECTRUM_COLORS)]
    if mode == "opArt":
        return "#050505"
    if mode == "checkerCollage":
        return COLLAGE[pattern_seed(index, seed) % len(COLLAGE)]
    if mode == "match":
        return PATTERN_COLORS[STAT_TONE[match_stat_for_pixel(index, seed)] % len(PATTERN_COLORS)]
    if mode == "spectrum":
        return SPECTRUM_COLORS[(index + seed) % len(SPECTRUM_COLORS)]
    # symbols, checks
    return PATTERN_COLORS[pattern_seed(index, seed) % len(PATTERN_COLORS)]


def motif_for_pixel(index, seed, mode):
    s = pattern_seed(index, seed)
    if mode == "spectrum":
        return "slash" if s % 4 == 0 else "plain"
    if mode == "opArt":
        return "ring" if s % 2 == 0 else "slash"
    if mode == "checkerCollage":
        return "plain" if s % 3 == 0 else "checker"
    if mode == "match":
        return STAT_MOTIF[match_stat_for_pixel(index, seed)]
    if mode == "checks":
        return "checker" if s % 2 == 0 else "plain"
    if mode == "symbols":
        return ["plus", "ring", "slash", "spark"][s % 4]
    return "plain"


def alternate_motif(index, seed, mode):
    cur = motif_for_pixel(index, seed, mode)
    if mode == "spectrum":
        return "slash" if cur == "plain" else "plain"
    if mode == "opArt":
        return "slash" if cur == "ring" else "ring"
    if mode == "checkerCollage":
        return "plain" if cur == "checker" else "checker"
    if mode == "match":
        mm = list(STAT_MOTIF.values())
        return mm[(mm.index(cur) + 3) % len(mm)]
    if mode == "checks":
        return "ring" if cur == "checker" else "checker"
    if mode == "symbols":
        sm = ["plus", "ring", "slash", "spark"]
        return sm[(sm.index(cur) + 1) % len(sm)]
    return cur


def draw_motif(d, x, y, s, motif, color):
    """Draw the inner motif symbol, clipped to the cell. Mirrors the generator's
    fillRect primitives. `ink` contrasts the cell color."""
    if motif == "plain":
        return
    ink = "#050505" if color in YELLOWS else "#00e5ff"

    def r(px, py, pw, ph, fill=ink):
        x0 = max(x, x + px); y0 = max(y, y + py)
        x1 = min(x + s, x + px + pw); y1 = min(y + s, y + py + ph)
        if x1 > x0 and y1 > y0:
            d.rectangle([x0, y0, x1 - 1, y1 - 1], fill=fill)

    if motif == "checker":
        h = s / 2
        r(0, 0, h, h); r(h, h, h, h)
    elif motif == "plus":
        bar = max(1, s * 0.18)
        r(s * 0.42, s * 0.18, bar, s * 0.64); r(s * 0.18, s * 0.42, s * 0.64, bar)
    elif motif == "ring":
        inset = max(1, s * 0.18); st = max(1, s * 0.14)
        r(inset, inset, s - inset * 2, st); r(inset, s - inset - st, s - inset * 2, st)
        r(inset, inset, st, s - inset * 2); r(s - inset - st, inset, st, s - inset * 2)
    elif motif == "slash":
        step = max(1, s / 6); off = -s
        while off < s * 2:
            r(off, 0, step, s); off += step * 2
    elif motif == "spark":
        dot = max(1, s * 0.16)
        r(s * 0.42, s * 0.12, dot, s * 0.76); r(s * 0.12, s * 0.42, s * 0.76, dot)
        r(s * 0.24, s * 0.24, dot, dot); r(s * 0.62, s * 0.62, dot, dot)
    elif motif == "pass":
        bar = max(1, s * 0.16)
        r(s * 0.18, s * 0.42, s * 0.48, bar); r(s * 0.58, s * 0.28, bar, bar)
        r(s * 0.68, s * 0.42, bar, bar); r(s * 0.58, s * 0.56, bar, bar)
    elif motif == "possession":
        inset = s * 0.22
        r(inset, inset, s - inset * 2, s - inset * 2)
        r(s * 0.38, s * 0.38, s * 0.24, s * 0.24, fill=color)
    elif motif == "goal":
        arm = max(1, s * 0.16)
        r(s * 0.42, s * 0.12, arm, s * 0.76); r(s * 0.12, s * 0.42, s * 0.76, arm)
        r(s * 0.24, s * 0.24, arm, arm); r(s * 0.6, s * 0.24, arm, arm)
        r(s * 0.24, s * 0.6, arm, arm); r(s * 0.6, s * 0.6, arm, arm)
    elif motif == "shot":
        inset = s * 0.16; st = max(1, s * 0.12)
        r(inset, inset, s - inset * 2, st); r(inset, s - inset - st, s - inset * 2, st)
        r(inset, inset, st, s - inset * 2); r(s - inset - st, inset, st, s - inset * 2)
        r(s * 0.42, s * 0.42, s * 0.16, s * 0.16)
    elif motif == "corner":
        st = max(1, s * 0.16)
        r(s * 0.2, s * 0.18, st, s * 0.64); r(s * 0.2, s * 0.18, s * 0.46, st); r(s * 0.2, s * 0.46, s * 0.36, st)
    elif motif == "card":
        r(s * 0.3, s * 0.16, s * 0.4, s * 0.68)
    elif motif == "offside":
        st = max(1, s * 0.14)
        r(s * 0.16, s * 0.34, s * 0.68, st); r(s * 0.16, s * 0.56, s * 0.68, st)
    elif motif == "foul":
        st = max(1, s * 0.14)
        r(s * 0.22, s * 0.22, s * 0.56, st); r(s * 0.22, s * 0.62, s * 0.56, st)
        r(s * 0.22, s * 0.22, st, s * 0.56); r(s * 0.66, s * 0.22, st, s * 0.56)


def render_frame(on_cells, seed, mode, frame):
    img = Image.new("RGB", (SIZE, SIZE), "#ffffff")
    d = ImageDraw.Draw(img)
    for index in on_cells:
        x = (index % GRID) * CELL
        y = (index // GRID) * CELL
        color = color_for_pixel(index, seed, mode)
        d.rectangle([x, y, x + CELL - 1, y + CELL - 1], fill=color)
        phase = pattern_seed(index, seed) % FRAMES
        use_alt = ((frame + phase) % FRAMES) >= FRAMES // 2
        motif = alternate_motif(index, seed, mode) if use_alt else motif_for_pixel(index, seed, mode)
        draw_motif(d, x, y, CELL, motif, color)
    return img


def main():
    teams = json.loads(SRC.read_text())
    n = 0
    for key, data in teams.items():
        slug = KEY_TO_SLUG.get(key, key)
        seed = team_seed(slug)
        on_cells = [p - 1 for p in data["pixels"]]
        for folder, mode in MODES.items():
            frames = [
                render_frame(on_cells, seed, mode, f).resize((OUT_SIZE, OUT_SIZE), Image.NEAREST)
                for f in range(FRAMES)
            ]
            out = OUT / folder / f"{slug}.gif"
            out.parent.mkdir(parents=True, exist_ok=True)
            frames[0].save(out, save_all=True, append_images=frames[1:],
                           duration=DURATION, loop=0, disposal=2, optimize=True)
        n += 1
        print(f"  {slug:20s} {' '.join(MODES.keys())}")
    print(f"\n{n} teams x {len(MODES)} motifs -> {OUT}")


if __name__ == "__main__":
    main()
