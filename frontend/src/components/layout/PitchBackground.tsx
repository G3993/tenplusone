import styles from './PitchBackground.module.css';

/**
 * Full-viewport soccer pitch, outline only, very thin. Fixed behind all
 * content, non-interactive. FIFA proportions (105 × 68 m, scaled ×10).
 */
export function PitchBackground() {
  return (
    <div className={styles.pitch} aria-hidden="true">
      <svg
        viewBox="-25 -25 1100 730"
        preserveAspectRatio="xMidYMid slice"
        className={styles.svg}
      >
        <g
          className={styles.line}
          fill="none"
          vectorEffect="non-scaling-stroke"
        >
          {/* boundary */}
          <rect x="0" y="0" width="1050" height="680" />
          {/* halfway line */}
          <line x1="525" y1="0" x2="525" y2="680" />
          {/* centre circle + spot */}
          <circle cx="525" cy="340" r="91.5" />
          <circle cx="525" cy="340" r="2" />
          {/* penalty areas */}
          <rect x="0" y="138.5" width="165" height="403" />
          <rect x="885" y="138.5" width="165" height="403" />
          {/* goal areas */}
          <rect x="0" y="248.5" width="55" height="183" />
          <rect x="995" y="248.5" width="55" height="183" />
          {/* penalty spots */}
          <circle cx="110" cy="340" r="2" />
          <circle cx="940" cy="340" r="2" />
          {/* penalty arcs */}
          <path d="M165 266.87 A 91.5 91.5 0 0 1 165 413.13" />
          <path d="M885 266.87 A 91.5 91.5 0 0 0 885 413.13" />
          {/* goals */}
          <rect x="-20" y="303.4" width="20" height="73.2" />
          <rect x="1050" y="303.4" width="20" height="73.2" />
          {/* corner arcs */}
          <path d="M0 10 A 10 10 0 0 0 10 0" />
          <path d="M1040 0 A 10 10 0 0 0 1050 10" />
          <path d="M10 680 A 10 10 0 0 0 0 670" />
          <path d="M1050 670 A 10 10 0 0 0 1040 680" />
        </g>
      </svg>
    </div>
  );
}
