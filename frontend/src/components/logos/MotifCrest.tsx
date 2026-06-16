import { useRef, useEffect } from 'react';
import { useThemeStore } from '../../stores/theme';
import { setMotif, setMotifDark, setMotifShape, setMotifSeed, renderMotif } from './motifEngine';
import styles from './MotifCrest.module.css';

// Animated crest for the ported generator motifs (lines, nets, 3D, team
// colors, sweep, pattern, abstract, internet). Drives the shared 2D engine on
// its own throttled rAF loop, like SpectrumCrest's outline path.
//
// `spin` mode: paint the crest once (no rAF) and rotate it in 3D via a GPU CSS
// transform — cheap enough to run on every team in the home group list at once.

export type MotifId = 'solid' | 'lines' | 'mesh' | 'cube' | 'teamColors' | 'team3d' | 'sweep' | 'pattern' | 'abstract' | 'internet' | 'chrome' | 'bauhaus' | 'stats' | 'regions';

interface MotifCrestProps {
  /** 0-based grid indices (site convention). Shifted +1 for the engine's 1-based grid. */
  pixels: number[];
  seed: number;
  /** CSS display size in px (square). */
  size: number;
  motif: MotifId;
  shape?: 'square' | 'circle';
  teamId: string;
  /** Spin the crest in 3D (paints once, rotates via CSS). For the home grid. */
  spin?: boolean;
  /** Paint a single static frame — no rAF loop, no spin. A still neon crest. */
  still?: boolean;
  /** Per-crest stat line for the 'stats' motif: glyph counts equal these real
   *  numbers (2 goals → exactly 2 balls) instead of the global engine feed. */
  stats?: Record<string, number>;
  /** ASCII number layer for the 'stats' motif: shirt number per player who
   *  played, scorers rendered wider + bright. */
  roster?: Array<{ num: number | null; scored?: boolean; name?: string }>;
  /** Draw the game-stats overlay (glyphs + numbers) on top of this style —
   *  lets any treatment carry the match's box score, not just 'stats'. */
  statsOverlay?: boolean;
  /** Where the stat overlay lives: on the logo (inside), the negative space
   *  around it (outside), the enclosed negative space inside the mark (holes),
   *  or everywhere (both). */
  statPlacement?: 'inside' | 'outside' | 'holes' | 'both';
  className?: string;
}

const FPS_MS = 1000 / 14; // throttle — many of these animate at once on the grid

export function MotifCrest({ pixels, seed, size, motif, shape = 'square', teamId, spin = false, still = false, stats, roster, statsOverlay = false, statPlacement = 'inside', className }: MotifCrestProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    // The engine's 1-based grid: cell (c,r) is on when (r*32+c+1) is in the set,
    // so the site's 0-based indices map by +1.
    const enginePixels = pixels.map((v) => v + 1);
    const cell = Math.max(3, Math.round(size / 32));

    const paint = (time: number, animate: boolean) => {
      setMotif(motif);
      setMotifDark(theme === 'dark');
      setMotifShape(shape);
      // B&W ('solid') and the ASCII 'internet' effect animate by reshuffling
      // their patch styles — the generator bumps fillSeed every 450ms; mirror
      // that here so they visibly morph.
      setMotifSeed(
        (motif === 'solid' || motif === 'internet') && animate
          ? seed + Math.floor(time / 0.45)
          : seed,
      );
      renderMotif(cv, enginePixels, {
        cell, off: 'rgba(0,0,0,0)', bg: 'rgba(0,0,0,0)', applyFill: true,
        teamId, time, animate, stats, roster, statsOverlay, statPlacement,
      });
      cv.style.width = size + 'px';
      cv.style.height = size + 'px';
    };

    // Spin mode: single paint, CSS handles the motion. Still mode: single
    // static paint, no motion at all.
    if (spin || still) { paint(0, false); return; }

    // Otherwise: self-driven, throttled animation loop.
    let raf = 0;
    let start: number | undefined;
    let last = -Infinity;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (start === undefined) start = t;
      if (t - last < FPS_MS) return;
      last = t;
      paint((t - start) / 1000, true);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [pixels, seed, size, motif, shape, teamId, theme, spin, still, stats, roster, statsOverlay, statPlacement]);

  if (spin) {
    // Vary speed + phase per team so they don't rotate in lockstep.
    const dur = 4.4 + (seed % 5) * 0.6;
    const delay = -((seed % 41) / 10);
    return (
      <span className={`${styles.spinWrap} ${className ?? ''}`} style={{ width: size, height: size }}>
        <canvas
          ref={ref}
          className={styles.spin}
          style={{ width: size, height: size, display: 'block', animationDuration: `${dur}s`, animationDelay: `${delay}s` }}
          aria-hidden="true"
        />
      </span>
    );
  }

  return <canvas ref={ref} className={className} style={{ width: size, height: size, display: 'block' }} aria-hidden="true" />;
}
