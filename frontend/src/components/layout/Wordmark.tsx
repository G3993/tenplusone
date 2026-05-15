interface WordmarkProps {
  className?: string;
  /** font-size in px; inherits if omitted */
  size?: number;
}

/**
 * iFC wordmark — per the brand system: the lowercase `i` is always the
 * soccer-ball anchor (green), `FC` is bright. Mono, weight 800. Never
 * uppercase the `i`, never invert the green accent.
 */
export function Wordmark({ className, size }: WordmarkProps) {
  return (
    <span
      className={className}
      style={{
        fontFamily: 'var(--mono)',
        fontWeight: 800,
        letterSpacing: '-0.04em',
        fontSize: size ? `${size}px` : undefined,
        lineHeight: 1,
        textTransform: 'none',
        whiteSpace: 'nowrap',
      }}
      aria-label="iFC"
    >
      <span style={{ color: 'var(--green)' }}>i</span>
      <span style={{ color: 'var(--bright)' }}>FC</span>
    </span>
  );
}
