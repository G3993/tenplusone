import { useEffect, useRef } from 'react';
import { useThemeStore } from '../../stores/theme';
import { teamSeed } from '../logos/spectrumMotif';
import { setMotif, setMotifDark, setMotifShape, setMotifSeed, renderMotif } from '../logos/motifEngine';

interface Props {
  /** 0-based lit module indices on a 32×32 grid (home = fires right). */
  homePixels: number[];
  awayPixels: number[];
  /** Team slugs — drive the genuine team3d treatment (colours + seed). */
  homeSlug: string;
  awaySlug: string;
  /** Fallback tint for the clash burst (0–255 RGB triples). */
  homeColors: [number, number, number][];
  awayColors: [number, number, number][];
  height?: number;
  className?: string;
}

const GRID = 32;
const pseed = (idx: number, seed: number) => {
  const x = idx % GRID, y = Math.floor(idx / GRID);
  return Math.abs((x * 73856093) ^ (y * 19349663) ^ (seed * 83492791));
};

type RGB = [number, number, number];
// Keep team colours legible on the dark field; lift near-black to light grey.
const visible = (c: RGB): RGB => (Math.max(c[0], c[1], c[2]) < 70 ? [210, 210, 210] : c);
const burstTint = (cols: RGB[]): RGB => visible((cols && cols.length ? cols[0] : [210, 210, 210]) as RGB);

interface Cell { dx: number; dy: number; sc: number; sr: number }
interface Box { x: number; y: number; cell: number }
interface Proj {
  x: number; y: number; cell: number; cells: Cell[]; dir: number; homeX: number; homeY: number;
  delay: number; vx: number; amp: number; phase: number; fired: boolean; hit: boolean; life: number;
  burst: number; hx?: number; hy?: number;
}

/**
 * "Pixel Clash" — both team crests render with the genuine **team3d** treatment
 * (the same extruded-neon motif used on the match page), painted to an offscreen
 * canvas and drawn whole. Chunky "Tetris" groups then detach (punching holes in
 * the crest), fire across the gap and clash midair, then respawn. Gated to
 * animate only while on screen, and stepped at a fraction of the frame rate so
 * the clash stays calm.
 */
export function PixelClash({ homePixels, awayPixels, homeSlug, awaySlug, homeColors, awayColors, height = 300, className }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    const wrap = wrapRef.current;
    const cv = cvRef.current;
    if (!wrap || !cv) return;
    const ctx = cv.getContext('2d')!;
    const wrapEl: HTMLDivElement = wrap;
    const cvEl: HTMLCanvasElement = cv;
    const dark = theme === 'dark';

    // Offscreen crest canvases — the engine renders the full team3d crest into
    // these; we blit from them (whole crest + per-cell flying chunks).
    const offA = document.createElement('canvas');
    const offB = document.createElement('canvas');
    const epA = homePixels.map((v) => v + 1); // engine grid is 1-based
    const epB = awayPixels.map((v) => v + 1);
    const seedA = teamSeed(homeSlug);
    const seedB = teamSeed(awaySlug);
    const tintA = burstTint(homeColors);
    const tintB = burstTint(awayColors);

    let W = 0, H = height, dpr = 1, offDpr = 1, t = 0;
    let staticA: Box[] = [], staticB: Box[] = [], proj: Proj[] = [];
    let cellSize = 8, span = 0, gap = 0, top = 0;
    let raf = 0, running = false;
    let acc = 0, lastRender = -999;
    const SPEED = 0.5; // sim advances at half the rAF rate — a slower, calmer clash

    function buildSide(pixels: number[], originX: number, originY: number, cell: number, dir: number, seedBase: number) {
      const stat: Box[] = [], pr: Proj[] = [];
      const pset = new Set(pixels);
      const claimed = new Set<number>();
      const shuffled = pixels.slice().sort((a, b) => pseed(a, seedBase + 71) - pseed(b, seedBase + 71));
      const seeds = shuffled.slice(0, 11);
      const seedSet = new Set(seeds);
      seeds.forEach((idx) => {
        if (claimed.has(idx)) return;
        const col = idx % GRID, row = Math.floor(idx / GRID);
        const groupSize = 4 + (pseed(idx, seedBase + 13) % 4);
        const members = [idx]; claimed.add(idx);
        const frontier = [idx];
        while (members.length < groupSize && frontier.length) {
          const cur = frontier.shift() as number;
          const cc = cur % GRID, cr = Math.floor(cur / GRID);
          for (const nb of [cur + 1, cur - 1, cur + GRID, cur - GRID]) {
            if (members.length >= groupSize) break;
            const nc = nb % GRID, nr = Math.floor(nb / GRID);
            if (Math.abs(nc - cc) + Math.abs(nr - cr) !== 1) continue;
            if (nb < 0 || nb >= GRID * GRID) continue;
            if (!pset.has(nb) || claimed.has(nb) || seedSet.has(nb)) continue;
            members.push(nb); claimed.add(nb); frontier.push(nb);
          }
        }
        const gx = originX + col * cell, gy = originY + row * cell;
        const cells: Cell[] = members.map((mi) => {
          const mc = mi % GRID, mr = Math.floor(mi / GRID);
          return { dx: (mc - col) * cell, dy: (mr - row) * cell, sc: mc, sr: mr };
        });
        pr.push({
          x: gx, y: gy, cell, cells, dir, homeX: gx, homeY: gy,
          delay: pseed(idx, seedBase + 3) % 180,
          vx: dir * (1.8 + (pseed(idx, seedBase + 5) % 4) * 0.5),
          amp: (pseed(idx, seedBase + 9) % 6) * 0.5,
          phase: (pseed(idx, seedBase + 11) % 100) / 100 * Math.PI * 2,
          fired: false, hit: false, life: 0, burst: 0,
        });
      });
      pixels.forEach((idx) => {
        if (claimed.has(idx)) return;
        const col = idx % GRID, row = Math.floor(idx / GRID);
        stat.push({ x: originX + col * cell, y: originY + row * cell, cell });
      });
      return { stat, pr };
    }

    // Paint the full team3d crest into an offscreen canvas. The engine sizes the
    // canvas to GRID*cell (× its own dpr); we sample from it below.
    function renderCrest(off: HTMLCanvasElement, ep: number[], slug: string, seed: number, time: number) {
      setMotif('team3d');
      setMotifDark(dark);
      setMotifShape('square');
      setMotifSeed(seed);
      renderMotif(off, ep, {
        cell: cellSize, off: 'rgba(0,0,0,0)', bg: 'rgba(0,0,0,0)',
        applyFill: true, teamId: slug, time, animate: true,
      });
    }
    function renderBoth(time: number) {
      renderCrest(offA, epA, homeSlug, seedA, time);
      renderCrest(offB, epB, awaySlug, seedB, time);
    }

    const css = (c: RGB) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
    // Draw the whole crest texture at its square.
    const drawCrest = (off: HTMLCanvasElement, ox: number) => {
      if (off.width) ctx.drawImage(off, ox, top, span, span);
    };
    // Blit one source cell (in offscreen grid coords) to a destination position.
    const blitCell = (off: HTMLCanvasElement, sc: number, sr: number, dx: number, dy: number, cell: number) => {
      const s = cellSize * offDpr;
      ctx.drawImage(off, sc * s, sr * s, s, s, dx, dy, cell, cell);
    };
    const hitsBox = (px: number, py: number, boxes: Box[]) => {
      for (const b of boxes) if (px >= b.x && px <= b.x + b.cell && py >= b.y && py <= b.y + b.cell) return b;
      return null;
    };
    const isAway = (p: Proj) =>
      p.fired && (p.hit || Math.abs(p.x - p.homeX) > 0.5 || Math.abs(p.y - p.homeY) > 0.5);

    function setup() {
      const cell = cellSize;
      span = GRID * cell;
      gap = span * 0.2; // slim clash lane between the two crest squares
      top = (H - span) / 2;
      const a = buildSide(homePixels, 0, top, cell, +1, 101);
      const b = buildSide(awayPixels, span + gap, top, cell, -1, 202);
      staticA = a.stat; staticB = b.stat; proj = a.pr.concat(b.pr); t = 0;
      renderBoth(0); lastRender = 0;
    }

    // One still frame (both full crests) before the clash scrolls into view.
    function paintStatic() {
      ctx.clearRect(0, 0, W, H);
      drawCrest(offA, 0);
      drawCrest(offB, span + gap);
    }

    function step() {
      if (!running) return;
      // Keep the rAF cadence smooth, but advance the simulation at a fraction of
      // it (SPEED) so the whole clash plays slower / calmer.
      raf = requestAnimationFrame(step);
      acc += SPEED;
      if (acc < 1) return;
      acc -= 1;

      // Re-render the team3d crests occasionally for the slow colour cycle.
      if (t - lastRender >= 3) { renderBoth(t / 30); lastRender = t; }

      ctx.clearRect(0, 0, W, H);
      drawCrest(offA, 0);
      drawCrest(offB, span + gap);
      t++;

      // clash detection — opposing live projectiles that touch burst together
      const live = proj.filter((p) => p.fired && !p.hit);
      for (let i = 0; i < live.length; i++) {
        const a = live[i];
        for (let j = i + 1; j < live.length; j++) {
          const b = live[j];
          if (a.dir === b.dir || a.hit || b.hit) continue;
          let touch = false;
          for (const ca of a.cells) {
            const ax = a.x + ca.dx, ay = a.y + ca.dy;
            for (const cb of b.cells) {
              if (Math.abs(ax - (b.x + cb.dx)) < a.cell && Math.abs(ay - (b.y + cb.dy)) < b.cell) { touch = true; break; }
            }
            if (touch) break;
          }
          if (touch) {
            const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
            a.hit = true; a.burst = 16; a.hx = mx; a.hy = my;
            b.hit = true; b.burst = 16; b.hx = mx; b.hy = my;
          }
        }
      }

      // physics — move, fire, register hits, respawn
      for (const pr of proj) {
        if (!pr.fired && t > pr.delay) pr.fired = true;
        if (pr.fired && !pr.hit) {
          pr.x += pr.vx; pr.life++;
          pr.y = pr.homeY + Math.sin(pr.life * 0.05 + pr.phase) * pr.amp * 6;
          const targets = pr.dir > 0 ? staticB : staticA;
          let box: Box | null = null, lx = pr.x, ly = pr.y;
          for (const c of pr.cells) {
            const px = pr.x + c.dx + pr.cell / 2, py = pr.y + c.dy + pr.cell / 2;
            const b = hitsBox(px, py, targets);
            if (b) { box = b; lx = px; ly = py; break; }
          }
          const off = pr.x < -pr.cell * 3 || pr.x > W + pr.cell * 3;
          if (box) { pr.hit = true; pr.burst = 16; pr.hx = box.x + box.cell / 2; pr.hy = box.y + box.cell / 2; }
          else if (off) { pr.hit = true; pr.burst = 2; pr.hx = lx; pr.hy = ly; }
        } else if (pr.hit) {
          pr.burst--;
          if (pr.burst <= 0) {
            pr.x = pr.homeX; pr.y = pr.homeY; pr.hit = false; pr.fired = false; pr.life = 0;
            pr.delay = t + 30 + (Math.abs((pr.homeX * 7 + pr.homeY * 13) | 0) % 140);
          }
        }
      }

      // pass 1 — punch holes where projectiles have left their home cells
      for (const pr of proj) {
        if (!isAway(pr)) continue;
        for (const c of pr.cells) ctx.clearRect(pr.homeX + c.dx, pr.homeY + c.dy, pr.cell, pr.cell);
      }
      // pass 2 — draw flying chunks (real team3d texture) and clash bursts
      for (const pr of proj) {
        if (pr.hit) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, pr.burst / 24);
          ctx.fillStyle = css(pr.dir > 0 ? tintA : tintB);
          const s = pr.cell * (1 + (16 - pr.burst) * 0.12);
          ctx.beginPath(); ctx.arc(pr.hx ?? pr.x, pr.hy ?? pr.y, s * 0.6, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        } else if (isAway(pr)) {
          const off = pr.dir > 0 ? offA : offB;
          for (const c of pr.cells) blitCell(off, c.sc, c.sr, pr.x + c.dx, pr.y + c.dy, pr.cell);
        }
      }
    }

    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      offDpr = Math.min(window.devicePixelRatio || 1, 3); // matches the engine's dpr
      const avail = wrapEl.clientWidth;
      // Size each 32×32 square by the height prop, capped so the two squares
      // side-by-side fit the available width (2 squares + a 0.2-span gap).
      cellSize = Math.min((height * 0.92) / GRID, (avail * 0.98) / (2.2 * GRID));
      span = GRID * cellSize;
      W = Math.round(2 * span + span * 0.2);
      H = Math.min(height, Math.round(span + cellSize * 2));
      cvEl.width = Math.round(W * dpr); cvEl.height = Math.round(H * dpr);
      cvEl.style.width = W + 'px'; cvEl.style.height = H + 'px';
      cvEl.style.margin = '0 auto';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      setup();
      paintStatic();
    }

    resize();
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !running) { running = true; raf = requestAnimationFrame(step); }
      else if (!e.isIntersecting) { running = false; cancelAnimationFrame(raf); }
    }, { rootMargin: '150px' });
    io.observe(wrapEl);
    const onResize = () => resize();
    window.addEventListener('resize', onResize);
    return () => { running = false; cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener('resize', onResize); };
  }, [homePixels, awayPixels, homeSlug, awaySlug, homeColors, awayColors, height, theme]);

  return (
    <div ref={wrapRef} className={className} style={{ width: '100%' }} aria-hidden="true">
      <canvas ref={cvRef} style={{ display: 'block' }} />
    </div>
  );
}
