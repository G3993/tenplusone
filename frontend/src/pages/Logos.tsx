import { useState, useEffect, useRef, useMemo, type CSSProperties } from 'react';
import { TEAMS, teamAccent } from '../data/teams';
import { getLogoPixels } from '../data/team-logos/index.ts';
import { SpectrumCrest } from '../components/logos/SpectrumCrest';
import { teamSeed, FRAMES } from '../components/logos/spectrumMotif';
import styles from './Logos.module.css';

const SORTED = [...TEAMS].sort((a, b) => a.name.localeCompare(b.name));

const svgPath = (slug: string) => `/logos/final/svg/${slug}.svg`;

function triggerDownload(href: string, filename: string) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// Rasterize the clean vector mark to a transparent 300-DPI PNG, client-side.
async function downloadPng(url: string, filename: string, px = 4500) {
  const svgText = await (await fetch(url)).text();
  const blobUrl = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml' }));
  const img = new Image();
  await new Promise<void>((ok, err) => {
    img.onload = () => ok();
    img.onerror = () => err(new Error('svg load failed'));
    img.src = blobUrl;
  });
  const canvas = document.createElement('canvas');
  canvas.width = px;
  canvas.height = px;
  canvas.getContext('2d')!.drawImage(img, 0, 0, px, px);
  URL.revokeObjectURL(blobUrl);
  canvas.toBlob((out) => {
    if (!out) return;
    const dl = URL.createObjectURL(out);
    triggerDownload(dl, filename);
    URL.revokeObjectURL(dl);
  }, 'image/png');
}

const MIN = 40;
const MAX = 200;
const CYCLE_MS = 1400; // hero auto-advance through nations

export function Logos() {
  // Per-team crest pixels (0-based) + seed, computed once.
  const data = useMemo(
    () => SORTED.map((t) => ({ team: t, pixels: getLogoPixels(t.slug, t.name[0]), seed: teamSeed(t.slug) })),
    [],
  );

  const [frame, setFrame] = useState(0);     // shared animation clock
  const [heroIdx, setHeroIdx] = useState(0); // auto-cycling hero index
  const [pinned, setPinned] = useState<number | null>(null); // grid-clicked override
  const [size, setSize] = useState(96);
  const [shape, setShape] = useState<'square' | 'circle'>('square');
  const [busy, setBusy] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const firstLoad = useRef(true);

  // Shared frame clock — every spectrum crest on the page animates in lockstep.
  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % FRAMES), 110);
    return () => clearInterval(id);
  }, []);

  // Hero cycles through nations; keeps advancing even while pinned (display
  // just overrides), so un-pinning resumes a moving target.
  useEffect(() => {
    const id = setInterval(() => setHeroIdx((i) => (i + 1) % data.length), CYCLE_MS);
    return () => clearInterval(id);
  }, [data.length]);

  const activeIdx = pinned ?? heroIdx;
  const active = data[activeIdx];
  const accent = teamAccent(active.team);

  useEffect(() => {
    if (firstLoad.current) { firstLoad.current = false; return; }
    if (pinned !== null) heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [pinned]);

  const url = svgPath(active.team.slug);

  return (
    <div className={styles.wrap} style={{ '--accent': accent } as CSSProperties}>
      {/* ---- system masthead ---- */}
      <div className={styles.masthead}>
        <span className={styles.mh}>iFC / LOGO SYSTEM</span>
        <span className={styles.mhCount}>48 NATIONS · SPECTRUM MOTIF · ∞</span>
      </div>

      {/* ---- spectrum hero (cycles through every nation) ---- */}
      <section ref={heroRef} className={styles.hero} aria-label={`${active.team.name} spectrum motif`}>
        <div className={styles.stage}>
          <span className={`${styles.tick} ${styles.tl}`} />
          <span className={`${styles.tick} ${styles.tr}`} />
          <span className={`${styles.tick} ${styles.bl}`} />
          <span className={`${styles.tick} ${styles.br}`} />
          <SpectrumCrest pixels={active.pixels} seed={active.seed} frame={frame} size={360} shape={shape} className={styles.heroCrest} />
        </div>

        <div className={styles.controls}>
          <div className={styles.labHead}>
            <span className={styles.labIdx}>
              {String(activeIdx + 1).padStart(2, '0')} / {data.length}
              <span className={styles.runState}>{pinned === null ? '· cycling' : '· pinned'}</span>
            </span>
            <span className={styles.labName}>{active.team.name}</span>
            <span className={styles.labCode}>{active.team.code} · grp {active.team.group}</span>
          </div>

          <p className={styles.motifNote}>
            the <strong>spectrum motif</strong> — every crest cell rendered as a live
            pixel-fill, shimmering plain↔slash. it cycles through all {data.length} nations on
            its own; click any crest below to pin it.
          </p>

          <div className={styles.heroBtns}>
            {pinned !== null && (
              <button type="button" className={styles.resume} onClick={() => setPinned(null)}>
                ▶ resume cycle
              </button>
            )}
            <button
              type="button"
              className={styles.dlPrimary}
              onClick={() => triggerDownload(url, `ifc-${active.team.slug}.svg`)}
            >
              <span>↓ SVG</span><span className={styles.dlMeta}>vector mark</span>
            </button>
            <button
              type="button"
              className={styles.dlSecondary}
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try { await downloadPng(url, `ifc-${active.team.slug}-4500.png`); }
                finally { setBusy(false); }
              }}
            >
              <span>{busy ? 'rendering…' : '↓ PNG'}</span><span className={styles.dlMeta}>4500px · 300dpi</span>
            </button>
          </div>
        </div>
      </section>

      {/* ---- character set: every nation in spectrum motif ---- */}
      <header className={styles.head}>
        <div>
          <p className={styles.eyebrow}>character set · spectrum</p>
          <h1 className={styles.title}>48 crests.<br />one motif.</h1>
        </div>
        <div className={styles.headControls}>
          <div className={styles.shapeToggle} role="group" aria-label="pixel shape">
            {(['square', 'circle'] as const).map((s) => (
              <button
                key={s}
                type="button"
                className={`${styles.shapeBtn} ${shape === s ? styles.shapeOn : ''}`}
                aria-pressed={shape === s}
                onClick={() => setShape(s)}
              >
                {s === 'square' ? '◼ square' : '● circle'}
              </button>
            ))}
          </div>
          <label className={styles.sizer}>
            <span className={styles.sizerLabel}>size</span>
            <input
              type="range" min={MIN} max={MAX} step={4} value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className={styles.slider} aria-label="crest size"
            />
          </label>
        </div>
      </header>

      <div className={styles.grid} style={{ '--logo': `${size}px` } as CSSProperties}>
        {data.map((d, i) => (
          <button
            key={d.team.slug}
            type="button"
            className={`${styles.cell} ${activeIdx === i ? styles.cellActive : ''}`}
            style={{ '--accent': teamAccent(d.team) } as CSSProperties}
            onClick={() => setPinned(i)}
            aria-label={`pin ${d.team.name} in the hero`}
          >
            <span className={styles.cellNo}>{String(i + 1).padStart(2, '0')}</span>
            <SpectrumCrest pixels={d.pixels} seed={d.seed} frame={frame} size={size} shape={shape} className={styles.cellImg} />
            <span className={styles.cellName}>{d.team.name}</span>
            <span className={styles.cellCode}>{d.team.code}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
