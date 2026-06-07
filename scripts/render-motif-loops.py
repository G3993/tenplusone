#!/usr/bin/env python3
"""Render a 6-second looping MP4 of every team's motif animation, for each
motif mode, into one folder ready to post. Reuses the renderer in
build-motif-animations.py (PIL) and loops the 8-frame cycle to 6s via ffmpeg.

Output: /Users/lu/Desktop/iFC-Motif-Loops/<Mode>/<slug>.mp4
"""
import importlib.util, json, subprocess, tempfile, os, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("motif", HERE / "build-motif-animations.py")
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)

OUT = Path("/Users/lu/Desktop/iFC-Motif-Loops")
LOG = Path("/tmp/motif-loops.progress")
SECONDS = 6
FPS_IN = 1000.0 / m.DURATION  # 8-frame cycle cadence (matches the GIF timing)

def log(s):
    with open(LOG, "a") as f: f.write(s + "\n")

def render_one(slug, seed, on_cells, mode, dest):
    with tempfile.TemporaryDirectory() as td:
        for fr in range(m.FRAMES):
            img = m.render_frame(on_cells, seed, mode, fr).resize((m.OUT_SIZE, m.OUT_SIZE), m.Image.NEAREST)
            img.save(os.path.join(td, f"f{fr:02d}.png"))
        base = os.path.join(td, "base.mp4")
        subprocess.run(["ffmpeg","-y","-loglevel","error","-framerate",f"{FPS_IN:.4f}",
            "-i",os.path.join(td,"f%02d.png"),"-c:v","libx264","-pix_fmt","yuv420p",
            "-vf","scale=1080:1080:flags=neighbor","-r","30",base],check=True)
        dest.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(["ffmpeg","-y","-loglevel","error","-stream_loop","-1","-i",base,
            "-t",str(SECONDS),"-c","copy",str(dest)],check=True)

def main():
    LOG.write_text("rendering motif loops...\n")
    teams = json.loads(m.SRC.read_text())
    total = len(teams) * len(m.MODES); done = 0
    for key, data in teams.items():
        slug = m.KEY_TO_SLUG.get(key, key)
        seed = m.team_seed(slug)
        on_cells = [p - 1 for p in data["pixels"]]
        for folder, mode in m.MODES.items():
            dest = OUT / folder / f"{slug}.mp4"
            try:
                render_one(slug, seed, on_cells, mode, dest)
            except Exception as e:
                log(f"FAIL {slug} {folder}: {e}")
            done += 1
        log(f"  {slug:20s} ({done}/{total})")
    log(f"\nDONE {done} videos -> {OUT}")

if __name__ == "__main__":
    main()
