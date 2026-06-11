import { useEffect, useRef } from 'react';
import { useThemeStore } from '../../stores/theme';

// Homepage background: a solid mid-gray grid that warps away from the cursor
// like a lens pressing into a mesh — and under the finger on touch devices.
// Fixed full-viewport canvas behind the content (zIndex -1, no pointer
// events). The warp center snaps to the pointer on entry and tracks it with a
// tight ease; when the pointer leaves, the bulge relaxes flat IN PLACE (the
// strength fades) rather than sliding away. Static under
// prefers-reduced-motion.

const CELL = 14;        // grid cell size, px
const RADIUS = 165;     // warp falloff radius, px
const STRENGTH = 32;    // max vertex displacement, px
const LINE_DARK = '#343434';  // on the dark theme: lighter gray, more visible
const LINE_LIGHT = '#b0b0aa'; // on the light theme: a touch darker so it reads on paper
const DOT = 1;                // resting dot size, CSS px (grid is dots at vertices)
const DOT_MAX = 3;            // dot size at the center of the warp

export function MeshGridBG() {
  const ref = useRef<HTMLCanvasElement>(null);
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const line = theme === 'light' ? LINE_LIGHT : LINE_DARK;

    let w = 0, h = 0, dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      // Size from the element itself (not window.innerWidth) so the bitmap
      // isn't squashed by the scrollbar — keeps draw coords 1:1 with clientX/Y.
      w = cv.clientWidth;
      h = cv.clientHeight;
      cv.width = w * dpr;
      cv.height = h * dpr;
      settled = false; // repaint after resize
    };

    const mouse = { x: 0, y: 0 }; // pointer target
    const cur = { x: 0, y: 0 };   // eased warp center
    let k = 0;                    // warp strength 0..1 (eased)
    let targetK = 0;
    let settled = false;
    let raf = 0;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const draw = () => {
      // Position tracks the pointer 1:1 (no lag); only the warp strength is
      // eased, so entering/leaving fades the bulge in place.
      cur.x = mouse.x;
      cur.y = mouse.y;
      k += (targetK - k) * 0.12;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = line;

      const r2 = RADIUS * RADIUS;
      const amp = STRENGTH * k;
      // Displaced position + warp intensity (0..1) so dots can grow as they move.
      const warp = (x: number, y: number): [number, number, number] => {
        if (amp < 0.05) return [x, y, 0];
        const dx = x - cur.x, dy = y - cur.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > r2 * 6) return [x, y, 0];
        const g = Math.exp(-d2 / r2);
        const f = g * amp;
        const d = Math.sqrt(d2) || 1;
        return [x + (dx / d) * f, y + (dy / d) * f, g * k];
      };

      // Dot grid: one dot per vertex, displaced by the warp — and swelling
      // with it, so the bulge reads through dot size as well as motion.
      const cols = Math.ceil(w / CELL), rows = Math.ceil(h / CELL);
      for (let j = 0; j <= rows; j++) {
        for (let i = 0; i <= cols; i++) {
          const [px, py, t] = warp(i * CELL, j * CELL);
          const size = DOT + (DOT_MAX - DOT) * t;
          const half = size / 2;
          ctx.fillRect(px - half, py - half, size, size);
        }
      }
    };

    const loop = () => {
      const idle =
        Math.abs(mouse.x - cur.x) < 0.3 &&
        Math.abs(mouse.y - cur.y) < 0.3 &&
        Math.abs(targetK - k) < 0.005;
      if (idle && settled) {
        raf = requestAnimationFrame(loop); // wait cheaply for the next move
        return;
      }
      draw();
      settled = idle;
      raf = requestAnimationFrame(loop);
    };

    const point = (x: number, y: number) => {
      // First contact (or after a full relax): snap the center to the pointer
      // so the bulge appears exactly under it instead of chasing across.
      if (k < 0.02) { cur.x = x; cur.y = y; }
      mouse.x = x;
      mouse.y = y;
      targetK = 1;
      settled = false;
    };
    const release = () => { targetK = 0; settled = false; };

    const onMove = (e: MouseEvent) => point(e.clientX, e.clientY);
    const onLeave = () => release();
    // Touch: warp under the finger while it's down (passive — the page still
    // scrolls normally), relax flat when it lifts.
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) point(t.clientX, t.clientY);
    };
    const onTouchEnd = () => release();

    resize();
    if (reduced) {
      // Static grid only — no listeners, no loop.
      draw();
      window.addEventListener('resize', () => { resize(); draw(); });
      return;
    }
    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    window.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('touchstart', onTouch);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', resize);
    };
  }, [theme]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: -1, pointerEvents: 'none' }}
    />
  );
}
