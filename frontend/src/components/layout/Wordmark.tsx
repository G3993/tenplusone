interface WordmarkProps {
  className?: string;
  /** font-size in px for text lockups; inherits if omitted. */
  size?: number;
  /** Spell out the full name: "internet football club". */
  full?: boolean;
  /** Medium form: "internet fc". */
  internetfc?: boolean;
  /** Brand lockup: "internetFC" (lowercase word + uppercase FC). */
  brand?: boolean;
  /** Render the iFC Brand System pixel lockup as an inline SVG instead of type. */
  pixel?: boolean;
}

/**
 * iFC wordmark — per the brand system: the lowercase `i` is always the
 * soccer-ball anchor (green dot, gray stem), `FC` is bright. Mono, weight
 * 800. Never uppercase the `i`. Never invert the green accent.
 *
 * Pass `pixel` for the official 42×28 pixel lockup (used on chrome, OG
 * assets, and anywhere the typeset mark would lose its character at
 * small sizes).
 */
export function Wordmark({ className, size, full, internetfc, brand, pixel }: WordmarkProps) {
  if (pixel) {
    // 42×28 viewBox: i-dot=green ball (2,2 4×4), i-stem=gray player (2,8 4×14),
    // F+C in bright. Mirrors iFC Brand System lockup D exactly.
    const px = size ?? 56;
    return (
      <svg
        viewBox="0 0 42 28"
        width={(px * 42) / 28}
        height={px}
        shapeRendering="crispEdges"
        className={className}
        aria-label="iFC"
        role="img"
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
      >
        <title>iFC</title>
        <g style={{ fill: 'var(--green)' }}>
          <rect x="2" y="2" width="4" height="4" />
        </g>
        <g style={{ fill: 'var(--white)' }}>
          <rect x="2" y="8" width="4" height="14" />
        </g>
        <g style={{ fill: 'var(--bright)' }}>
          {/* F */}
          <rect x="10" y="2" width="4" height="20" />
          <rect x="14" y="2" width="8" height="4" />
          <rect x="14" y="10" width="6" height="4" />
          {/* C */}
          <rect x="26" y="2" width="4" height="20" />
          <rect x="30" y="2" width="8" height="4" />
          <rect x="30" y="18" width="8" height="4" />
        </g>
      </svg>
    );
  }

  const rest = full ? 'nternet football club' : internetfc ? 'nternet fc' : brand ? 'nternet FC' : 'FC';
  const label = full ? 'internet football club' : internetfc ? 'internet fc' : brand ? 'internet FC' : 'iFC';
  return (
    <span
      className={className}
      style={{
        fontFamily: 'var(--display)',
        fontWeight: 800,
        letterSpacing: full || internetfc || brand ? '-0.02em' : '-0.04em',
        fontSize: size ? `${size}px` : undefined,
        lineHeight: 1,
        textTransform: 'none',
        whiteSpace: 'nowrap',
      }}
      aria-label={label}
    >
      <span style={{ color: 'var(--green)' }}>i</span>
      <span style={{ color: 'var(--bright)' }}>{rest}</span>
    </span>
  );
}
