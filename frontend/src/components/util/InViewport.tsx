import { useEffect, useRef, useState, type ReactNode } from 'react';

interface Props {
  /** Rendered only while the box is on (or near) screen — the expensive thing. */
  children: () => ReactNode;
  /** Cheap placeholder shown before first paint and whenever off-screen. */
  fallback: ReactNode;
  /** Preload margin so the real content is ready just before it scrolls in. */
  rootMargin?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Render `fallback` (a cheap static PNG) until the element scrolls into view,
 * then mount `children()` (the animated canvas). Unmounts the animation when it
 * leaves the viewport so we never run dozens of rAF loops at once — the page
 * paints instantly with PNGs and only the visible crests animate.
 */
export function InViewport({ children, fallback, rootMargin = '250px', className, style }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return (
    <span ref={ref} className={className} style={style}>
      {inView ? children() : fallback}
    </span>
  );
}
