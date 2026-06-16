// @ts-nocheck
/* Field engine — the generative "field" that lives in the NEGATIVE space of
   the 32×32 logo grid (every cell the logo does NOT fill). The field is the
   match's stat sheet rendered as layered, sectioned clusters: the negative
   space is divided into regions, each region hosts ONE of the 11 ESPN stats,
   and each stat is drawn with a texture whose density/extent/count encodes its
   real value. Concepts compose shared primitives + a sectioning strategy, so
   the look is a stack of effects working together — grounded in the reference
   grid systems (scatter density, hanging bars, capsule gardens, pattern tiles,
   triangle forests, marching rows, plus-fields, hatch clusters, mosaics…). */

const GRID = 32;

// canonical 11 stats, in order, with a sensible cap to normalize to 0..1
function statValues(S) {
  S = S || {};
  const sot = Math.max(0, Math.round(S.shotsOnTarget ?? 0));
  const shots = Math.max(0, Math.round(S.shots ?? 0));
  const raw = [
    ['goals', Math.max(0, Math.round(S.goals ?? 0)), 6],
    ['sot', sot, 10],
    ['shots', shots, 16], // total shots ("shots in general")
    ['corners', Math.max(0, Math.round(S.corners ?? 0)), 12],
    ['yellow', Math.max(0, Math.round(S.yellowCards ?? S.cards ?? 0)), 6],
    ['red', Math.max(0, Math.round(S.redCards ?? 0)), 3],
    ['offsides', Math.max(0, Math.round(S.offsides ?? 0)), 8],
    ['fouls', Math.max(0, Math.round(S.fouls ?? 0)), 22],
    ['var', Math.max(0, Math.round(S.var ?? 0)), 4],
    ['possession', Math.max(0, Math.round(S.possession ?? 0)), 100],
    ['passes', Math.max(0, Math.round(S.passes ?? 0)), 700],
  ];
  return raw.map(([k, v, max]) => ({ k, v, max, n: Math.max(0, Math.min(1, v / max)) }));
}

// deterministic PRNG hash
function ps(i, seed) {
  let h = (i * 374761393 + seed * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// editorial accent palette (from the reference grids) — warm, saturated
const ACCENTS = ['#f15a24', '#2db84c', '#b6e34d', '#8fb8e8', '#f5a3c7', '#f5c518', '#e8e2d4', '#1c1c1c'];

// 11-colour working palette: team colours first, then accents, de-duped so
// adjacent stat regions read differently.
function buildPalette(teamColors) {
  const tc = (teamColors || []).filter(Boolean);
  const out = [];
  const push = (c) => { if (c && !out.includes(c)) out.push(c); };
  tc.forEach(push);
  ACCENTS.forEach(push);
  while (out.length < 11) out.push(ACCENTS[out.length % ACCENTS.length]);
  return out.slice(0, 11);
}

function hexToRgb(h) { const n = parseInt(String(h).slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
// blend an rgb toward the near-black background so the field reads as a
// recessive backdrop that doesn't fight the logo. k = 0..1 (toward bg).
function muteRgb(c, k) {
  return `rgb(${Math.round(c[0] * (1 - k) + 12 * k)},${Math.round(c[1] * (1 - k) + 12 * k)},${Math.round(c[2] * (1 - k) + 14 * k)})`;
}

// hsl→rgb (h 0..360, s/l 0..1)
function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

// the working 11-colour palette in one of three moods:
//  'team'     — monochromatic, the team's own colours at varying lightness
//  'bw'       — black & white, pure greyscale background element
//  'spectrum' — the iFC neon line-colours (the original spectrum style), jittered
//               in lightness so the field reads as a noisy rainbow
function paletteRGB(mode, teamColors) {
  if (mode === 'bw' || mode === 'gray') return Array.from({ length: 11 }, (_, i) => { const v = 64 + Math.round((i / 10) * 84); return [v, v, v + 4]; });
  if (mode === 'spectrum' || mode === 'color') {
    // the real spectrum palette (#ff003c…#0057ff) + a violet, no near-black
    const SPEC = [[255, 0, 60], [255, 122, 0], [255, 230, 0], [0, 208, 132], [0, 229, 255], [0, 87, 255], [176, 0, 255]];
    return Array.from({ length: 11 }, (_, i) => {
      const c = SPEC[i % SPEC.length];
      const f = 0.78 + 0.34 * ((i * 0.41) % 1); // jitter → noisy rainbow, not an even ramp
      return [Math.min(255, c[0] * f), Math.min(255, c[1] * f), Math.min(255, c[2] * f)];
    });
  }
  // team (default) — the team's own colours, spread in lightness
  const cols = (teamColors || []).filter(Boolean);
  const base = cols.length ? cols : ['#3aa0ff'];
  return Array.from({ length: 11 }, (_, i) => {
    const [r, g, b] = hexToRgb(base[i % base.length]);
    const f = 0.55 + 0.55 * ((i * 0.37) % 1);
    return [Math.min(255, r * f), Math.min(255, g * f), Math.min(255, b * f)];
  });
}

// smooth value noise (bilinear, smoothstep) — the basis for fluid, organic
// region shapes instead of hard-edged k-means blocks.
function vnoise(x, y, seed) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const sx = x - xi, sy = y - yi;
  const h = (a, b) => ps((((a % 1024) + 1024) % 1024) * 1031 + (((b % 1024) + 1024) % 1024) + 1, seed);
  const u = sx * sx * (3 - 2 * sx), v = sy * sy * (3 - 2 * sy);
  const n00 = h(xi, yi), n10 = h(xi + 1, yi), n01 = h(xi, yi + 1), n11 = h(xi + 1, yi + 1);
  return (n00 * (1 - u) + n10 * u) * (1 - v) + (n01 * (1 - u) + n11 * u) * v;
}

// FLUID regions: every negative cell joins the stat whose drifting noise field
// is strongest there, weighted by the stat's value — so big stats (passes,
// possession, shots) sprawl as broad organic layers and rare ones (cards, VAR)
// are small punctuation. `time` drifts the fields so the whole grid flows.
function fluidRegions(neg, stats, seed, time) {
  const t = time || 0;
  const W = stats.map((s) => 0.14 + s.n);
  const cellsByRegion = Array.from({ length: 11 }, () => []);
  const scale = 6.5;
  for (const idx of neg) {
    const x = (idx % GRID) / scale + t * 0.11, y = Math.floor(idx / GRID) / scale + t * 0.045;
    let best = 0, bv = -1;
    for (let i = 0; i < 11; i++) {
      const score = vnoise(x + i * 5.3, y + i * 9.1, seed + i * 131) * W[i];
      if (score > bv) { bv = score; best = i; }
    }
    cellsByRegion[best].push(idx);
  }
  return cellsByRegion;
}
let _fluidCache = { key: '', val: null };
function cachedFluid(neg, stats, seed) {
  const key = neg.length + ':' + (neg[0] ?? -1) + ':' + seed + ':' + stats.map((s) => s.v).join(',');
  if (_fluidCache.key !== key) _fluidCache = { key, val: fluidRegions(neg, stats, seed, 0) };
  return _fluidCache.val;
}

// ---- sectioning the negative space ---------------------------------------

// k contiguous regions over the negative cells (farthest-point seed + Lloyd)
function regionsKMeans(neg, k) {
  const n = neg.length;
  const assign = new Array(n).fill(0);
  if (!n) return assign;
  k = Math.min(k, n);
  const pts = neg.map((idx) => [idx % GRID, Math.floor(idx / GRID)]);
  const d2 = (a, b) => { const dx = a[0] - b[0], dy = a[1] - b[1]; return dx * dx + dy * dy; };
  let cx = 0, cy = 0; for (const p of pts) { cx += p[0]; cy += p[1]; } cx /= n; cy /= n;
  let first = 0, best = Infinity;
  for (let i = 0; i < n; i++) { const d = d2(pts[i], [cx, cy]); if (d < best) { best = d; first = i; } }
  const cent = [[pts[first][0], pts[first][1]]];
  const mind = pts.map((p) => d2(p, cent[0]));
  while (cent.length < k) {
    let fi = 0, fb = -1;
    for (let i = 0; i < n; i++) if (mind[i] > fb) { fb = mind[i]; fi = i; }
    cent.push([pts[fi][0], pts[fi][1]]);
    for (let i = 0; i < n; i++) { const d = d2(pts[i], pts[fi]); if (d < mind[i]) mind[i] = d; }
  }
  for (let it = 0; it < 10; it++) {
    for (let i = 0; i < n; i++) { let b = 0, bd = Infinity; for (let j = 0; j < k; j++) { const d = d2(pts[i], cent[j]); if (d < bd) { bd = d; b = j; } } assign[i] = b; }
    const sx = new Array(k).fill(0), sy = new Array(k).fill(0), ct = new Array(k).fill(0);
    for (let i = 0; i < n; i++) { const a = assign[i]; sx[a] += pts[i][0]; sy[a] += pts[i][1]; ct[a]++; }
    for (let j = 0; j < k; j++) if (ct[j]) cent[j] = [sx[j] / ct[j], sy[j] / ct[j]];
  }
  // map neg-array-index → region; also return as {region, cellsByRegion}
  const cellsByRegion = Array.from({ length: k }, () => []);
  for (let i = 0; i < n; i++) cellsByRegion[assign[i]].push(neg[i]);
  return { assign, cellsByRegion, cent };
}

// k horizontal bands over the whole grid (negative cells grouped by row band)
function bandsH(neg, k) {
  const cellsByRegion = Array.from({ length: k }, () => []);
  for (const idx of neg) {
    const row = Math.floor(idx / GRID);
    const b = Math.min(k - 1, Math.floor((row / GRID) * k));
    cellsByRegion[b].push(idx);
  }
  return { cellsByRegion };
}
// k vertical column-groups
function columnsV(neg, k) {
  const cellsByRegion = Array.from({ length: k }, () => []);
  for (const idx of neg) {
    const col = idx % GRID;
    const b = Math.min(k - 1, Math.floor((col / GRID) * k));
    cellsByRegion[b].push(idx);
  }
  return { cellsByRegion };
}

const XY = (idx, cell) => [(idx % GRID) * cell, Math.floor(idx / GRID) * cell];

// ---- texture primitives (operate on a list of 0-based cells) --------------

function pScatter(ctx, cells, cell, color, density, seed) {
  ctx.fillStyle = color;
  for (let i = 0; i < cells.length; i++) {
    if (ps(cells[i], seed) > density) continue;
    const [x, y] = XY(cells[i], cell);
    ctx.fillRect(x, y, cell, cell);
  }
}
function pSolid(ctx, cells, cell, color) {
  ctx.fillStyle = color;
  for (const c of cells) { const [x, y] = XY(c, cell); ctx.fillRect(x, y, cell, cell); }
}
function pDots(ctx, cells, cell, color, density, seed) {
  ctx.fillStyle = color;
  for (const c of cells) {
    if (ps(c, seed) > density) continue;
    const [x, y] = XY(c, cell);
    ctx.beginPath(); ctx.arc(x + cell / 2, y + cell / 2, cell * 0.4, 0, Math.PI * 2); ctx.fill();
  }
}
// vertical bars hanging from the top of the region; bar length scales with `amt`
function pBarsDown(ctx, cells, cell, color, amt, seed, rounded) {
  if (!cells.length) return;
  let minR = 99, maxR = 0; const byCol = {};
  for (const c of cells) { const col = c % GRID, row = Math.floor(c / GRID); if (row < minR) minR = row; if (row > maxR) maxR = row; (byCol[col] = byCol[col] || []).push(row); }
  const span = (maxR - minR + 1);
  ctx.fillStyle = color;
  for (const colS of Object.keys(byCol)) {
    const col = +colS;
    if (ps(col, seed) > 0.7) continue; // pinstripe gaps
    const rows = byCol[col].sort((a, b) => a - b);
    const bottom = rows[rows.length - 1]; // baseline at the column's bottom
    const len = Math.max(1, Math.round((0.35 + 0.65 * ps(col, seed + 9)) * amt * span));
    const x = col * cell, w = Math.max(2, cell * 0.5);
    const h = len * cell;
    const y = (bottom + 1) * cell - h; // grow UP from the baseline → bars sit below
    if (rounded) { ctx.beginPath(); ctx.roundRect(x + (cell - w) / 2, y, w, h, w / 2); ctx.fill(); }
    else ctx.fillRect(x + (cell - w) / 2, y, w, h);
  }
}
// rounded vertical capsules sprinkled in the region (count scales with `cnt`)
function pCapsules(ctx, cells, cell, color, cnt, seed) {
  if (!cells.length) return;
  ctx.fillStyle = color;
  const shuffled = cells.slice().sort((a, b) => ps(a, seed) - ps(b, seed));
  const n = Math.max(1, Math.min(shuffled.length, cnt));
  for (let i = 0; i < n; i++) {
    const c = shuffled[Math.floor((i / n) * shuffled.length)];
    const [x, y] = XY(c, cell);
    const len = (1 + Math.floor(ps(c, seed + 3) * 3)) * cell;
    const w = Math.max(2, cell * 0.46);
    // ~1 in 3 capsules lies horizontal so they don't all march the same way
    const horiz = ps(c, seed + 5) < 0.34;
    ctx.beginPath();
    if (horiz) ctx.roundRect(x, y + (cell - w) / 2, len, w, w / 2);
    else ctx.roundRect(x + (cell - w) / 2, y, w, len, w / 2);
    ctx.fill();
  }
}
function pHatch(ctx, cells, cell, color, density, seed, dir) {
  ctx.strokeStyle = color; ctx.lineWidth = Math.max(1.4, cell * 0.22); ctx.lineCap = 'round';
  for (const c of cells) {
    if (ps(c, seed) > density) continue;
    const [x, y] = XY(c, cell);
    ctx.beginPath();
    if (dir > 0) { ctx.moveTo(x + cell * 0.15, y + cell * 0.85); ctx.lineTo(x + cell * 0.85, y + cell * 0.15); }
    else { ctx.moveTo(x + cell * 0.15, y + cell * 0.15); ctx.lineTo(x + cell * 0.85, y + cell * 0.85); }
    ctx.stroke();
  }
}
function pCheck(ctx, cells, cell, color, seed) {
  ctx.fillStyle = color;
  for (const c of cells) { const col = c % GRID, row = Math.floor(c / GRID); if ((col + row) % 2) continue; const [x, y] = XY(c, cell); ctx.fillRect(x, y, cell, cell); }
}
function pTriangles(ctx, cells, cell, color, density, seed) {
  ctx.fillStyle = color;
  for (const c of cells) {
    if (ps(c, seed) > density) continue;
    const [x, y] = XY(c, cell);
    ctx.beginPath(); ctx.moveTo(x + cell / 2, y + cell * 0.12); ctx.lineTo(x + cell * 0.9, y + cell * 0.9); ctx.lineTo(x + cell * 0.1, y + cell * 0.9); ctx.closePath(); ctx.fill();
  }
}
function pPlus(ctx, cells, cell, color, density, seed) {
  ctx.strokeStyle = color; ctx.lineWidth = Math.max(1.2, cell * 0.16); ctx.lineCap = 'round';
  for (const c of cells) {
    if (ps(c, seed) > density) continue;
    const [x, y] = XY(c, cell); const cx = x + cell / 2, cy = y + cell / 2, r = cell * 0.28;
    ctx.beginPath();
    ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy);           // horizontal bar (always)
    if (ps(c, seed + 7) > 0.42) { ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); } // vertical → makes it a + (else it stays a −)
    ctx.stroke();
  }
}
// concentric rings centred on a region's centroid; ring count = `cnt` (caller
// passes a small, normalized count — see ringCount() — so it reads as evenly
// spaced sonar rings, never a moiré blob).
// `phase` (0..1, advances with time) makes them pulse outward like sonar.
function pRings(ctx, cells, cell, color, cnt, phase) {
  if (!cells.length) return;
  let sx = 0, sy = 0; for (const c of cells) { sx += c % GRID; sy += Math.floor(c / GRID); }
  const cx = (sx / cells.length + 0.5) * cell, cy = (sy / cells.length + 0.5) * cell;
  let rmax = 0; for (const c of cells) { const dx = (c % GRID) * cell + cell / 2 - cx, dy = Math.floor(c / GRID) * cell + cell / 2 - cy; rmax = Math.max(rmax, Math.hypot(dx, dy)); }
  if (rmax < cell * 0.5) rmax = cell * 0.5; // single-cell region still shows one ring
  ctx.strokeStyle = color; ctx.lineWidth = Math.max(1.4, cell * 0.26);
  const rings = Math.max(1, Math.round(cnt)), ph = phase || 0;
  // rings sit at evenly spaced radii (f+1)/rings of rmax, drifting outward by phase
  for (let i = 0; i < rings; i++) {
    const f = ((i + ph) % rings + rings) % rings; // 0..rings, drifts with phase
    const r = (rmax * (f + 1)) / rings;
    ctx.globalAlpha = 0.3 + 0.6 * (1 - f / rings);
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
// stat value (0..1 normalized) → a small, readable ring/square count (2..8).
// Raw stat values (passes in the hundreds, possession ~60) would otherwise pack
// hundreds of nested shapes into one centroid and render as a solid blob.
function ringCount(n) { return 2 + Math.round(Math.max(0, Math.min(1, n)) * 6); }
function pStripesH(ctx, cells, cell, color, seed) {
  ctx.fillStyle = color;
  for (const c of cells) { const row = Math.floor(c / GRID); if (row % 2) continue; const [x, y] = XY(c, cell); ctx.fillRect(x, y + cell * 0.2, cell, cell * 0.6); }
}

// ---- concepts -------------------------------------------------------------
// each: (ctx, C) where C = { cell, neg, set, stats, pal, seed }

function cScatter(ctx, C) {
  C.regions.forEach((cells, i) => {
    const s = C.stats[i], col = C.pal[i], density = 0.12 + 0.78 * s.n;
    ctx.fillStyle = col;
    for (const c of cells) {
      if (ps(c, C.seed + i * 31) > density) continue;
      // each cell gets its own depth of opacity → scattered, layered, not flat
      ctx.globalAlpha = 0.22 + 0.78 * ps(c, C.seed + i * 31 + 5);
      const [x, y] = XY(c, C.cell);
      ctx.fillRect(x, y, C.cell, C.cell);
    }
    ctx.globalAlpha = 1;
  });
}
function cBars(ctx, C) {
  const { cellsByRegion } = columnsV(C.neg, 11);
  cellsByRegion.forEach((cells, i) => pBarsDown(ctx, cells, C.cell, C.pal[i], 0.25 + 0.75 * C.stats[i].n, C.seed + i * 17, false));
}
function cCapsules(ctx, C) {
  const cellsByRegion = C.regions;
  cellsByRegion.forEach((cells, i) => {
    // denser — capsules fill the region in proportion to its size + the stat;
    // no background blob (those muddy colours are gone)
    const cnt = Math.max(2, Math.round(cells.length * (0.24 + 0.55 * C.stats[i].n)));
    pCapsules(ctx, cells, C.cell, C.pal[i], cnt, C.seed + i * 23);
  });
}
function cPatternTiles(ctx, C) {
  const cellsByRegion = C.regions;
  const tex = [pCheck, (a, b, c, d, e) => pHatch(a, b, c, d, 0.85, e, 1), (a, b, c, d, e) => pDots(a, b, c, d, 0.85, e),
    (a, b, c, d, e) => pTriangles(a, b, c, d, 0.85, e), (a, b, c, d, e) => pPlus(a, b, c, d, 0.85, e), pStripesH,
    pCheck, (a, b, c, d, e) => pHatch(a, b, c, d, 0.85, e, -1), (a, b, c, d, e) => pDots(a, b, c, d, 0.85, e), (a, b, c, d, e) => pTriangles(a, b, c, d, 0.85, e), pStripesH];
  cellsByRegion.forEach((cells, i) => {
    const s = C.stats[i];
    // section size reflects the stat: keep only the densest sub-cluster proportional to n
    const keep = Math.max(1, Math.round(cells.length * (0.25 + 0.75 * s.n)));
    const sub = cells.slice().sort((a, b) => ps(a, C.seed + i) - ps(b, C.seed + i)).slice(0, keep);
    tex[i](ctx, sub, C.cell, C.pal[i], C.seed + i * 13);
  });
}
// pine-tree forest — two stacked triangles per cell (a tree, not a lone triangle)
function pPines(ctx, cells, cell, color, density, seed) {
  ctx.fillStyle = color;
  for (const c of cells) {
    if (ps(c, seed) > density) continue;
    const [x, y] = XY(c, cell);
    const cx = x + cell / 2;
    // upper (smaller) tier
    ctx.beginPath(); ctx.moveTo(cx, y + cell * 0.08); ctx.lineTo(x + cell * 0.78, y + cell * 0.52); ctx.lineTo(x + cell * 0.22, y + cell * 0.52); ctx.closePath(); ctx.fill();
    // lower (wider) tier
    ctx.beginPath(); ctx.moveTo(cx, y + cell * 0.34); ctx.lineTo(x + cell * 0.9, y + cell * 0.9); ctx.lineTo(x + cell * 0.1, y + cell * 0.9); ctx.closePath(); ctx.fill();
  }
}
function cTriangleForest(ctx, C) {
  C.regions.forEach((cells, i) => pPines(ctx, cells, C.cell, C.pal[i], 0.1 + 0.8 * C.stats[i].n, C.seed + i * 29));
}
function cMarchingRows(ctx, C) {
  const { cellsByRegion } = bandsH(C.neg, 11);
  const glyph = [pDots, pTriangles, pCheck];
  cellsByRegion.forEach((cells, i) => {
    const s = C.stats[i];
    // keep only the left portion of the band proportional to n (a "bar")
    cells.sort((a, b) => (a % GRID) - (b % GRID));
    const keep = Math.max(1, Math.round(cells.length * (0.12 + 0.88 * s.n)));
    const sub = cells.slice(0, keep);
    const g = glyph[i % glyph.length];
    if (g === pDots) pDots(ctx, sub, C.cell, C.pal[i], 1, C.seed);
    else if (g === pTriangles) pTriangles(ctx, sub, C.cell, C.pal[i], 1, C.seed);
    else pCheck(ctx, sub, C.cell, C.pal[i], C.seed);
  });
}
function cPlusField(ctx, C) {
  // low-density plus over everything, then per-region accents
  pPlus(ctx, C.neg, C.cell, C.pal[7] || '#888', 0.5, C.seed);
  const cellsByRegion = C.regions;
  cellsByRegion.forEach((cells, i) => {
    const s = C.stats[i];
    if (s.n > 0.55) pSolid(ctx, cells.slice().sort((a, b) => ps(a, C.seed + i) - ps(b, C.seed + i)).slice(0, Math.round(cells.length * (s.n - 0.4))), C.cell, C.pal[i]);
    else pPlus(ctx, cells, C.cell, C.pal[i], 0.3 + 0.6 * s.n, C.seed + i);
  });
}
function cHatchClusters(ctx, C) {
  const cellsByRegion = C.regions;
  cellsByRegion.forEach((cells, i) => pHatch(ctx, cells, C.cell, C.pal[i], 0.15 + 0.8 * C.stats[i].n, C.seed + i * 19, i % 2 ? 1 : -1));
}
function cColorBlocks(ctx, C) {
  const cellsByRegion = C.regions;
  cellsByRegion.forEach((cells, i) => {
    const s = C.stats[i];
    const keep = Math.max(1, Math.round(cells.length * (0.25 + 0.75 * s.n)));
    // grow a compact block from the region centroid
    let sx = 0, sy = 0; for (const c of cells) { sx += c % GRID; sy += Math.floor(c / GRID); }
    const cc = sx / cells.length, cr = sy / cells.length;
    const sub = cells.slice().sort((a, b) => {
      const da = (a % GRID - cc) ** 2 + (Math.floor(a / GRID) - cr) ** 2;
      const db = (b % GRID - cc) ** 2 + (Math.floor(b / GRID) - cr) ** 2;
      return da - db;
    }).slice(0, keep);
    pSolid(ctx, sub, C.cell, C.pal[i]);
  });
}
// the hero "everything": each stat gets a DIFFERENT primitive, all layered
function cMixedMosaic(ctx, C) {
  const cellsByRegion = C.regions;
  cellsByRegion.forEach((cells, i) => {
    const s = C.stats[i], col = C.pal[i], seed = C.seed + i * 41, d = 0.18 + 0.78 * s.n;
    switch (i) {
      case 0: pScatter(ctx, cells, C.cell, col, d, seed); break;
      case 1: pDots(ctx, cells, C.cell, col, d, seed); break;
      case 2: pHatch(ctx, cells, C.cell, col, d, seed, 1); break;
      case 3: pBarsDown(ctx, cells, C.cell, col, s.n, seed, true); break;
      case 4: pTriangles(ctx, cells, C.cell, col, d, seed); break;
      case 5: pSolid(ctx, cells.slice().sort((a, b) => ps(a, seed) - ps(b, seed)).slice(0, Math.round(cells.length * d)), C.cell, col); break;
      case 6: pPlus(ctx, cells, C.cell, col, d, seed); break;
      case 7: pCheck(ctx, cells, C.cell, col, seed); break;
      case 8: pRings(ctx, cells, C.cell, col, ringCount(s.n)); break;
      case 9: pCapsules(ctx, cells, C.cell, col, Math.max(1, Math.round(s.n * 8)), seed); break;
      default: pStripesH(ctx, cells, C.cell, col, seed); break;
    }
  });
}

function centroid(cells) {
  let sx = 0, sy = 0; for (const c of cells) { sx += c % GRID; sy += Math.floor(c / GRID); }
  return [sx / cells.length, sy / cells.length];
}

// concentric circles — one ring-set per stat region, ring count = value. Clean
// full circles (no cluster-defining line scribble), clipped to the region so
// they stay in the negative space, rising from the region's BOTTOM edge so they
// emanate from underneath rather than off to one side.
function cRings(ctx, C) {
  C.regions.forEach((cells, i) => {
    if (!cells.length) return;
    let sx = 0, maxY = 0;
    for (const c of cells) { sx += c % GRID; maxY = Math.max(maxY, Math.floor(c / GRID)); }
    const ox = (sx / cells.length + 0.5) * C.cell;     // horizontal centre of region
    const oy = (maxY + 1) * C.cell;                    // bottom edge → rings rise from below
    let rmax = 0;
    for (const c of cells) { const dx = (c % GRID + 0.5) * C.cell - ox, dy = (Math.floor(c / GRID) + 0.5) * C.cell - oy; rmax = Math.max(rmax, Math.hypot(dx, dy)); }
    const rings = ringCount(C.stats[i].n);
    // ease-in/out pulse so the rings breathe gently (subtle, never frantic)
    const pulse = C.animate ? (1 - Math.cos(C.tt * 0.9 + i * 0.5)) * 0.5 : 0;
    ctx.save();
    ctx.beginPath();
    for (const c of cells) { const [x, y] = XY(c, C.cell); ctx.rect(x, y, C.cell, C.cell); }
    ctx.clip();
    ctx.strokeStyle = C.pal[i];
    ctx.lineWidth = Math.max(1.1, C.cell * 0.14);
    for (let k = 1; k <= rings; k++) {
      const f = (k - pulse) / rings;
      if (f <= 0) continue;
      ctx.globalAlpha = 0.32 + 0.55 * (1 - f);
      ctx.beginPath();
      ctx.arc(ox, oy, rmax * f, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  });
}
// halftone — dot grows toward each region's centre, scaled by the stat
function cHalftone(ctx, C) {
  const cellsByRegion = C.regions;
  cellsByRegion.forEach((cells, i) => {
    if (!cells.length) return;
    const [cc, cr] = centroid(cells); const s = C.stats[i];
    let md = 1; for (const c of cells) md = Math.max(md, Math.hypot(c % GRID - cc, Math.floor(c / GRID) - cr));
    ctx.fillStyle = C.pal[i];
    for (const c of cells) {
      const d = Math.hypot(c % GRID - cc, Math.floor(c / GRID) - cr) / md;
      // a wave ripples outward from the centre over time
      const pulse = 0.78 + 0.22 * Math.sin(C.tt * 2.4 - d * 4 + i);
      const r = (0.5 - 0.45 * d) * C.cell * (0.45 + 0.75 * s.n) * pulse;
      if (r < 0.7) continue;
      const [x, y] = XY(c, C.cell);
      ctx.beginPath(); ctx.arc(x + C.cell / 2, y + C.cell / 2, Math.min(C.cell * 0.5, r), 0, Math.PI * 2); ctx.fill();
    }
  });
}
// glitch — the region grid, but BROKEN: solid cells with whole rows torn
// sideways (horizontal datamosh) and cells eroded out, so it reads as an
// intentional corrupted-grid artifact, not random streaks.
function cGlitch(ctx, C) {
  C.regions.forEach((cells, i) => {
    const s = C.stats[i], col = C.pal[i];
    // per-row horizontal shift (in cells) — more shift the higher the stat
    const rowShift = {};
    for (const c of cells) {
      const row = Math.floor(c / GRID);
      if (rowShift[row] === undefined) {
        const tear = ps(row, C.seed + i * 7) < 0.35 + 0.4 * s.n;
        const dir = ps(row, C.seed + i * 7 + 3) < 0.5 ? -1 : 1;
        rowShift[row] = tear ? dir * (1 + Math.floor(ps(row, C.seed + i * 7 + 9) * (1 + s.n * 3))) : 0;
      }
    }
    for (const c of cells) {
      // erosion: knock out a fraction of cells so the grid looks degraded
      if (ps(c, C.seed + i * 11) > 0.45 + 0.5 * s.n) continue;
      const cx = c % GRID, row = Math.floor(c / GRID);
      const sh = rowShift[row] || 0;
      const x = (cx + sh) * C.cell, y = row * C.cell;
      // torn rows get a brighter offset ghost; intact cells solid
      ctx.fillStyle = col;
      ctx.globalAlpha = sh ? 0.92 : 0.7;
      ctx.fillRect(x, y, C.cell, C.cell);
      if (sh) { ctx.globalAlpha = 0.4; ctx.fillStyle = C.pal[(i + 3) % 11]; ctx.fillRect(x - sh * C.cell * 0.25, y, C.cell, C.cell * 0.5); }
    }
    ctx.globalAlpha = 1;
  });
}
// basket weave — over/under threads, density scales with the stat
function cWeave(ctx, C) {
  const cellsByRegion = C.regions;
  cellsByRegion.forEach((cells, i) => {
    const s = C.stats[i]; ctx.fillStyle = C.pal[i];
    for (const c of cells) {
      if (ps(c, C.seed + i) > 0.3 + 0.68 * s.n) continue;
      const col = c % GRID, row = Math.floor(c / GRID); const [x, y] = XY(c, C.cell);
      if ((col + row) % 2 === 0) ctx.fillRect(x + C.cell * 0.16, y, C.cell * 0.68, C.cell);
      else ctx.fillRect(x, y + C.cell * 0.16, C.cell, C.cell * 0.68);
    }
  });
}
// node network — nodes per region (count = value) linked to nearest neighbour
function cNodes(ctx, C) {
  const cellsByRegion = C.regions;
  cellsByRegion.forEach((cells, i) => {
    if (cells.length < 2) return;
    const s = C.stats[i]; const n = Math.max(2, Math.min(cells.length, s.v + 2));
    // stable layout (baseSeed) so nodes don't jump; only the dots pulse
    const shuffled = cells.slice().sort((a, b) => ps(a, C.baseSeed + i) - ps(b, C.baseSeed + i));
    const nodes = [];
    for (let k = 0; k < n; k++) { const c = shuffled[Math.floor((k / n) * shuffled.length)]; nodes.push([(c % GRID + 0.5) * C.cell, (Math.floor(c / GRID) + 0.5) * C.cell]); }
    ctx.strokeStyle = C.pal[i]; ctx.lineWidth = Math.max(1, C.cell * 0.12);
    for (let a = 0; a < nodes.length; a++) {
      let best = -1, bd = Infinity;
      for (let b = 0; b < nodes.length; b++) { if (b === a) continue; const d = (nodes[a][0] - nodes[b][0]) ** 2 + (nodes[a][1] - nodes[b][1]) ** 2; if (d < bd) { bd = d; best = b; } }
      if (best >= 0) { ctx.beginPath(); ctx.moveTo(nodes[a][0], nodes[a][1]); ctx.lineTo(nodes[best][0], nodes[best][1]); ctx.stroke(); }
    }
    ctx.fillStyle = C.pal[i];
    // slow, gentle breathing (was 3× — felt frantic); nodes read as steady points
    nodes.forEach((nd, k) => { const r = C.cell * (0.34 + 0.08 * Math.sin(C.tt * 0.7 + k * 0.8 + i)); ctx.beginPath(); ctx.arc(nd[0], nd[1], r, 0, Math.PI * 2); ctx.fill(); });
  });
}
// histogram — 11 stat columns drawn as a STACKED LEVEL METER: a dim body, a
// segment-gap rhythm, and a bright lit "cap" at the top of each column, so it
// reads like an EQ / telemetry readout rather than 11 flat bars.
function cHistogram(ctx, C) {
  for (let i = 0; i < 11; i++) {
    const c0 = Math.floor((i * GRID) / 11), c1 = Math.floor(((i + 1) * GRID) / 11);
    const h = Math.max(0, Math.round(C.stats[i].n * GRID) + (C.animate ? Math.round(Math.sin(C.tt * 1.4 + i * 0.7)) : 0));
    const col0 = C.pal[i];
    const cap = C.pal[(i + 4) % 11]; // contrasting bright cap colour
    for (let col = c0; col < c1 - 1; col++) {
      for (let r = 0; r < h; r++) {
        const row = GRID - 1 - r;
        if (C.set.has(row * GRID + col + 1)) continue;
        // segment gaps every 3rd cell → the metered look
        if (r % 3 === 2) continue;
        const isCap = r >= h - 2; // top two cells are the lit cap
        ctx.fillStyle = isCap ? cap : col0;
        ctx.globalAlpha = isCap ? 1 : 0.55 + 0.4 * (r / Math.max(1, h));
        ctx.fillRect(col * C.cell, row * C.cell, C.cell, C.cell);
      }
    }
    ctx.globalAlpha = 1;
  }
}

// perspective grid — each region becomes a one-point-perspective tunnel: nested
// squares shrinking toward a vanishing point + corner rails running back into
// space. Depth (ring count) scales with the stat. Clipped to the region so the
// grid lives in the negative space.
function pSquares(ctx, cells, cell, color, cnt, tt) {
  if (!cells.length) return;
  let minX = 99, minY = 99, maxX = 0, maxY = 0;
  for (const c of cells) { const cx = c % GRID, cy = Math.floor(c / GRID); minX = Math.min(minX, cx); maxX = Math.max(maxX, cx); minY = Math.min(minY, cy); maxY = Math.max(maxY, cy); }
  const x0 = minX * cell, y0 = minY * cell, w = (maxX - minX + 1) * cell, h = (maxY - minY + 1) * cell;
  // vanishing point drifts gently up-and-back
  const vx = x0 + w * (0.5 + 0.06 * Math.sin((tt || 0) * 0.5));
  const vy = y0 + h * (0.42 + 0.05 * Math.cos((tt || 0) * 0.4));
  ctx.save();
  ctx.beginPath();
  for (const c of cells) { const [x, y] = XY(c, cell); ctx.rect(x, y, cell, cell); }
  ctx.clip();
  ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, cell * 0.12);
  const corners = [[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]];
  // rails to the vanishing point
  for (const [px, py] of corners) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(vx, vy); ctx.stroke(); }
  // nested rectangles stepping toward the vanishing point (the floor grid)
  const n = Math.max(2, cnt);
  for (let i = 1; i <= n; i++) {
    const f = i / (n + 1); // 0 = outer edge, 1 = vanishing point
    ctx.globalAlpha = 0.3 + 0.6 * (1 - f);
    const rx = x0 + (vx - x0) * f, ry = y0 + (vy - y0) * f;
    const rw = w * (1 - f), rh = h * (1 - f);
    ctx.strokeRect(rx, ry, rw, rh);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}
function cConcentricSquares(ctx, C) {
  C.regions.forEach((cells, i) => { if (cells.length) pSquares(ctx, cells, C.cell, C.pal[i], ringCount(C.stats[i].n), C.tt); });
}
// topographic contour — alternating filled distance-bands from each centroid
function cContour(ctx, C) {
  const cellsByRegion = C.regions;
  cellsByRegion.forEach((cells, i) => {
    if (!cells.length) return;
    const [cc, cr] = centroid(cells); const s = C.stats[i];
    let md = 1; for (const c of cells) md = Math.max(md, Math.hypot(c % GRID - cc, Math.floor(c / GRID) - cr));
    const bands = Math.max(1, Math.round(1 + s.n * 5));
    ctx.fillStyle = C.pal[i];
    for (const c of cells) {
      const d = Math.hypot(c % GRID - cc, Math.floor(c / GRID) - cr) / md;
      // contour bands drift inward over time
      if (Math.floor(d * bands * 2 - C.tt * 1.6) % 2 === 0) { const [x, y] = XY(c, C.cell); ctx.fillRect(x, y, C.cell, C.cell); }
    }
  });
}
// truchet tiles — SOLID two-tone quarter-circle tiles (full opaque colour, its
// own bold maze vibe — no opacity fades). Each cell is the region colour with a
// contrasting quarter-disc, so the curves flow as solid colour, not thin lines.
function cTruchet(ctx, C) {
  C.regions.forEach((cells, i) => {
    if (!cells.length) return;
    const base = C.pal[i];
    const alt = C.pal[(i + 5) % 11]; // a contrasting region colour for the disc
    ctx.globalAlpha = 1; // full opaque — override the field's recessive alpha
    for (const c of cells) {
      const [x, y] = XY(c, C.cell); const r = C.cell;
      // solid tile background
      ctx.fillStyle = base;
      ctx.fillRect(x, y, C.cell, C.cell);
      // two opposite quarter-discs in the contrasting colour → the truchet curve
      ctx.fillStyle = alt;
      const flip = ps(c, C.baseSeed + i + 5) < 0.5;
      ctx.beginPath();
      if (flip) {
        ctx.moveTo(x, y); ctx.arc(x, y, r, 0, Math.PI / 2); ctx.closePath();
        ctx.moveTo(x + C.cell, y + C.cell); ctx.arc(x + C.cell, y + C.cell, r, Math.PI, Math.PI * 1.5); ctx.closePath();
      } else {
        ctx.moveTo(x + C.cell, y); ctx.arc(x + C.cell, y, r, Math.PI / 2, Math.PI); ctx.closePath();
        ctx.moveTo(x, y + C.cell); ctx.arc(x, y + C.cell, r, Math.PI * 1.5, Math.PI * 2); ctx.closePath();
      }
      ctx.fill();
    }
  });
}
// dot-matrix / LED readout — lit vs dim dots, lit fraction scales with the stat
function cDotMatrix(ctx, C) {
  const cellsByRegion = C.regions;
  cellsByRegion.forEach((cells, i) => {
    const s = C.stats[i]; ctx.fillStyle = C.pal[i];
    const r = C.cell * 0.16; // small, UNIFORM dots — only lit/dim changes, not size
    for (const c of cells) {
      const lit = ps(c, C.seed + i * 7) < 0.15 + 0.8 * s.n;
      const [x, y] = XY(c, C.cell);
      ctx.globalAlpha = lit ? 1 : 0.28;
      ctx.beginPath(); ctx.arc(x + C.cell / 2, y + C.cell / 2, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
}
// sparklines — one waveform per horizontal band, amplitude scales with the stat
function cSparkline(ctx, C) {
  const { cellsByRegion } = bandsH(C.neg, 11);
  cellsByRegion.forEach((cells, i) => {
    if (cells.length < 2) return;
    const s = C.stats[i];
    let minC = 99, maxC = 0, minR = 99, maxR = 0;
    for (const c of cells) { const col = c % GRID, row = Math.floor(c / GRID); minC = Math.min(minC, col); maxC = Math.max(maxC, col); minR = Math.min(minR, row); maxR = Math.max(maxR, row); }
    const midY = ((minR + maxR + 1) / 2) * C.cell;
    // exaggerated amplitude — the line fills most of its band
    const amp = (maxR - minR + 1) * C.cell * (0.46 + 0.42 * s.n);
    ctx.strokeStyle = C.pal[i]; ctx.lineWidth = Math.max(1.6, C.cell * 0.26);
    ctx.lineJoin = 'round'; ctx.beginPath();
    const pts = Math.max(8, (maxC - minC) * 2);
    const kind = i % 3; // 0 = jagged spike graph, 1 = sharp sawtooth, 2 = flowing wave
    for (let k = 0; k <= pts; k++) {
      const f = k / pts;
      const x = (minC + (maxC - minC) * f) * C.cell + C.cell / 2;
      let v;
      if (kind === 0) {
        // momentum spikes: a noisy spike graph that ran through the game
        const spike = (ps(k + i * 53, C.baseSeed) - 0.5) * 2;
        v = spike * (0.55 + 0.45 * Math.sin(k * 1.9 + C.tt * 2.2));
      } else if (kind === 1) {
        // sawtooth bursts
        v = (((k * 0.5 + C.tt) % 2) - 1) * (0.6 + 0.4 * Math.sin(k * 0.7 + i));
      } else {
        v = 0.7 * Math.sin(k * 0.6 + C.tt * 2 + i) + 0.3 * Math.sin(k * 1.7 - C.tt * 1.4);
      }
      const y = midY + amp * Math.max(-1, Math.min(1, v));
      k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  });
}
// chevron bands — zigzag rows per band, row count scales with the stat
function cChevron(ctx, C) {
  const { cellsByRegion } = bandsH(C.neg, 11);
  cellsByRegion.forEach((cells, i) => {
    if (!cells.length) return;
    const s = C.stats[i];
    let minC = 99, maxC = 0, minR = 99, maxR = 0;
    for (const c of cells) { const col = c % GRID, row = Math.floor(c / GRID); minC = Math.min(minC, col); maxC = Math.max(maxC, col); minR = Math.min(minR, row); maxR = Math.max(maxR, row); }
    const h = (maxR - minR + 1) * C.cell, top = minR * C.cell;
    const rows = Math.max(1, Math.round(1 + s.n * 3));
    ctx.strokeStyle = C.pal[i]; ctx.lineWidth = Math.max(1.4, C.cell * 0.3);
    const step = C.cell;
    for (let rr = 0; rr < rows; rr++) {
      const yBase = top + ((rr + 0.5) * h) / rows, amp = (h / rows) * 0.4;
      ctx.beginPath();
      let first = true;
      const march = Math.floor(C.tt * 3) % 2; // the zigzag marches sideways
      for (let x = minC * C.cell; x <= (maxC + 1) * C.cell; x += step) {
        const up = (Math.round((x - minC * C.cell) / step) + march) % 2 === 0;
        const y = yBase + (up ? -amp : amp);
        first ? (ctx.moveTo(x, y), first = false) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  });
}

export const FIELD_CONCEPTS = [
  { key: 'scatter', label: 'scatter', fn: cScatter, g: 'region' },
  { key: 'bars', label: 'bars', fn: cBars, g: 'columnsV' },
  { key: 'capsules', label: 'capsules', fn: cCapsules, g: 'region' },
  { key: 'tiles', label: 'tiles', fn: cPatternTiles, g: 'region' },
  { key: 'forest', label: 'forest', fn: cTriangleForest, g: 'region' },
  { key: 'rows', label: 'rows', fn: cMarchingRows, g: 'bandsH' },
  { key: 'plus', label: 'plus', fn: cPlusField, g: 'region' },
  { key: 'hatch', label: 'hatch', fn: cHatchClusters, g: 'region' },
  { key: 'blocks', label: 'blocks', fn: cColorBlocks, g: 'region' },
  { key: 'mosaic', label: 'mosaic', fn: cMixedMosaic, g: 'region' },
  { key: 'rings', label: 'rings', fn: cRings, g: 'region' },
  { key: 'halftone', label: 'halftone', fn: cHalftone, g: 'region' },
  { key: 'glitch', label: 'glitch', fn: cGlitch, g: 'columnsV' },
  { key: 'nodes', label: 'nodes', fn: cNodes, g: 'region' },
  { key: 'histogram', label: 'histogram', fn: cHistogram, g: 'bandsH' },
  { key: 'squares', label: 'squares', fn: cConcentricSquares, g: 'region' },
  { key: 'contour', label: 'contour', fn: cContour, g: 'region' },
  { key: 'truchet', label: 'truchet', fn: cTruchet, g: 'region' },
  { key: 'matrix', label: 'matrix', fn: cDotMatrix, g: 'region' },
  { key: 'sparkline', label: 'sparkline', fn: cSparkline, g: 'bandsH' },
  { key: 'chevron', label: 'chevron', fn: cChevron, g: 'bandsH' },
];

// short stat names, in the same order as the 11 stat regions
const STAT_LABELS = ['GOALS', 'SHOTS ON', 'SHOTS', 'CORNERS', 'YELLOW', 'RED', 'OFFSIDE', 'FOULS', 'VAR', 'POSS', 'PASSES'];

// trace the outline of a cluster (cell edges where the neighbour isn't in it)
function strokeGroup(ctx, cells, cell, color, lw) {
  if (!cells || cells.length < 3) return;
  const g = new Set(cells);
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineJoin = 'round';
  ctx.beginPath();
  for (const c of cells) {
    const col = c % GRID, row = Math.floor(c / GRID), x = col * cell, y = row * cell;
    if (!g.has(c - GRID)) { ctx.moveTo(x, y); ctx.lineTo(x + cell, y); }
    if (!g.has(c + GRID)) { ctx.moveTo(x, y + cell); ctx.lineTo(x + cell, y + cell); }
    if (col === 0 || !g.has(c - 1)) { ctx.moveTo(x, y); ctx.lineTo(x, y + cell); }
    if (col === GRID - 1 || !g.has(c + 1)) { ctx.moveTo(x + cell, y); ctx.lineTo(x + cell, y + cell); }
  }
  ctx.stroke();
}

// a small dark-pill stat label snapped to the cluster's centroid cell
function labelGroup(ctx, cells, cell, text) {
  if (!cells || cells.length < 7) return;
  const [cc, cr] = centroid(cells);
  const x = (Math.round(cc) + 0.5) * cell, y = (Math.round(cr) + 0.5) * cell;
  const fs = Math.max(7, Math.round(cell * 0.6));
  ctx.font = `700 ${fs}px ui-monospace, "Courier New", monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(text).width, padX = cell * 0.3, h = fs + cell * 0.34;
  ctx.fillStyle = 'rgba(0,0,0,0.74)';
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x - w / 2 - padX, y - h / 2, w + padX * 2, h, h / 2); ctx.fill(); }
  else ctx.fillRect(x - w / 2 - padX, y - h / 2, w + padX * 2, h);
  ctx.fillStyle = '#ffffff'; ctx.fillText(text, x, y);
}

// Negative-space substrate: every cell the logo does NOT fill gets a faint,
// grid-aligned wash in its region's colour — stronger nearest the logo, fading
// toward the canvas edge. This locks the field to the logo's inverse on one
// shared 32×32 grid, so the two read as a single symbol instead of a texture
// floating behind a mark. The concept texture then rides on top of this.
function drawNegSubstrate(ctx, C, groups) {
  const regionOf = new Int16Array(GRID * GRID).fill(-1);
  groups.forEach((cells, i) => { for (const c of cells) regionOf[c] = i; });
  // logo centroid → radial falloff so the field hugs the mark
  let sx = 0, sy = 0, n = 0;
  for (let idx = 0; idx < GRID * GRID; idx++) if (C.set.has(idx + 1)) { sx += idx % GRID; sy += Math.floor(idx / GRID); n++; }
  const cx = n ? sx / n : GRID / 2, cy = n ? sy / n : GRID / 2;
  const maxd = Math.hypot(GRID, GRID) / 2;
  const inset = Math.max(0.4, C.cell * 0.05);
  for (const c of C.neg) {
    const ri = regionOf[c]; if (ri < 0) continue;
    const d = Math.hypot((c % GRID) - cx, Math.floor(c / GRID) - cy) / maxd;
    const a = 0.22 * (1 - 0.72 * d);
    if (a <= 0.012) continue;
    ctx.globalAlpha = a;
    ctx.fillStyle = C.pal[ri];
    const [x, y] = XY(c, C.cell);
    ctx.fillRect(x + inset, y + inset, C.cell - inset * 2, C.cell - inset * 2);
  }
  ctx.globalAlpha = 1;
}

// faint ambient outline elements scattered through the negative space — rings,
// squares, plus marks and ticks (the blueprint/technical feel from the refs).
// Pure background structure: low alpha, neutral, never competes with the logo.
function drawOutlineBackdrop(ctx, C) {
  const cell = C.cell;
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = Math.max(1, cell * 0.06);
  for (const idx of C.neg) {
    if (ps(idx, C.baseSeed + 900) > 0.12) continue; // sparse
    const x = (idx % GRID) * cell, y = Math.floor(idx / GRID) * cell, cx = x + cell / 2, cy = y + cell / 2;
    const k = Math.floor(ps(idx, C.baseSeed + 901) * 4);
    ctx.beginPath();
    if (k === 0) { ctx.arc(cx, cy, cell * 0.33, 0, Math.PI * 2); ctx.stroke(); }
    else if (k === 1) { ctx.strokeRect(x + cell * 0.2, y + cell * 0.2, cell * 0.6, cell * 0.6); }
    else if (k === 2) { ctx.moveTo(cx - cell * 0.3, cy); ctx.lineTo(cx + cell * 0.3, cy); ctx.moveTo(cx, cy - cell * 0.3); ctx.lineTo(cx, cy + cell * 0.3); ctx.stroke(); }
    else { ctx.moveTo(cx, cy - cell * 0.3); ctx.lineTo(cx, cy + cell * 0.3); ctx.stroke(); }
  }
}

// outline every cluster + label it, so you can read which stat is which
function drawClusterChrome(ctx, C, groups) {
  for (let i = 0; i < groups.length; i++) strokeGroup(ctx, groups[i], C.cell, 'rgba(255,255,255,0.42)', Math.max(1, C.cell * 0.06));
  for (let i = 0; i < groups.length; i++) labelGroup(ctx, groups[i], C.cell, STAT_LABELS[i]);
}

// regionsKMeans is deterministic per logo; cache so animation frames are cheap
let _regionCache = { key: '', regions: null };
function cachedRegions(neg) {
  const key = neg.length + ':' + (neg[0] ?? -1) + ':' + (neg[neg.length - 1] ?? -1);
  if (_regionCache.key !== key) _regionCache = { key, regions: regionsKMeans(neg, 11).cellsByRegion };
  return _regionCache.regions;
}

// Player numbers in the field: every player who took the field gets their
// shirt number ONCE (small, dim, dark-backed for legibility); goal scorers get
// a bigger glowing white hero token. Drawn on top of the stat clusters.
function drawRoster(ctx, C, roster) {
  if (!roster || !roster.length) return;
  const cell = C.cell;
  // stable placement (baseSeed) so numbers stay put while the field animates
  const order = C.neg.slice().sort((a, b) => ps(a, C.baseSeed + 555) - ps(b, C.baseSeed + 555));
  const used = new Set();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

  // scorers — unique numbers, big glowing hero tokens
  const scorers = [];
  for (const p of roster) if (p.scored && p.num != null && !scorers.includes(p.num)) scorers.push(p.num);
  let gi = 0;
  for (const num of scorers) {
    const digits = String(num), dbl = digits.length > 1;
    for (let scan = 0; scan < order.length; scan++) {
      const idx = order[(gi + scan) % order.length];
      if (used.has(idx)) continue;
      const [x, y] = XY(idx, cell);
      ctx.save();
      ctx.shadowColor = 'rgba(255,255,255,0.95)'; ctx.shadowBlur = cell * 0.7;
      ctx.fillStyle = 'rgba(0,0,0,0.42)'; ctx.fillRect(x, y, cell, cell);
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 ${Math.round(cell * 0.86)}px "Courier New", ui-monospace, monospace`;
      ctx.translate(x + cell / 2, y + cell / 2 + cell * 0.03);
      // stay faithful to the grid — a number occupies exactly ONE cell
      ctx.scale(dbl ? 0.6 : 1, 1);
      ctx.fillText(digits, 0, 0);
      ctx.restore();
      used.add(idx);
      break;
    }
    gi += 5;
  }

  // everyone else who played — small, dim, once each
  let ci = 0;
  for (const p of roster) {
    if (p.scored || p.num == null) continue;
    const digits = String(p.num), dbl = digits.length > 1;
    for (let scan = 0; scan < order.length; scan++) {
      const idx = order[(ci + scan) % order.length];
      if (used.has(idx)) continue;
      const [x, y] = XY(idx, cell);
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.34)'; ctx.fillRect(x, y, cell, cell);
      ctx.fillStyle = 'rgba(255,255,255,0.82)';
      ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = cell * 0.18;
      ctx.font = `bold ${Math.round(cell * 0.72)}px "Courier New", ui-monospace, monospace`;
      ctx.translate(x + cell / 2, y + cell / 2 + cell * 0.03);
      if (dbl) ctx.scale(0.6, 1);
      ctx.fillText(digits, 0, 0);
      ctx.restore();
      used.add(idx);
      ci += 7;
      break;
    }
  }
}

/** Render the negative-space stat field. `pixels` are the logo's 0-based grid
 *  indices (the cells the field must avoid). */
export function renderField(canvas, pixels, opts = {}) {
  const cell = opts.cell || 16;
  const dpr = opts.forExport ? 1 : Math.min(window.devicePixelRatio || 1, 3);
  const W = GRID * cell, H = GRID * cell;
  canvas.width = W * dpr; canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);
  if (opts.bg && opts.bg !== 'rgba(0,0,0,0)') { ctx.fillStyle = opts.bg; ctx.fillRect(0, 0, W, H); }

  const set = new Set((pixels || []).map((v) => v + 1)); // 1-based logo cells
  const neg = [];
  for (let idx = 0; idx < GRID * GRID; idx++) if (!set.has(idx + 1)) neg.push(idx);

  const concept = FIELD_CONCEPTS.find((c) => c.key === opts.concept) || FIELD_CONCEPTS[0];
  const base = (opts.seed || 1) | 0;
  const t = opts.time || 0;
  const mode = opts.palette || 'team';
  const stats = statValues(opts.stats);
  const C = {
    cell, neg, set, stats,
    // muted, recessive palette in the chosen mood (team / bw / spectrum)
    pal: paletteRGB(mode, opts.colors).map((c) => muteRgb(c, mode === 'spectrum' || mode === 'color' ? 0.36 : mode === 'bw' || mode === 'gray' ? 0.42 : 0.48)),
    // FLUID regions (organic, value-weighted) that drift over time when animating
    regions: opts.animate ? fluidRegions(neg, stats, base, t) : cachedFluid(neg, stats, base),
    animate: !!opts.animate,
    t,
    tt: t,
    // stable seed — smooth motion comes from the drifting regions + sine phases,
    // NOT from reshuffling (that read as frame-switching)
    seed: base,
    baseSeed: base,
  };
  // the cell-grouping the active concept uses (shared by substrate + chrome so
  // the negative-space wash, the texture, and the outlines all agree)
  const groups = concept.g === 'bandsH' ? bandsH(neg, 11).cellsByRegion
    : concept.g === 'columnsV' ? columnsV(neg, 11).cellsByRegion
      : C.regions;
  ctx.lineJoin = 'round';
  // ambient outline structure sits behind everything…
  drawOutlineBackdrop(ctx, C);
  // …a grid-aligned wash fills the negative space (the logo's inverse)…
  drawNegSubstrate(ctx, C, groups);
  // …the stat fills ride at reduced opacity so the logo stays dominant…
  ctx.globalAlpha = 0.78;
  concept.fn(ctx, C);
  ctx.globalAlpha = 1;
  // …outlines, labels and player numbers stay crisp on top.
  if (opts.labels !== false) {
    drawClusterChrome(ctx, C, groups);
  }
  if (opts.roster) drawRoster(ctx, C, opts.roster);
}
