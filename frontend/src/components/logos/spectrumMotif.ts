// Live spectrum-motif renderer — a faithful port of the pixel-logo generator's
// "spectrum" fill. Each crest cell gets a spectrum color + an inner motif that
// toggles plain <-> slash, staggered per pixel so the fill shimmers.

const GRID = 32;
export const FRAMES = 8;

const SPECTRUM_COLORS = ['#ff003c', '#ff7a00', '#ffe600', '#00d084', '#00e5ff', '#0057ff', '#050505'];
const YELLOWS = new Set(['#f5bd19', '#ffcd00', '#ffce00', '#f1bf00', '#ffe600', '#ffe600']);

// B&W motif — same shimmer, all grays. A light-to-dark ramp so neighbouring
// cells read as distinct shades instead of one flat tone.
const MONO_COLORS = ['#f5f5f5', '#cfcfcf', '#9e9e9e', '#6e6e6e', '#454545', '#1f1f1f', '#080808'];

export type MotifVariant = 'spectrum' | 'mono' | 'outline';

/** First-channel value of a #rrggbb gray (0-255); grays have r=g=b. */
function grayLevel(hex: string): number {
  return parseInt(hex.slice(1, 3), 16);
}

// Small deterministic PRNG so each crest gets a stable-but-distinct pass network.
function mulberry32(a: number): () => number {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function teamSeed(id: string): number {
  let total = 0;
  for (let i = 0; i < id.length; i++) total += id.charCodeAt(i);
  return total;
}

// Same 32-bit hash the generator uses (ToInt32 semantics via >>>0 / |0).
function patternSeed(index: number, seed: number): number {
  const x = index % GRID;
  const y = (index / GRID) | 0;
  const a = (x * 73856093) >>> 0;
  const b = (y * 19349663) >>> 0;
  const c = (seed * 83492791) >>> 0;
  const v = (a ^ b ^ c) | 0;
  return Math.abs(v);
}

/**
 * Draw a crest's on-cells filled with the animated spectrum motif into ctx.
 * @param onCells 0-based grid indices that form the crest silhouette.
 * @param cell    pixel size of one grid cell.
 * @param frame   current animation frame (0..FRAMES-1).
 */
export type PixelShape = 'square' | 'circle';

export function drawSpectrumCrest(
  ctx: CanvasRenderingContext2D,
  onCells: number[],
  seed: number,
  frame: number,
  cell: number,
  shape: PixelShape = 'square',
  variant: MotifVariant = 'spectrum',
): void {
  const palette = variant === 'mono' ? MONO_COLORS : SPECTRUM_COLORS;
  for (const index of onCells) {
    const cx = (index % GRID) * cell;
    const cy = ((index / GRID) | 0) * cell;
    const color = palette[(index + seed) % palette.length];

    // For circle pixels, clip each cell to a disc so both the fill and the
    // motif read as a round pixel.
    if (shape === 'circle') {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx + cell / 2, cy + cell / 2, cell / 2, 0, Math.PI * 2);
      ctx.clip();
    }

    ctx.fillStyle = color;
    ctx.fillRect(cx, cy, cell, cell);

    // motif: plain <-> slash; some cells start on slash
    const ps = patternSeed(index, seed);
    const base = ps % 4 === 0 ? 'slash' : 'plain';
    const phase = ps % FRAMES;
    const useAlt = (frame + phase) % FRAMES >= FRAMES / 2;
    const motif = useAlt ? (base === 'plain' ? 'slash' : 'plain') : base;
    if (motif === 'slash') {
      // Mono: slash with a contrasting shade so the stripe stays legible on any
      // gray. Spectrum: keep the original yellow→black / else cyan rule.
      ctx.fillStyle = variant === 'mono'
        ? (grayLevel(color) > 110 ? '#080808' : '#f5f5f5')
        : YELLOWS.has(color) ? '#050505' : '#00e5ff';
      const step = Math.max(1, cell / 6);
      for (let off = -cell; off < cell * 2; off += step * 2) {
        const x0 = Math.max(cx, cx + off);
        const x1 = Math.min(cx + cell, cx + off + step);
        if (x1 > x0) ctx.fillRect(x0, cy, x1 - x0, cell);
      }
    }

    if (shape === 'circle') ctx.restore();
  }
}

/**
 * "Outlines" motif, static layer — every crest cell drawn as a hollow outlined
 * box (not filled). Rendered once and cached; the animated pass network is
 * drawn on top each frame by drawPassNetwork. Echoes the PASSES spec sheet.
 */
export function drawOutlineCells(
  ctx: CanvasRenderingContext2D,
  onCells: number[],
  cell: number,
  shape: PixelShape,
  stroke: string,
): void {
  const inset = cell * 0.16; // small gap between boxes, like the spec sheet
  ctx.lineWidth = Math.max(1, cell * 0.13);
  ctx.strokeStyle = stroke;
  ctx.lineJoin = 'miter';
  for (const index of onCells) {
    const cx = (index % GRID) * cell;
    const cy = ((index / GRID) | 0) * cell;
    if (shape === 'circle') {
      ctx.beginPath();
      ctx.arc(cx + cell / 2, cy + cell / 2, (cell - inset) / 2, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeRect(cx + inset / 2, cy + inset / 2, cell - inset, cell - inset);
    }
  }
}

/** Build the deterministic nearest-neighbour tour through the crest's cells. */
function buildTour(onCells: number[], seed: number, cell: number) {
  const centers = onCells.map((i) => ({
    x: (i % GRID) * cell + cell / 2,
    y: ((i / GRID) | 0) * cell + cell / 2,
  }));
  const rng = mulberry32((seed * 2654435761) >>> 0);
  // 11 nodes — a full XI — so the lane threads through 11 anchor points with
  // a squiggle between each. Clamp down only if the crest has fewer cells.
  const K = Math.min(11, centers.length);
  const pool = centers.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const picked = pool.slice(0, Math.min(K, pool.length));
  const used = new Array(picked.length).fill(false);
  const tour = [picked[0]];
  used[0] = true;
  let cur = 0;
  for (let step = 1; step < picked.length; step++) {
    let best = -1, bd = Infinity;
    for (let j = 0; j < picked.length; j++) {
      if (used[j]) continue;
      const dx = picked[j].x - picked[cur].x;
      const dy = picked[j].y - picked[cur].y;
      const d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = j; }
    }
    used[best] = true;
    tour.push(picked[best]);
    cur = best;
  }
  return tour;
}

const TWO_PI = Math.PI * 2;

/**
 * Animated pass network: a gently squiggling green lane threaded through the
 * crest with green dots gliding along it. `phase` is a continuous 0..1 loop
 * clock (driven by rAF, not the coarse frame counter) so the dots move
 * smoothly. The squiggle is drawn behind the dots.
 */
export function drawPassNetwork(
  ctx: CanvasRenderingContext2D,
  onCells: number[],
  seed: number,
  phase: number,
  cell: number,
  shape: PixelShape,
  green: string,
  stroke: string,
): void {
  if (onCells.length < 2) return;
  const tour = buildTour(onCells, seed, cell);
  if (tour.length < 2) return;

  // ---- squiggle the straight tour into a wavy lane ---------------------
  // A little waviness, tapered to zero at each node so segments still meet.
  const amp = cell * 0.45;   // "a little bit more, not too much"
  const waves = 1.4;         // gentle bends per segment
  const wob = phase * TWO_PI; // the squiggle itself drifts slowly
  const SUB = 10;
  const pts: { x: number; y: number }[] = [];
  for (let s = 0; s < tour.length - 1; s++) {
    const a = tour[s], b = tour[s + 1];
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len; // unit perpendicular
    for (let k = 0; k <= SUB; k++) {
      const u = k / SUB;
      const taper = Math.sin(u * Math.PI); // 0 at both ends → meets the node
      const off = Math.sin(u * Math.PI * 2 * waves + s * 1.7 + wob) * amp * taper;
      pts.push({ x: a.x + dx * u + nx * off, y: a.y + dy * u + ny * off });
    }
  }

  // cumulative arc length so dots can ride the lane at constant speed
  const cum = [0];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    cum.push(total);
  }
  if (total <= 0) return;

  // ---- the lane, behind everything -------------------------------------
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = green;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = Math.max(1, cell * 0.13);
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
  ctx.globalAlpha = 1;

  const at = (target: number) => {
    let i = 1;
    while (i < cum.length && cum[i] < target) i++;
    const p0 = pts[i - 1], p1 = pts[Math.min(i, pts.length - 1)];
    const segLen = (cum[Math.min(i, cum.length - 1)] - cum[i - 1]) || 1;
    const t = (target - cum[i - 1]) / segLen;
    return { x: p0.x + (p1.x - p0.x) * t, y: p0.y + (p1.y - p0.y) * t };
  };

  // ---- dots gliding along the lane, on top -----------------------------
  // 11 green pixels — one per outfield+keeper — evenly spaced along the lane
  // so there's a squiggle in between every pair.
  const ND = Math.min(11, tour.length);
  const rad = cell * 0.55;
  ctx.lineWidth = Math.max(1, cell * 0.09);
  ctx.strokeStyle = stroke; // rim so dots pop over the lane
  ctx.fillStyle = green;
  for (let d = 0; d < ND; d++) {
    const f = (phase + d / ND) % 1;
    const p = at(f * total);
    if (shape === 'circle') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, rad, 0, TWO_PI);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(p.x - rad, p.y - rad, rad * 2, rad * 2);
      ctx.strokeRect(p.x - rad, p.y - rad, rad * 2, rad * 2);
    }
  }
}
