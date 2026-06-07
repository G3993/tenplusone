import { useRef, useEffect } from 'react';
import { drawSpectrumCrest, drawOutlineCells, drawPassNetwork, type PixelShape, type MotifVariant } from './spectrumMotif';
import { useThemeStore } from '../../stores/theme';

interface SpectrumCrestProps {
  /** 0-based grid indices forming the crest silhouette. */
  pixels: number[];
  seed: number;
  /** Shared animation frame (0..FRAMES-1) so many crests animate in lockstep. */
  frame: number;
  /** CSS display size in px (square). Internal canvas snaps to a crisp 32x grid. */
  size: number;
  shape?: PixelShape;
  /** Color treatment: full spectrum (default), grayscale B&W, or outlines. */
  variant?: MotifVariant;
  className?: string;
}

const OUTLINE_PERIOD_MS = 6400; // one full lap of the pass network (slow glide)
const OUTLINE_FPS_MS = 1000 / 30; // throttle the rAF redraw

export function SpectrumCrest({ pixels, seed, frame, size, shape = 'square', variant = 'spectrum', className }: SpectrumCrestProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const theme = useThemeStore((s) => s.theme);

  // Outlines have squiggly connector lines; circles have curves. Both need the
  // supersample + smooth downscale that crisp square pixels don't.
  const smooth = shape === 'circle' || variant === 'outline';

  // Spectrum / B&W — redraws in lockstep with the shared frame counter.
  useEffect(() => {
    if (variant === 'outline') return;
    const cv = ref.current;
    if (!cv) return;
    const base = Math.max(1, Math.round(size / 32));
    const cell = shape === 'circle' ? Math.max(8, base * 4) : base;
    const px = cell * 32;
    if (cv.width !== px) { cv.width = px; cv.height = px; }
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, px, px);
    drawSpectrumCrest(ctx, pixels, seed, frame, cell, shape, variant);
  }, [pixels, seed, frame, size, shape, variant, theme]);

  // Outlines — own rAF loop for smooth gliding dots. The hollow cells are
  // static, so they're rendered once into an offscreen layer and blitted each
  // frame; only the pass network is recomputed.
  useEffect(() => {
    if (variant !== 'outline') return;
    const cv = ref.current;
    if (!cv) return;
    const base = Math.max(1, Math.round(size / 32));
    const cell = shape === 'circle' ? Math.max(8, base * 4) : Math.max(6, base * 3);
    const px = cell * 32;
    if (cv.width !== px) { cv.width = px; cv.height = px; }
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const stroke = theme === 'dark' ? '#ffffff' : '#000000';
    const green = theme === 'dark' ? '#4ade80' : '#16a34a';

    const layer = document.createElement('canvas');
    layer.width = px;
    layer.height = px;
    const lctx = layer.getContext('2d');
    if (lctx) drawOutlineCells(lctx, pixels, cell, shape, stroke);

    let raf = 0;
    let start: number | undefined;
    let last = -Infinity;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (start === undefined) start = t;
      if (t - last < OUTLINE_FPS_MS) return;
      last = t;
      const phase = (((t - start) / OUTLINE_PERIOD_MS) % 1 + 1) % 1;
      ctx.clearRect(0, 0, px, px);
      ctx.drawImage(layer, 0, 0);
      drawPassNetwork(ctx, pixels, seed, phase, cell, shape, green, stroke);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [pixels, seed, size, shape, variant, theme]);

  return (
    <canvas
      ref={ref}
      className={className}
      style={{
        width: size,
        height: size,
        // Crisp for square pixels; smooth downscale for supersampled curves/lines.
        imageRendering: smooth ? 'auto' : 'pixelated',
        display: 'block',
      }}
    />
  );
}
