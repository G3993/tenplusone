import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { TeamData } from '../../data/teams';
import { TeamLogo } from './TeamLogo';
import { getLogoPixels } from '../../data/team-logos/index.ts';
import { SpectrumCrest } from '../logos/SpectrumCrest';
import { MotifCrest, type MotifId } from '../logos/MotifCrest';
import { teamSeed, FRAMES } from '../logos/spectrumMotif';
import styles from './TeamHero.module.css';

const HERO_SIZE = 400;

// Every variation of the crest, in swipe order. The hero is a gallery: swipe
// left/right to flip through them, pagination dots show position.
type Variation =
  | { kind: 'normal' }
  | { kind: 'reel' }
  | { kind: 'spectrum'; variant: 'spectrum' | 'mono' | 'outline' }
  | { kind: 'motif'; motif: MotifId };

// The opening "reel" rapidly flips through every treatment — starts on the 3D
// crest, then runs through the rest, looping. It's the first slide so the
// header is alive on load; swiping reveals each treatment on its own.
const REEL_MOTIFS: MotifId[] = [
  'team3d', 'cube', 'teamColors', 'lines', 'chrome', 'mesh', 'pattern', 'abstract', 'internet', 'stats', 'bauhaus',
];
const REEL_MS = 600;

// Lead with the reel; the rest are the individual treatments in swipe order.
const VARIATIONS: { key: string; v: Variation }[] = [
  { key: 'reel', v: { kind: 'reel' } },
  { key: 'spectrum', v: { kind: 'spectrum', variant: 'spectrum' } },
  { key: 'team3d', v: { kind: 'motif', motif: 'team3d' } },
  { key: 'teamColors', v: { kind: 'motif', motif: 'teamColors' } },
  { key: 'lines', v: { kind: 'motif', motif: 'lines' } },
  { key: 'mesh', v: { kind: 'motif', motif: 'mesh' } },
  { key: 'chrome', v: { kind: 'motif', motif: 'chrome' } },
  { key: 'pattern', v: { kind: 'motif', motif: 'pattern' } },
  { key: 'abstract', v: { kind: 'motif', motif: 'abstract' } },
  { key: 'internet', v: { kind: 'motif', motif: 'internet' } },
  { key: 'mono', v: { kind: 'spectrum', variant: 'mono' } },
  { key: 'outline', v: { kind: 'spectrum', variant: 'outline' } },
  { key: 'stats', v: { kind: 'motif', motif: 'stats' } },
  { key: 'solid', v: { kind: 'motif', motif: 'solid' } },
  { key: 'normal', v: { kind: 'normal' } },
];

export function TeamHero({ team }: { team: TeamData }) {
  const heroPixels = useMemo(() => getLogoPixels(team.slug, team.name[0]), [team.slug, team.name]);
  const seed = useMemo(() => teamSeed(team.slug), [team.slug]);

  const [active, setActive] = useState(0);
  const [frame, setFrame] = useState(0);
  const [reelIdx, setReelIdx] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  // Shared clock for the spectrum / b&w crests (outline + motifs self-animate).
  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % FRAMES), 110);
    return () => clearInterval(id);
  }, []);

  // Fast reel — only runs while the reel slide (index 0) is in view.
  useEffect(() => {
    if (active !== 0) return;
    const id = setInterval(() => setReelIdx((i) => i + 1), REEL_MS);
    return () => clearInterval(id);
  }, [active]);

  // New team → snap back to the first variation.
  useEffect(() => {
    setActive(0);
    trackRef.current?.scrollTo({ left: 0 });
  }, [team.slug]);

  // Track the in-view slide with an IntersectionObserver (scrollLeft math was
  // unreliable and left the wrong slide animating). The most-visible slide is
  // `active`; only it and its neighbors run their animation loop.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const slides = Array.from(el.children) as HTMLElement[];
    const ratios = new Map<Element, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) ratios.set(e.target, e.intersectionRatio);
        let best = 0;
        let bestR = -1;
        slides.forEach((s, i) => {
          const r = ratios.get(s) ?? 0;
          if (r > bestR) {
            bestR = r;
            best = i;
          }
        });
        setActive(best);
      },
      { root: el, threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    slides.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [team.slug]);

  const goTo = useCallback((i: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  }, []);

  const renderVariation = (v: Variation) => {
    if (v.kind === 'normal') {
      return <TeamLogo team={team} size={HERO_SIZE} shape="square" />;
    }
    if (v.kind === 'reel') {
      const motif = REEL_MOTIFS[reelIdx % REEL_MOTIFS.length];
      return (
        <MotifCrest
          pixels={heroPixels}
          seed={seed}
          size={HERO_SIZE}
          motif={motif}
          teamId={team.slug}
        />
      );
    }
    if (v.kind === 'spectrum') {
      return (
        <SpectrumCrest
          pixels={heroPixels}
          seed={seed}
          frame={frame}
          size={HERO_SIZE}
          variant={v.variant}
        />
      );
    }
    return (
      <MotifCrest
        pixels={heroPixels}
        seed={seed}
        size={HERO_SIZE}
        motif={v.motif}
        teamId={team.slug}
      />
    );
  };

  return (
    <header className={styles.hero}>
      <div
        className={styles.slider}
        ref={trackRef}
        aria-label={`${team.name} crest variations`}
      >
        {VARIATIONS.map(({ key, v }, i) => (
          <div className={styles.slide} key={key}>
            {/* Only animate the active slide and its neighbors; the rest show a
                static crest so we never run a dozen rAF loops at once. */}
            {Math.abs(i - active) <= 1 ? renderVariation(v) : <TeamLogo team={team} size={HERO_SIZE} shape="square" />}
          </div>
        ))}
      </div>

      <div className={styles.dots} role="tablist" aria-label="crest variation">
        {VARIATIONS.map(({ key }, i) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={`variation ${i + 1} of ${VARIATIONS.length}`}
            className={i === active ? `${styles.dot} ${styles.dotActive}` : styles.dot}
            onClick={() => goTo(i)}
          />
        ))}
      </div>

      <h1 className={styles.name}>{team.name}</h1>
      <div className={styles.sub}>
        <span className={styles.code}>WC*26</span>
      </div>
    </header>
  );
}
