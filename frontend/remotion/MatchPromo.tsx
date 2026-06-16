import { useState, useEffect, useRef } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  delayRender,
  continueRender,
  staticFile,
} from "remotion";
import { loadFont } from "@remotion/fonts";
import { MATCHES } from "../src/data/matches";
import { getTeamByName } from "../src/data/teams";
import { getLogoPixels } from "../src/data/team-logos";
import { teamSeed } from "../src/components/logos/spectrumMotif";
import { setMotif, setMotifDark, setMotifShape, setMotifSeed, renderMotif } from "../src/components/logos/motifEngine";
import { useThemeStore } from "../src/stores/theme";

// ── one source of truth: drive the promo entirely off the site's match data ──
// Pass a matchId; everything (teams, crests, odds, date) resolves from the
// same MATCHES / team data / odds the website uses. Reused verbatim so the
// video can never drift from the live card.

const GREEN = "rgba(74,222,128,1)";
const GRID_LINE = "rgba(74,222,128,0.35)";

// iFC / tenplusone standard video font: PPNeueBit (8-bit pixel font).
loadFont({ family: "PPNeueBit", url: staticFile("fonts/PPNeueBit-Bold.woff2"), weight: "700" }).catch(() => {});
const FONT = '"PPNeueBit", "Helvetica Neue", Arial, sans-serif';

// animated synthwave perspective grid floor (replicated from the site .field)
// Synthwave floor drawn as real projected lines (not a scrolling CSS texture —
// that aliased/moiréd under perspective and looked jittery). Horizontal rows
// recede to a central vanishing point and scroll toward the viewer; vertical
// lines fan from the vanishing point. Crisp and smooth at any size.
const PerspectiveGrid: React.FC<{ frame: number; width: number; height: number }> = ({ frame, width, height }) => {
  const fieldH = Math.round(height * 0.46);
  const horizonY = height - fieldH; // vanishing-point line
  const bottom = height;
  // project the floor PAST the screen bottom so rows scroll off-screen and
  // recycle at the horizon out of view → a constant linear scroll that loops
  // forever with no visible seam.
  const floorBottom = height + (height - horizonY) * 0.18;
  const cx = width / 2;
  const ROWS = 20;
  const COLS = 24;
  const SPEED = 0.004; // rows per frame — constant (linear)
  const POW = 2.3; // perspective bunching toward the horizon

  const green = (a: number) => `rgba(74,222,128,${a.toFixed(3)})`;
  const yAt = (u: number) => horizonY + (floorBottom - horizonY) * Math.pow(u, POW);

  const rows: React.ReactNode[] = [];
  for (let k = 0; k < ROWS; k++) {
    // minus → rows travel INWARD (up toward the horizon); still seamless since
    // both wrap ends are invisible (horizon faded, bottom off-screen).
    const u = ((k / ROWS - frame * SPEED) % 1 + 1) % 1; // 0 = horizon, 1 = past viewer
    const y = yAt(u);
    rows.push(
      <line key={`r${k}`} x1={0} y1={y} x2={width} y2={y}
        stroke={green(0.08 + 0.4 * Math.min(1, u * 1.3))} strokeWidth={0.6 + 2.4 * u} />,
    );
  }

  const cols: React.ReactNode[] = [];
  const span = width * 1.9;
  for (let j = 0; j <= COLS; j++) {
    const xb = cx + (j / COLS - 0.5) * span; // evenly spaced along the bottom edge
    cols.push(
      <line key={`c${j}`} x1={cx} y1={horizonY} x2={xb} y2={bottom}
        stroke={green(0.22)} strokeWidth={1.1} />,
    );
  }

  const fade =
    "linear-gradient(to top, #000 0%, rgba(0,0,0,0.9) 22%, rgba(0,0,0,0.55) 48%, rgba(0,0,0,0.2) 74%, transparent 100%)";
  return (
    <div style={{
      position: "absolute", left: 0, right: 0, top: horizonY, height: fieldH, overflow: "hidden",
      WebkitMaskImage: fade, maskImage: fade,
    }}>
      <svg width={width} height={height} style={{ position: "absolute", left: 0, top: -horizonY }}>
        {cols}
        {rows}
      </svg>
    </div>
  );
};

// frame-driven team3d crest — repaints every frame so the logo's colours cycle
// and scanlines scroll (the site's animate=true behaviour), instead of frozen.
const Crest: React.FC<{ slug: string; pixels: number[]; size: number; frame: number; fps: number }> = ({ slug, pixels, size, frame, fps }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const enginePixels = pixels.map((v) => v + 1); // site 0-based → engine 1-based
    const cell = Math.max(3, Math.round(size / 32));
    setMotif("team3d");
    setMotifDark(true);
    setMotifShape("square");
    setMotifSeed(teamSeed(slug));
    renderMotif(cv, enginePixels, {
      cell, off: "rgba(0,0,0,0)", bg: "rgba(0,0,0,0)", applyFill: true,
      teamId: slug, time: frame / fps, animate: true,
    });
    cv.style.width = size + "px";
    cv.style.height = size + "px";
  }, [pixels, size, slug, frame, fps]);
  return <canvas ref={ref} style={{ width: size, height: size, display: "block" }} />;
};

export const MatchPromo: React.FC<{ matchId?: string }> = ({ matchId = "1" }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const portrait = height > width * 1.15;
  const base = Math.min(width, height); // size text/odds consistently across formats

  // force dark theme (black promo) regardless of headless localStorage
  useEffect(() => useThemeStore.setState({ theme: "dark" }), []);
  // give the crest canvases a tick to paint before the first frame is captured
  const [handle] = useState(() => delayRender("crests"));
  useEffect(() => {
    const id = setTimeout(() => continueRender(handle), 200);
    return () => clearTimeout(id);
  }, [handle]);

  const m = MATCHES.find((x) => String(x.id) === String(matchId)) ?? MATCHES[0];
  const home = getTeamByName(m.h);
  const away = getTeamByName(m.a);
  const hPix = home ? getLogoPixels(home.slug, home.name[0]) : [];
  const aPix = away ? getLogoPixels(away.slug, away.name[0]) : [];

  const crestSize = portrait ? width * 0.3 : height * 0.34;

  const nameStyle: React.CSSProperties = {
    fontFamily: FONT, fontWeight: 700, color: "#fff", textTransform: "uppercase",
    fontSize: base * 0.055, letterSpacing: "0.04em", textAlign: "center",
  };

  const TeamBlock: React.FC<{ slug: string; pixels: number[]; name: string }> = ({ slug, pixels, name }) => (
    // name is absolutely positioned below the crest so the block's box = crest
    // height, which lets the row centre the VS on the crests (not the names).
    <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Crest slug={slug} pixels={pixels} size={crestSize} frame={frame} fps={fps} />
      <span style={{ ...nameStyle, position: "absolute", top: "100%", marginTop: base * 0.04, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap" }}>{name}</span>
    </div>
  );

  const Center = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <span style={{ fontFamily: FONT, fontWeight: 700, color: GREEN, fontSize: base * 0.03, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        vs
      </span>
    </div>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* bottom floor grid */}
      <PerspectiveGrid frame={frame} width={width} height={height} />
      {/* portrait: mirrored ceiling grid at the top too */}
      {portrait && (
        <div style={{ position: "absolute", inset: 0, transform: "scaleY(-1)" }}>
          <PerspectiveGrid frame={frame} width={width} height={height} />
        </div>
      )}

      {/* thin neon border frame */}
      <div style={{
        position: "absolute", inset: Math.round(Math.min(width, height) * 0.018),
        border: "1.5px solid rgba(74,222,128,0.45)", borderRadius: 6,
        boxShadow: "0 0 18px rgba(74,222,128,0.10), inset 0 0 0 4px rgba(74,222,128,0.05)",
        pointerEvents: "none",
      }} />

      {/* crests side by side with the VS centred between them (both formats) */}
      <AbsoluteFill style={{
        flexDirection: "row", alignItems: "center",
        justifyContent: portrait ? "center" : "space-between",
        gap: portrait ? base * 0.02 : 0,
        // portrait: bottom padding lifts the vertically-centred row higher
        padding: portrait ? `0 0 ${Math.round(height * 0.16)}px` : `0 ${width * 0.06}px`,
      }}>
        {home && <TeamBlock slug={home.slug} pixels={hPix} name={home.code} />}
        {Center}
        {away && <TeamBlock slug={away.slug} pixels={aPix} name={away.code} />}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
