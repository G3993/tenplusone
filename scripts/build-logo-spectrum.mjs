#!/usr/bin/env node
// Spectrum-logo export system.
//
// Renders each team's crest in the "spectrum" motif (frame 0, square pixels) to
// a transparent PNG, written alongside the other logo packages under
// public/logos/spectrum/<slug>.png. Pure Node — a minimal PNG encoder on top of
// the built-in zlib, so there are no native canvas/sharp dependencies.
//
// Faithful port of frontend/src/components/logos/spectrumMotif.ts
// (drawSpectrumCrest, square variant). Re-run after any crest/palette change.
//
//   node scripts/build-logo-spectrum.mjs

import { deflateSync } from 'node:zlib';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const LOGO_DIR = join(ROOT, 'frontend/src/data/team-logos');
const OUT_DIR = join(ROOT, 'frontend/public/logos/spectrum');

// Build slug -> pixel array by mirroring index.ts's REAL_LOGOS map. Each team
// file exports `<VAR>_PIXELS = [ ... ]`; index.ts maps a slug to that var.
function loadPixels() {
  // 1. VAR name -> number[] across every team file.
  const varToArr = {};
  for (const f of readdirSync(LOGO_DIR)) {
    if (!f.endsWith('.ts') || f === 'index.ts') continue;
    const src = readFileSync(join(LOGO_DIR, f), 'utf8');
    const m = src.match(/export const (\w+)\s*:\s*number\[\]\s*=\s*\[([\d,\s]*)\]/);
    if (!m) continue;
    varToArr[m[1]] = m[2].split(',').map((s) => parseInt(s, 10)).filter((n) => !Number.isNaN(n));
  }
  // 2. slug -> VAR from the REAL_LOGOS block in index.ts.
  const idx = readFileSync(join(LOGO_DIR, 'index.ts'), 'utf8');
  const block = idx.slice(idx.indexOf('REAL_LOGOS'), idx.indexOf('export function getLogoPixels'));
  const out = {};
  for (const m of block.matchAll(/['"]?([a-z-]+)['"]?\s*:\s*(\w+_PIXELS)/g)) {
    const [, slug, varName] = m;
    if (slug === 'slug') continue; // a stray placeholder line in the map
    if (varToArr[varName]) out[slug] = varToArr[varName];
  }
  return out;
}

const GRID = 32;
const FRAMES = 8;
const CELL = 64;              // px per grid cell → 2048×2048 image
const SIZE = GRID * CELL;

const SPECTRUM_COLORS = ['#ff003c', '#ff7a00', '#ffe600', '#00d084', '#00e5ff', '#0057ff', '#050505'];
const YELLOWS = new Set(['#f5bd19', '#ffcd00', '#ffce00', '#f1bf00', '#ffe600']);

function teamSeed(id) {
  let total = 0;
  for (let i = 0; i < id.length; i++) total += id.charCodeAt(i);
  return total;
}

function patternSeed(index, seed) {
  const x = index % GRID;
  const y = (index / GRID) | 0;
  const a = (x * 73856093) >>> 0;
  const b = (y * 19349663) >>> 0;
  const c = (seed * 83492791) >>> 0;
  const v = (a ^ b ^ c) | 0;
  return Math.abs(v);
}

function hexToRgb(hex) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

function renderCrest(onCells, seed) {
  const buf = new Uint8Array(SIZE * SIZE * 4); // RGBA, transparent default

  const fillRect = (x0, y0, x1, y1, [r, g, b]) => {
    const xa = Math.max(0, Math.round(x0));
    const xb = Math.min(SIZE, Math.round(x1));
    const ya = Math.max(0, Math.round(y0));
    const yb = Math.min(SIZE, Math.round(y1));
    for (let y = ya; y < yb; y++) {
      let o = (y * SIZE + xa) * 4;
      for (let x = xa; x < xb; x++) {
        buf[o] = r; buf[o + 1] = g; buf[o + 2] = b; buf[o + 3] = 255;
        o += 4;
      }
    }
  };

  for (const index of onCells) {
    const cx = (index % GRID) * CELL;
    const cy = ((index / GRID) | 0) * CELL;
    const color = SPECTRUM_COLORS[(index + seed) % SPECTRUM_COLORS.length];
    fillRect(cx, cy, cx + CELL, cy + CELL, hexToRgb(color));

    const ps = patternSeed(index, seed);
    const base = ps % 4 === 0 ? 'slash' : 'plain';
    const phase = ps % FRAMES;
    const useAlt = (0 + phase) % FRAMES >= FRAMES / 2;
    const motif = useAlt ? (base === 'plain' ? 'slash' : 'plain') : base;
    if (motif === 'slash') {
      const slash = YELLOWS.has(color) ? '#050505' : '#00e5ff';
      const rgb = hexToRgb(slash);
      const step = Math.max(1, CELL / 6);
      for (let off = -CELL; off < CELL * 2; off += step * 2) {
        const x0 = Math.max(cx, cx + off);
        const x1 = Math.min(cx + CELL, cx + off + step);
        if (x1 > x0) fillRect(x0, cy, x1, cy + CELL, rgb);
      }
    }
  }
  return buf;
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (~c) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(rgba, size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(rgba.buffer, y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const pixels = loadPixels();
mkdirSync(OUT_DIR, { recursive: true });

const slugs = Object.keys(pixels).sort();
let count = 0;
for (const slug of slugs) {
  const onCells = pixels[slug];
  if (!Array.isArray(onCells) || !onCells.length) {
    console.warn(`  skip ${slug} (no pixel data)`);
    continue;
  }
  const png = encodePng(renderCrest(onCells, teamSeed(slug)), SIZE);
  writeFileSync(join(OUT_DIR, `${slug}.png`), png);
  count++;
}

console.log(`spectrum logos: wrote ${count}/${slugs.length} → public/logos/spectrum/ (${SIZE}×${SIZE})`);
