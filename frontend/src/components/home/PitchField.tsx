import { useRef, useEffect } from 'react';
import { useThemeStore } from '../../stores/theme';
import styles from './PitchField.module.css';

// A retro perspective pitch: a starfield sky and a bounded grid floor whose
// lines recede toward a goal on the far end-of-field line. The lines animate
// toward the goal and stop at the field line. Follows the site theme.

type Star = { x: number; y: number; r: number; color: string; phase: number };

const STAR_COLORS_DARK = ['#ffffff', '#9bb8ff', '#4ade80', '#b48cff', '#7a7a7a', '#ffd166'];
const STAR_COLORS_LIGHT = ['#2a2a2a', '#3b5bdb', '#15803d', '#7c3aed', '#777777', '#b8860b'];

// Deterministic PRNG so the starfield is stable across renders.
function mulberry32(a: number): () => number {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function PitchField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const dark = theme !== 'light';
    const bgCol = dark ? '#000000' : '#f4f4f1';
    const line = '#a3a3a3';  // every line: one light gray
    const lw = 1.2;          // every line: one width
    const starColors = dark ? STAR_COLORS_DARK : STAR_COLORS_LIGHT;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let stars: Star[] = [];
    let w = 0, h = 0, dpr = 1;

    const buildStars = () => {
      const rng = mulberry32(0x1f0c7a);
      const endY = h * 0.42;
      const n = Math.round((w * endY) / 9000);
      stars = Array.from({ length: Math.max(18, Math.min(70, n)) }, () => ({
        x: rng() * w,
        y: rng() * endY * 0.9,
        r: 1 + rng() * 2.2,
        color: starColors[Math.floor(rng() * starColors.length)],
        phase: rng() * Math.PI * 2,
      }));
    };

    const resize = () => {
      const rect = cv.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = rect.width;
      h = rect.height;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildStars();
    };

    const draw = (t: number) => {
      const cx = w / 2;
      const vpY = h * 0.20;          // vanishing point, up in the sky
      const endY = h * 0.42;         // end-of-field line (far edge of the pitch)
      const nearY = h * 0.80;        // near edge — leaves space below so the pitch sits back
      const bottomHalf = w * 0.46;   // field half-width at the near edge
      const halfAt = (y: number) => bottomHalf * (y - vpY) / (nearY - vpY);
      const halfEnd = halfAt(endY);

      // ---- background (flat, no gradient) ------------------------------
      ctx.fillStyle = bgCol;
      ctx.fillRect(0, 0, w, h);

      // ---- stars -------------------------------------------------------
      for (const s of stars) {
        const tw = reduce ? 0.85 : 0.55 + 0.45 * Math.sin(t / 900 + s.phase);
        ctx.globalAlpha = tw;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // ---- grid lines (bounded by the end-of-field + near lines) -------
      ctx.lineWidth = lw;
      ctx.strokeStyle = line;

      // vertical lines: from the near edge up to the field line, converging
      const COLS = 8;
      for (let c = -COLS; c <= COLS; c++) {
        const xb = cx + (c / COLS) * bottomHalf;
        const xe = cx + (c / COLS) * halfEnd;
        ctx.beginPath();
        ctx.moveTo(xb, nearY);
        ctx.lineTo(xe, endY);
        ctx.stroke();
      }

      // horizontal lines: span the field width at their depth, scrolling
      // toward the goal (away from the viewer) and stopping at the field line.
      const ROWS = 14;
      const fieldDepth = nearY - endY;
      const scroll = reduce ? 0 : (t / 9000) % 1;
      for (let i = 0; i < ROWS; i++) {
        const f = (((i / ROWS) - scroll) % 1 + 1) % 1; // 0 = far, 1 = near
        const y = endY + fieldDepth * (f * f);
        const half = halfAt(y);
        ctx.beginPath();
        ctx.moveTo(cx - half, y);
        ctx.lineTo(cx + half, y);
        ctx.stroke();
      }

      // ---- pitch markings (18-yard box, 6-yard box, penalty spot) ------
      // Defined by grid column/row indices so the box sides land exactly on
      // grid columns and the fronts sit at grid-row depths.
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      const rowY = (row: number) => endY + fieldDepth * (row / ROWS) * (row / ROWS);
      const boxByGrid = (col: number, row: number) => {
        const frac = col / COLS;
        const yF = rowY(row);
        const hF = halfAt(yF);
        ctx.beginPath();
        ctx.moveTo(cx - frac * halfEnd, endY); // left, on the goal line
        ctx.lineTo(cx - frac * hF, yF);         // left side along a grid column
        ctx.lineTo(cx + frac * hF, yF);         // front line along a grid row
        ctx.lineTo(cx + frac * halfEnd, endY); // right side back to the goal line
        ctx.stroke();
      };
      boxByGrid(6, 7);   // 18-yard box
      boxByGrid(4, 3);   // 6-yard box

      // penalty spot — an ellipse, foreshortened to sit flat on the ground
      const ySpot = rowY(5);
      const spotR = Math.max(1.4, halfAt(ySpot) * 0.016);
      ctx.fillStyle = line;
      ctx.beginPath();
      ctx.ellipse(cx, ySpot, spotR, spotR * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();

      // ---- goal --------------------------------------------------------
      drawGoal(ctx, cx, endY, vpY, halfEnd, line, lw);

      raf = requestAnimationFrame(draw);
    };

    let raf = 0;
    resize();
    raf = requestAnimationFrame(draw);
    const ro = new ResizeObserver(resize);
    ro.observe(cv);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [theme]);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}

/** Goal standing on the end-of-field line, net receding toward the vp. */
function drawGoal(ctx: CanvasRenderingContext2D, cx: number, endY: number, vpY: number, halfEnd: number, line: string, lw: number) {
  const gw = halfEnd * 0.75;  // posts land on grid column 3
  const gh = halfEnd * 0.28;  // shorter than it is wide
  const L = cx - gw / 2, R = cx + gw / 2;
  const topY = endY - gh;

  // net depth: top corners recede toward the vanishing point
  const k = 0.16;
  const back = (x: number, y: number) => ({ x: x + (cx - x) * k, y: y + (vpY - y) * k });
  const btl = back(L, topY);
  const btr = back(R, topY);

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = line;
  ctx.lineWidth = lw;

  // front frame (two posts + crossbar)
  ctx.beginPath();
  ctx.moveTo(L, endY);
  ctx.lineTo(L, topY);
  ctx.lineTo(R, topY);
  ctx.lineTo(R, endY);
  ctx.stroke();

  // net roof receding to the back crossbar (gives subtle depth)
  ctx.beginPath();
  ctx.moveTo(L, topY);
  ctx.lineTo(btl.x, btl.y);
  ctx.lineTo(btr.x, btr.y);
  ctx.lineTo(R, topY);
  ctx.stroke();
}
