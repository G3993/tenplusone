/**
 * Process country SVGs (32x32 pixel-art in rects, cls-2=logo, cls-1=bg).
 *
 * Outputs:
 *  - frontend/public/print/{slug}.png     4500x5400, black silhouette, padded, transparent
 *  - frontend/public/logos/{slug}.svg     black logo, 32x32 viewBox, transparent bg
 *  - frontend/public/logos/white/{slug}.svg  white logo
 *  - frontend/src/data/team-logos/{slug}.ts  pixel index array for PixelGrid
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SRC_DIR = 'C:/Users/nofun/Downloads/Images/COUNTRY_LOGOS_wc';
const ROOT = path.resolve(__dirname, '..');
const PRINT_DIR = path.join(ROOT, 'frontend/public/print');
const LOGO_DIR = path.join(ROOT, 'frontend/public/logos');
const LOGO_WHITE_DIR = path.join(LOGO_DIR, 'white');
const PIXELS_DIR = path.join(ROOT, 'frontend/src/data/team-logos');

const NAME_MAP = {
  'AUSTRALIA': 'australia',
  'belgium': 'belgium',
  'brasil': 'brazil',
  'canada': 'canada',
  'colombia': 'colombia',
  'ecuador': 'ecuador',
  'england': 'england',
  'france': 'france',
  'germany': 'germany',
  'ireland': 'ireland',
  'japan': 'japan',
  'jordan': 'jordan',
  'korea': 'south-korea',
  'mexico': 'mexico',
  'netherland': 'netherlands',
  'newzealand': 'new-zealand',
  'norway': 'norway',
  'panama': 'panama',
  'paraguay': 'paraguay',
  'poland': 'poland',
  'portugal': 'portugal',
  'saudiarabia': 'saudi-arabia',
  'spain_1': 'spain',
  'uruguay': 'uruguay',
  'usa': 'united-states',
};

const GRID = 32;
const PRINT_W = 4500;
const PRINT_H = 5400;
const PRINT_PAD = 0.10;

function ensureDir(d) { fs.mkdirSync(d, { recursive: true }); }
function slugToExportName(slug) {
  return slug.toUpperCase().replace(/-/g, '_') + '_PIXELS';
}

// Parse <style> block → which classes have a non-none fill (the "filled/logo" classes)
function getFilledClasses(svg) {
  const styleBlock = /<style[^>]*>([\s\S]*?)<\/style>/i.exec(svg);
  if (!styleBlock) return new Set();
  const css = styleBlock[1];
  const filled = new Set();
  // Match `.cls-N, .cls-M { ... fill: #xxx ... }` or `.cls-N { fill: #xxx }`
  const ruleRe = /\.([a-zA-Z0-9_-]+(?:\s*,\s*\.[a-zA-Z0-9_-]+)*)\s*\{([^}]*)\}/g;
  let m;
  while ((m = ruleRe.exec(css)) !== null) {
    const selectors = m[1].split(',').map(s => s.trim().replace(/^\./, ''));
    const body = m[2];
    const fillMatch = /fill\s*:\s*([^;]+?)(?:;|$)/i.exec(body);
    if (fillMatch) {
      const val = fillMatch[1].trim().toLowerCase();
      if (val !== 'none' && val !== 'transparent') {
        for (const s of selectors) filled.add(s);
      }
    }
  }
  return filled;
}

// Parse logo rects: any rect whose class is in filledClasses
function parseLogoRects(svg, filledClasses) {
  const rects = [];
  const re = /<rect\b[^>]*\/?>/g;
  let m;
  while ((m = re.exec(svg)) !== null) {
    const tag = m[0];
    const classMatch = /class\s*=\s*"([^"]+)"/.exec(tag);
    if (!classMatch) continue;
    const classes = classMatch[1].split(/\s+/);
    if (!classes.some(c => filledClasses.has(c))) continue;
    const getAttr = (name) => {
      const r = new RegExp(`${name}\\s*=\\s*"([-0-9.]+)"`).exec(tag);
      return r ? parseFloat(r[1]) : 0;
    };
    rects.push({
      x: getAttr('x'),
      y: getAttr('y'),
      w: getAttr('width'),
      h: getAttr('height'),
    });
  }
  return rects;
}

// Given logo rects, figure out the grid: min x,y and cell size (from rect width)
function rectsToPixels(rects) {
  if (!rects.length) return { pixels: [], size: GRID };
  const cell = rects[0].w || 1.41;
  // compute tight bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const r of rects) {
    if (r.x < minX) minX = r.x;
    if (r.y < minY) minY = r.y;
    if (r.x + r.w > maxX) maxX = r.x + r.w;
    if (r.y + r.h > maxY) maxY = r.y + r.h;
  }
  // Build a grid based on original placement (using cell size)
  // Round each rect to integer col/row from the origin (minX, minY)
  const cols = Math.max(1, Math.round((maxX - minX) / cell));
  const rows = Math.max(1, Math.round((maxY - minY) / cell));
  const bitmap = Array.from({ length: rows }, () => new Array(cols).fill(false));
  for (const r of rects) {
    const c = Math.round((r.x - minX) / cell);
    const rr = Math.round((r.y - minY) / cell);
    if (rr >= 0 && rr < rows && c >= 0 && c < cols) bitmap[rr][c] = true;
  }
  // Now fit bitmap into 32x32 canvas, preserving aspect, 2px border
  const target = GRID - 4; // 28
  const scale = Math.min(target / cols, target / rows);
  const fitW = Math.max(1, Math.round(cols * scale));
  const fitH = Math.max(1, Math.round(rows * scale));
  const offX = Math.floor((GRID - fitW) / 2);
  const offY = Math.floor((GRID - fitH) / 2);
  const out = [];
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const sx = x - offX;
      const sy = y - offY;
      if (sx < 0 || sy < 0 || sx >= fitW || sy >= fitH) continue;
      const srcC = Math.floor(sx / scale);
      const srcR = Math.floor(sy / scale);
      if (bitmap[srcR] && bitmap[srcR][srcC]) {
        out.push(y * GRID + x + 1);
      }
    }
  }
  return { pixels: out, cols, rows };
}

function buildCleanSvg(rects, color) {
  // Re-embed only cls-2 rects in a tight 32x32-like viewBox (using cell size 1)
  if (!rects.length) return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"/>';
  const cell = rects[0].w || 1.41;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const r of rects) {
    if (r.x < minX) minX = r.x;
    if (r.y < minY) minY = r.y;
    if (r.x + r.w > maxX) maxX = r.x + r.w;
    if (r.y + r.h > maxY) maxY = r.y + r.h;
  }
  const cols = Math.max(1, Math.round((maxX - minX) / cell));
  const rows = Math.max(1, Math.round((maxY - minY) / cell));
  let body = '';
  for (const r of rects) {
    const c = Math.round((r.x - minX) / cell);
    const rr = Math.round((r.y - minY) / cell);
    body += `<rect x="${c}" y="${rr}" width="1" height="1"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cols} ${rows}" shape-rendering="crispEdges" fill="${color}">${body}</svg>`;
}

async function makePrintPng(blackSvg, outPath) {
  const innerW = Math.round(PRINT_W * (1 - 2 * PRINT_PAD));
  const innerH = Math.round(PRINT_H * (1 - 2 * PRINT_PAD));
  const rendered = await sharp(Buffer.from(blackSvg), { density: 300 }).png().toBuffer({ resolveWithObject: true });
  const meta = rendered.info;
  const scale = Math.min(innerW / meta.width, innerH / meta.height);
  const tgtW = Math.max(1, Math.round(meta.width * scale));
  const tgtH = Math.max(1, Math.round(meta.height * scale));
  const resized = await sharp(rendered.data).resize(tgtW, tgtH, { kernel: 'nearest' }).png().toBuffer();
  await sharp({
    create: {
      width: PRINT_W, height: PRINT_H, channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).composite([{ input: resized, gravity: 'center' }]).png().toFile(outPath);
}

async function process(filename) {
  const base = path.basename(filename, '.svg');
  const slug = NAME_MAP[base];
  if (!slug) { console.warn(`⚠  no mapping for ${base}`); return; }
  const srcPath = path.join(SRC_DIR, filename);
  const svg = fs.readFileSync(srcPath, 'utf-8');

  const filledClasses = getFilledClasses(svg);
  const rects = parseLogoRects(svg, filledClasses);
  if (!rects.length) { console.warn(`⚠  ${slug}: no cls-2 rects`); return; }

  const blackSvg = buildCleanSvg(rects, '#000000');
  const whiteSvg = buildCleanSvg(rects, '#ffffff');

  fs.writeFileSync(path.join(LOGO_DIR, `${slug}.svg`), blackSvg);
  fs.writeFileSync(path.join(LOGO_WHITE_DIR, `${slug}.svg`), whiteSvg);

  await makePrintPng(blackSvg, path.join(PRINT_DIR, `${slug}.png`));

  const { pixels, cols, rows } = rectsToPixels(rects);
  const exportName = slugToExportName(slug);
  fs.writeFileSync(
    path.join(PIXELS_DIR, `${slug}.ts`),
    `export const ${exportName}: number[] = [${pixels.join(',')}];\n`,
  );

  console.log(`✓ ${slug}  rects:${rects.length} grid:${cols}x${rows} px:${pixels.length}`);
}

async function main() {
  ensureDir(PRINT_DIR); ensureDir(LOGO_DIR); ensureDir(LOGO_WHITE_DIR); ensureDir(PIXELS_DIR);
  const files = fs.readdirSync(SRC_DIR).filter(f => f.toLowerCase().endsWith('.svg'));
  for (const f of files) {
    try { await process(f); } catch (e) { console.error(`✗ ${f}:`, e.message); }
  }
}
main();
