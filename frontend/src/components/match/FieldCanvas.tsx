import { useRef, useEffect } from 'react';
import { renderField } from '../logos/fieldEngine';

/** The generative stat "field" that lives in the negative space behind the
 *  logo — its own canvas layer of depth. Same pixel pitch as the crest so the
 *  field cells line up with the blueprint grid and the logo. */
export function FieldCanvas({ pixels, size, concept, stats, colors, seed, roster, palette, animate = true }: {
  /** logo's 0-based grid indices (the field renders the cells NOT in here). */
  pixels: number[];
  size: number;
  concept: string;
  stats?: Record<string, number>;
  colors?: string[];
  seed: number;
  /** the XI + subs who played; scorers flagged — drawn as numbers in the field */
  roster?: Array<{ num: number | null; scored?: boolean }>;
  /** colour mood: 'team' | 'bw' | 'spectrum' */
  palette?: string;
  /** when false the field is a single static frame (play/pause gates it) */
  animate?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const cell = Math.max(3, Math.round(size / 32));
    cv.style.width = size + 'px';
    cv.style.height = size + 'px';
    const opts = { cell, concept, stats, colors, seed, roster, palette, bg: 'rgba(0,0,0,0)' };

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (reduce || !animate) { renderField(cv, pixels, opts); return; }

    // throttled rAF loop — the field breathes/flows; ~14fps is plenty and cheap
    let raf = 0, start: number | undefined, last = -Infinity;
    const FPS = 1000 / 14;
    const loop = (ts: number) => {
      raf = requestAnimationFrame(loop);
      if (start === undefined) start = ts;
      if (ts - last < FPS) return;
      last = ts;
      renderField(cv, pixels, { ...opts, time: (ts - start) / 1000, animate: true });
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [pixels, size, concept, stats, colors, seed, roster, palette, animate]);

  return <canvas ref={ref} style={{ width: size, height: size, display: 'block' }} aria-hidden="true" />;
}
