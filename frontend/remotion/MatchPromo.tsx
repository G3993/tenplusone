import { useState, useEffect } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  delayRender,
  continueRender,
} from "remotion";
import { MATCHES } from "../src/data/matches";
import { getTeamByName } from "../src/data/teams";
import { getLogoPixels } from "../src/data/team-logos";
import { teamSeed } from "../src/components/logos/spectrumMotif";
import { toAmerican } from "../src/lib/odds";
import { MotifCrest } from "../src/components/logos/MotifCrest";
import { useThemeStore } from "../src/stores/theme";

// ── one source of truth: drive the promo entirely off the site's match data ──
// Pass a matchId; everything (teams, crests, odds, date) resolves from the
// same MATCHES / team data / odds the website uses. Reused verbatim so the
// video can never drift from the live card.

const GREEN = "rgba(74,222,128,1)";
const GRID_LINE = "rgba(74,222,128,0.35)";
const FONT = '"Helvetica Neue", "Inter", Arial, sans-serif';
const MONO = '"JetBrains Mono", "SF Mono", ui-monospace, monospace';

/** "13:00 CST" → "1:00 PM CST" */
function to12h(t: string): string {
  const mt = t.match(/^(\d{1,2}):(\d{2})\s*(.*)$/);
  if (!mt) return t;
  let h = Number(mt[1]);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${mt[2]} ${ampm}${mt[3] ? ` ${mt[3]}` : ""}`;
}

// the green 3D odds cube (scanline face + isometric top/right extrusion)
const OddsBox: React.FC<{ odds: string; sub: string; size: number }> = ({ odds, sub, size }) => {
  const d = Math.round(size * 0.085);
  const w = size;
  const h = size * 0.92;
  return (
    <div style={{ position: "relative", width: w, height: h, marginRight: d + size * 0.16 }}>
      {/* top face */}
      <div style={{
        position: "absolute", left: 0, top: -d, width: w, height: d,
        background: "repeating-linear-gradient(0deg, rgba(74,222,128,0.45) 0 1px, transparent 1px 3px), #0a2c17",
        border: "1px solid #2aa957", transform: "skewX(-45deg)", transformOrigin: "0 100%",
      }} />
      {/* right face */}
      <div style={{
        position: "absolute", top: 0, right: -d, width: d, height: h,
        background: "repeating-linear-gradient(0deg, rgba(74,222,128,0.45) 0 1px, transparent 1px 3px), #0a2c17",
        border: "1px solid #2aa957", transform: "skewY(-45deg)", transformOrigin: "0 0",
      }} />
      {/* front face */}
      <div style={{
        position: "absolute", inset: 0,
        background: "repeating-linear-gradient(0deg, rgba(74,222,128,0.14) 0 1px, transparent 1px 4px), #04100a",
        border: "1px solid #35d06b", boxShadow: "0 0 10px rgba(74,222,128,0.18)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: size * 0.06,
      }}>
        <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: size * 0.26, color: "#c8ffda", letterSpacing: "0.02em" }}>{odds}</span>
        <span style={{ fontFamily: MONO, fontWeight: 600, fontSize: size * 0.15, color: "rgba(120,220,160,0.75)", letterSpacing: "0.12em" }}>{sub}</span>
      </div>
    </div>
  );
};

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
  const SPEED = 0.011; // rows per frame toward the viewer — constant (linear)
  const POW = 2.3; // perspective bunching toward the horizon

  const green = (a: number) => `rgba(74,222,128,${a.toFixed(3)})`;
  const yAt = (u: number) => horizonY + (floorBottom - horizonY) * Math.pow(u, POW);

  const rows: React.ReactNode[] = [];
  for (let k = 0; k < ROWS; k++) {
    const u = ((k / ROWS + frame * SPEED) % 1 + 1) % 1; // 0 = horizon, 1 = past viewer
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

const Crest: React.FC<{ slug: string; pixels: number[]; size: number }> = ({ slug, pixels, size }) => (
  <MotifCrest still motif="team3d" teamId={slug} pixels={pixels} seed={teamSeed(slug)} size={size} />
);

export const MatchPromo: React.FC<{ matchId?: string }> = ({ matchId = "1" }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const portrait = height > width * 1.15;

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
  const hCode = home?.code ?? m.h.slice(0, 3).toUpperCase();
  const aCode = away?.code ?? m.a.slice(0, 3).toUpperCase();
  const hPix = home ? getLogoPixels(home.slug, home.name[0]) : [];
  const aPix = away ? getLogoPixels(away.slug, away.name[0]) : [];

  const crestSize = portrait ? width * 0.42 : height * 0.34;
  const oddsSize = portrait ? width * 0.18 : height * 0.085;

  // entrance: fade + rise
  const appear = (delay: number) => ({
    opacity: interpolate(frame, [delay, delay + 16], [0, 1], { extrapolateRight: "clamp" }),
    transform: `translateY(${interpolate(frame, [delay, delay + 16], [18, 0], { extrapolateRight: "clamp" })}px)`,
  });

  const nameStyle: React.CSSProperties = {
    fontFamily: FONT, fontWeight: 700, color: "#fff", textTransform: "uppercase",
    fontSize: height * (portrait ? 0.03 : 0.034), letterSpacing: "0.04em", textAlign: "center",
  };

  const TeamBlock: React.FC<{ slug: string; pixels: number[]; name: string; delay: number }> = ({ slug, pixels, name, delay }) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: height * 0.03, ...appear(delay) }}>
      <Crest slug={slug} pixels={pixels} size={crestSize} />
      <span style={nameStyle}>{name}</span>
    </div>
  );

  const Center = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: height * 0.028, ...appear(6) }}>
      <span style={{ fontFamily: FONT, fontWeight: 700, color: "#fff", fontSize: height * 0.05, letterSpacing: "0.01em" }}>
        {hCode} <span style={{ color: GREEN }}>vs</span> {aCode}
      </span>
      <span style={{ fontFamily: FONT, fontWeight: 500, color: GREEN, fontSize: height * 0.026, letterSpacing: "0.02em" }}>
        {[m.d, to12h(m.t)].filter(Boolean).join(" · ")}
      </span>
      <div style={{ display: "flex", marginTop: height * 0.02 }}>
        <OddsBox odds={toAmerican(m.odds[0])} sub={hCode} size={oddsSize} />
        <OddsBox odds={toAmerican(m.odds[1])} sub="DRAW" size={oddsSize} />
        <OddsBox odds={toAmerican(m.odds[2])} sub={aCode} size={oddsSize} />
      </div>
    </div>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <PerspectiveGrid frame={frame} width={width} height={height} />

      {/* thin neon border frame */}
      <div style={{
        position: "absolute", inset: Math.round(Math.min(width, height) * 0.018),
        border: "1.5px solid rgba(74,222,128,0.45)", borderRadius: 6,
        boxShadow: "0 0 18px rgba(74,222,128,0.10), inset 0 0 0 4px rgba(74,222,128,0.05)",
        pointerEvents: "none",
      }} />

      {portrait ? (
        <AbsoluteFill style={{ flexDirection: "column", alignItems: "center", justifyContent: "space-around", padding: `${height * 0.06}px 0` }}>
          {home && <TeamBlock slug={home.slug} pixels={hPix} name={home.name} delay={0} />}
          {Center}
          {away && <TeamBlock slug={away.slug} pixels={aPix} name={away.name} delay={3} />}
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: `0 ${width * 0.06}px` }}>
          {home && <TeamBlock slug={home.slug} pixels={hPix} name={home.name} delay={0} />}
          {Center}
          {away && <TeamBlock slug={away.slug} pixels={aPix} name={away.name} delay={3} />}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
