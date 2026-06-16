import { useEffect, useRef, useState } from "react";
import {
  AbsoluteFill, useCurrentFrame, useVideoConfig, delayRender, continueRender, staticFile,
} from "remotion";
import { loadFont } from "@remotion/fonts";
import { TEAMS, teamAccent } from "../src/data/teams";
import { getLogoPixels } from "../src/data/team-logos";
import { teamSeed } from "../src/components/logos/spectrumMotif";
import { ROSTERS } from "../src/data/rosters";
import { FIELD_CONCEPTS, renderField } from "../src/components/logos/fieldEngine";
import {
  setMotif, setMotifDark, setMotifShape, setMotifSeed, renderMotif, teamClashColors,
} from "../src/components/logos/motifEngine";
import { useThemeStore } from "../src/stores/theme";

// ── Game Identity video — "a look between all the forms of stats" ────────────
// Reuses the site's real renderField (22 stat-field concepts) + renderMotif
// (crest treatment) verbatim. The winner's crest holds on top while the
// negative-space stat field cross-dissolves through ALL 22 concepts in turn —
// the same match data drawn every which way. Single source of truth.

const GREEN = "rgba(74,222,128,1)";
const FONT = '"PPNeueBit", "Helvetica Neue", Arial, sans-serif';
loadFont({ family: "PPNeueBit", url: staticFile("fonts/PPNeueBit-Bold.woff2"), weight: "700" }).catch(() => {});

const rgbHex = (c: number[]) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

// a representative finished box score (no live server in the render) — drives
// the field/crest exactly like a real result would.
const SAMPLE_STATS = {
  goals: 2, shotsOnTarget: 6, shots: 14, corners: 7, yellowCards: 2,
  redCards: 0, offsides: 3, fouls: 11, var: 1, possession: 56, passes: 480,
};

// ── timing ──────────────────────────────────────────────────────────────────
const PER = 20; // frames each concept holds
const XFADE = 8; // crossfade frames into the next concept
export const GI_DURATION = FIELD_CONCEPTS.length * PER; // 22 × 20 = 440 ≈ 14.7s, loops

// one field concept rendered to a canvas at the given time
const FieldLayer: React.FC<{
  pixels: number[]; size: number; concept: string; colors: string[];
  seed: number; roster: Array<{ num: number | null; scored?: boolean }>; time: number; opacity: number;
}> = ({ pixels, size, concept, colors, seed, roster, time, opacity }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const cell = Math.max(3, Math.round(size / 32));
    renderField(cv, pixels, { cell, concept, stats: SAMPLE_STATS, colors, seed, roster, time, animate: true, bg: "rgba(0,0,0,0)" });
    cv.style.width = size + "px";
    cv.style.height = size + "px";
  }, [pixels, size, concept, colors, seed, roster, time]);
  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: size, height: size, opacity }} />;
};

// the crest on top — plain team3d treatment, animated (the field carries stats)
const Crest: React.FC<{ slug: string; pixels: number[]; size: number; time: number }> = ({ slug, pixels, size, time }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const enginePixels = pixels.map((v) => v + 1);
    const cell = Math.max(3, Math.round(size / 32));
    setMotif("team3d");
    setMotifDark(true);
    setMotifShape("square");
    setMotifSeed(teamSeed(slug));
    renderMotif(cv, enginePixels, { cell, applyFill: true, teamId: slug, animate: true, time, bg: "rgba(0,0,0,0)", off: "rgba(0,0,0,0)" });
    cv.style.width = size + "px";
    cv.style.height = size + "px";
  }, [pixels, size, slug, time]);
  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: size, height: size }} />;
};

export const GameIdentity: React.FC<{ teamSlug?: string }> = ({ teamSlug = "mexico" }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const portrait = height > width * 1.05;
  const base = Math.min(width, height);
  const time = frame / fps;

  useEffect(() => useThemeStore.setState({ theme: "dark" }), []);
  const [handle] = useState(() => delayRender("gi"));
  useEffect(() => {
    const id = setTimeout(() => continueRender(handle), 250);
    return () => clearTimeout(id);
  }, [handle]);

  const team = TEAMS.find((t) => t.slug === teamSlug) ?? TEAMS[0];
  const slug = team.slug;
  const pixels = getLogoPixels(slug, team.name[0]);
  const colors = teamClashColors(slug).map(rgbHex);
  const seed = teamSeed(slug);
  const roster = (ROSTERS[slug] ?? []).slice(0, 11).map((p, i) => ({ num: p.n, scored: i === 8 || i === 9 }));
  const accent = teamAccent(team);

  // which concept(s) are showing + crossfade mix
  const cyc = frame / PER;
  const i = Math.floor(cyc);
  const frac = cyc - i;
  const xf = XFADE / PER;
  const mix = frac < 1 - xf ? 0 : (frac - (1 - xf)) / xf;
  const aIdx = ((i % FIELD_CONCEPTS.length) + FIELD_CONCEPTS.length) % FIELD_CONCEPTS.length;
  const bIdx = (aIdx + 1) % FIELD_CONCEPTS.length;
  const labelIdx = mix > 0.5 ? bIdx : aIdx;

  const size = Math.round((portrait ? width * 0.86 : height * 0.78) / 32) * 32;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", alignItems: "center", justifyContent: "center" }}>
      {/* team-accent frame, echoing the site's game-identity container */}
      <div style={{
        position: "absolute", inset: Math.round(base * 0.02),
        border: `2px solid ${accent}`, borderRadius: 8, opacity: 0.5,
        boxShadow: `0 0 24px ${accent}33, inset 0 0 0 5px ${accent}14`, pointerEvents: "none",
      }} />

      {/* team name (top) */}
      <div style={{ position: "absolute", top: base * 0.06, fontFamily: FONT, fontWeight: 700, color: "#fff", fontSize: base * 0.05, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {team.name}
      </div>

      {/* the identity stack: stat field (cross-dissolving) behind, crest on top */}
      <div style={{ position: "relative", width: size, height: size }}>
        <FieldLayer pixels={pixels} size={size} concept={FIELD_CONCEPTS[aIdx].key} colors={colors} seed={seed} roster={roster} time={time} opacity={1 - mix} />
        {mix > 0 && (
          <FieldLayer pixels={pixels} size={size} concept={FIELD_CONCEPTS[bIdx].key} colors={colors} seed={seed} roster={roster} time={time} opacity={mix} />
        )}
        <Crest slug={slug} pixels={pixels} size={size} time={time} />
      </div>

      {/* concept label (bottom) — the current "form of stats" */}
      <div style={{ position: "absolute", bottom: base * 0.06, display: "flex", alignItems: "baseline", gap: base * 0.02, fontFamily: FONT, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        <span style={{ color: GREEN, fontSize: base * 0.022 }}>STATS</span>
        <span style={{ color: "#fff", fontSize: base * 0.04 }}>{FIELD_CONCEPTS[labelIdx].label}</span>
      </div>
    </AbsoluteFill>
  );
};
