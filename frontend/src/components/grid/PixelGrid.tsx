import { useRef, useEffect, type MutableRefObject } from 'react';
import { PixelGridController } from './PixelGridController.ts';
import styles from './PixelGrid.module.css';

export interface PixelGridProps {
  logoPixels: number[];
  matchMode?: { awayPixels: number[]; switchInterval?: number };
  height?: string;
  className?: string;
  /** Ref to receive the PixelGridController instance once mounted */
  ref?: MutableRefObject<PixelGridController | null>;
}

export function PixelGrid({ logoPixels, matchMode, height, className, ref }: PixelGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<PixelGridController | null>(null);

  // Initialize controller
  useEffect(() => {
    if (controllerRef.current) return; // Guard against React 18 strict mode double-mount
    if (!containerRef.current) return;

    const controller = new PixelGridController(containerRef.current);
    controllerRef.current = controller;
    if (ref) ref.current = controller;

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

  return (
    <div
      ref={containerRef}
      className={`${styles.container}${className ? ` ${className}` : ''}`}
      style={{ height: height || '60vh' }}
    />
  );
}
