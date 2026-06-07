import { useRef, useEffect, useState, type MutableRefObject, type ReactNode } from 'react';
import { PixelGridController } from './PixelGridController.ts';
import styles from './PixelGrid.module.css';

export interface PixelGridProps {
  logoPixels: number[];
  matchMode?: { awayPixels: number[]; switchInterval?: number };
  height?: string;
  className?: string;
  /** Rendered in place of the canvas when WebGL/Three.js init fails (broken
   *  WebGL contexts, locked-down browsers, headless tests). Without this the
   *  controller's throw would unmount the whole React tree under createRoot. */
  fallback?: ReactNode;
  /** Stand the grid upright + orbit the camera around it (instead of the
   *  default tabletop / top-down view). See PixelGridController.billboardMode. */
  billboardMode?: boolean;
  /** Skip the WebGL fluid backdrop. The renderer clears alpha-transparent so
   *  the page background shows through unfiltered. */
  disableFluid?: boolean;
  /** Auto-orbit the camera around the grid (billboardMode only). The first
   *  manual setRotation call from the parent disables this for the rest of
   *  the mount, handing control to the slider. */
  autoRotate?: boolean;
  /** Material color for the cube/sphere cells. Default white. Use 0x141414
   *  (or similar dark non-zero) on light-themed pages so the crest reads
   *  black-on-light. */
  cellColor?: number;
  /** Fires once after a successful WebGL mount. Parents can hold the
   *  controller in state to drive controls (scale/rotation/shape/replay). */
  onReady?: (controller: PixelGridController) => void;
  /** Fires if WebGL init throws. Parents can use this to hide their
   *  control UI instead of showing buttons that no-op. */
  onFailed?: (error: unknown) => void;
  /** Ref to receive the PixelGridController instance once mounted */
  ref?: MutableRefObject<PixelGridController | null>;
}

export function PixelGrid({ logoPixels, matchMode, height, className, fallback, billboardMode, disableFluid, autoRotate, cellColor, onReady, onFailed, ref }: PixelGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<PixelGridController | null>(null);
  const [failed, setFailed] = useState(false);

  // Initialize controller
  useEffect(() => {
    if (controllerRef.current) return; // Guard against React 18 strict mode double-mount
    if (!containerRef.current) return;

    let controller: PixelGridController;
    try {
      controller = new PixelGridController(containerRef.current, { billboardMode, disableFluid, autoRotate, cellColor });
    } catch (err) {
      // WebGL context creation failed (sandboxed browsers, old GPUs, headless
      // SwiftShader, blocked extensions). Surface the fallback instead of
      // letting the uncaught throw take the whole app down.
      console.warn('[PixelGrid] controller init failed, rendering fallback:', err);
      setFailed(true);
      onFailed?.(err);
      return;
    }
    controllerRef.current = controller;
    if (ref) ref.current = controller;
    onReady?.(controller);

    const onResize = () => controller.resize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      controller.dispose();
      controllerRef.current = null;
      if (ref) ref.current = null;
    };
  }, []);

  // Show logo when pixels change
  useEffect(() => {
    controllerRef.current?.showLogo(logoPixels, 'wave');
  }, [logoPixels]);

  // Match mode
  useEffect(() => {
    const ctrl = controllerRef.current;
    if (!ctrl) return;

    if (matchMode) {
      ctrl.startMatchMode(logoPixels, matchMode.awayPixels, matchMode.switchInterval);
    } else {
      ctrl.stopMatchMode();
    }
  }, [matchMode, logoPixels]);

  if (failed && fallback !== undefined) {
    return (
      <div
        className={`${styles.container}${className ? ` ${className}` : ''}`}
        style={{ height: height || '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {fallback}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`${styles.container}${className ? ` ${className}` : ''}`}
      style={{ height: height || '60vh' }}
    />
  );
}
