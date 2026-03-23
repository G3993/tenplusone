# Phase 2: Team & Match Visuals - Research

**Researched:** 2026-03-22
**Domain:** Three.js 3D grid extraction, team pixel art pipeline, generative design export, React+Three.js integration
**Confidence:** MEDIUM-HIGH

## Summary

Phase 2 transforms the existing `grid.html` prototype into a React-integrated 3D experience serving three surfaces: team pages (single logo), match detail pages (dual logo with auto-switching), and a generative design pipeline that exports high-resolution PNGs from match data for print-on-demand. The core technical challenge is extracting ~800 lines of vanilla Three.js + WebGL fluid simulation from a standalone HTML file into a reusable React component that can be embedded anywhere in the SPA without conflicting with React's render cycle.

The existing prototype already solves the hard rendering problems: fluid simulation via raw WebGL2, 32x32 cube/sphere grid with flip animations, team logo pixel data as flat index arrays, and match mode with auto-switching between two logos. What remains is: (1) wrapping this in a React component with proper lifecycle management, (2) scaling the pixel art library from 3 to 48 teams, (3) adding match result display and wager outcome notification, and (4) building the high-res canvas export pipeline for generative merch.

**Primary recommendation:** Extract the grid.html code into a self-contained `PixelGrid` React component using `useRef` + `useEffect` with a class-based controller (not React state) for all Three.js/WebGL state. Use InstancedMesh to replace 1024 individual mesh objects for better performance. For high-res export, use WebGLRenderTarget at print dimensions (3600x4800) with `readRenderTargetPixels` rather than `preserveDrawingBuffer` + `toDataURL` to avoid the persistent performance penalty.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TEAM-01 | Each of the 48 World Cup teams has a dedicated team page | React Router route `/team/:slug`, page component with PixelGrid + merch collection |
| TEAM-02 | Team page displays interactive 3D pixel logo (32x32 grid) at the top | PixelGrid React component extracted from grid.html, mounted via useRef/useEffect |
| TEAM-03 | Team page displays full merch collection ("closet") below the logo | Shopify Storefront API query filtered by team collection handle, reuses existing Merch components |
| TEAM-04 | User can interact with the 3D pixel logo (rotate, zoom, fluid sim behind it) | Mouse/touch/wheel handlers from grid.html, preserved in PixelGrid controller class |
| TEAM-05 | 48 pixelated team logos are available as pixel data for the grid | Pixel data format (flat index arrays), generation pipeline with image-to-grid tooling |
| MTCH-01 | User can see match result after a game finishes | Match detail page queries backend API for match status/score, displays result |
| MTCH-02 | User is notified whether their prediction won or lost | Backend wager status check by email, display outcome badge on match detail page |
| MTCH-03 | Match detail view shows both team logos in the 3D grid | PixelGrid match mode (dual logo, auto-switch timer) already prototyped in grid.html |
| MTCH-04 | Each match generates a one-of-one merch design driven by match data | Generative parameter mapping (score, stats, events to visual params), PixelGrid renders with match-specific configuration |
| MTCH-05 | Generative designs are finalized post-match and become purchasable as unique prints | High-res WebGLRenderTarget export (3600x4800), upload to backend, Shopify product creation |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| three | ^0.183.2 | 3D rendering (grid, fluid sim, generative export) | Current stable; prototype uses r128 but must upgrade for InstancedMesh improvements and WebGLRenderTarget reliability |
| @types/three | ^0.183.x | TypeScript types for Three.js | Required for TS compilation; version must match three |
| react | ^19.2.4 | Already installed | Phase 1 foundation |
| react-router | ^7.13.1 | Already installed, add team/match routes | Phase 1 foundation |
| zustand | ^5.0.12 | Already installed, add match result store | Phase 1 foundation |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| html-to-image | ^1.11 | Alternative canvas export if WebGLRenderTarget approach has issues | Fallback only -- prefer native WebGL export |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vanilla Three.js | React Three Fiber (R3F) | R3F adds declarative scene graph which fights the bespoke fluid sim + grid architecture. Grid.html is already vanilla. Keep it. |
| InstancedMesh | Individual Mesh objects (current prototype) | 1024 individual meshes = 1024 draw calls. InstancedMesh = 2 draw calls (white + transparent). Major perf win, especially for mobile. |
| WebGLRenderTarget export | preserveDrawingBuffer + toDataURL | preserveDrawingBuffer has persistent performance cost. RenderTarget approach renders once at high-res on demand, no ongoing cost. |

**Installation:**
```bash
cd frontend
npm install three
npm install -D @types/three
```

## Architecture Patterns

### Recommended Project Structure

```
frontend/src/
  components/
    grid/
      PixelGrid.tsx           # React wrapper component
      PixelGridController.ts   # All Three.js + WebGL logic (no React)
      FluidSimulation.ts       # Extracted fluid sim (raw WebGL)
      GridMesh.ts              # InstancedMesh grid management
      transitions.ts           # Transition animation functions (wave, spiral, etc.)
    team/
      TeamHeader.tsx           # PixelGrid + team name display
      TeamCloset.tsx           # Merch collection filtered by team
    match/
      MatchDetail.tsx          # Both teams grid + result + prediction outcome
      MatchResult.tsx          # Score display + outcome badge
      GenerativePreview.tsx    # Preview of generated design with export trigger
  data/
    teams.ts                   # Team metadata (name, slug, group, etc.)
    team-logos/
      index.ts                 # Re-exports all 48 logo pixel arrays
      germany.ts               # Individual logo files
      france.ts
      netherlands.ts
      ... (48 files)
  pages/
    Team.tsx                   # /team/:slug page
    MatchDetailPage.tsx        # /match/:id page
  lib/
    generative.ts              # Match data -> visual parameters mapping
    export.ts                  # High-res render + PNG blob creation
  stores/
    teams.ts                   # Team data store (if needed beyond static data)
```

### Pattern 1: React Wrapper for Vanilla Three.js

**What:** A React component that owns a DOM container ref and delegates all 3D logic to a plain TypeScript controller class. React handles mount/unmount lifecycle; the controller handles everything WebGL.

**When to use:** Always when integrating vanilla Three.js with React.

**Example:**
```typescript
// PixelGrid.tsx
import { useRef, useEffect } from 'react';
import { PixelGridController, GridConfig } from './PixelGridController';

interface PixelGridProps {
  logoPixels: number[];          // Pixel indices for the team logo
  matchMode?: {                  // Optional: show two teams
    awayPixels: number[];
    switchInterval: number;      // ms between logo switches
  };
  config?: Partial<GridConfig>;
  onExportReady?: (blob: Blob) => void;
}

export function PixelGrid({ logoPixels, matchMode, config, onExportReady }: PixelGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<PixelGridController | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Prevent double-init in React 18 strict mode
    if (controllerRef.current) return;

    const controller = new PixelGridController(containerRef.current, config);
    controllerRef.current = controller;
    controller.showLogo(logoPixels, 'wave');

    if (matchMode) {
      controller.startMatchMode(logoPixels, matchMode.awayPixels, matchMode.switchInterval);
    }

    return () => {
      controller.dispose();
      controllerRef.current = null;
    };
  }, []); // Empty deps -- controller manages its own updates

  // Update logo when props change (team navigation)
  useEffect(() => {
    controllerRef.current?.showLogo(logoPixels, 'wave');
  }, [logoPixels]);

  return <div ref={containerRef} style={{ width: '100%', height: '60vh' }} />;
}
```

```typescript
// PixelGridController.ts (simplified)
export class PixelGridController {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private fluidSim: FluidSimulation;
  private grid: GridMesh;
  private animationId: number = 0;
  private matchInterval: number | null = null;

  constructor(container: HTMLElement, config?: Partial<GridConfig>) {
    // Initialize Three.js scene, camera, renderer
    // Initialize fluid simulation on separate canvas
    // Create InstancedMesh grid
    // Start animation loop
  }

  showLogo(pixels: number[], transition: string) { /* ... */ }
  startMatchMode(home: number[], away: number[], interval: number) { /* ... */ }

  async exportHighRes(width: number, height: number): Promise<Blob> {
    // Create WebGLRenderTarget at print resolution
    // Render scene to target
    // Read pixels, create ImageData, draw to offscreen canvas
    // Return canvas.toBlob() promise
  }

  dispose() {
    cancelAnimationFrame(this.animationId);
    if (this.matchInterval) clearInterval(this.matchInterval);
    this.renderer.dispose();
    this.fluidSim.dispose();
    this.grid.dispose();
    // Remove canvas from DOM
  }
}
```

### Pattern 2: InstancedMesh for Grid Performance

**What:** Replace 1024 individual Mesh objects with two InstancedMesh instances (one for visible/white cubes, one could be skipped since transparent cubes are invisible). Each instance's transform matrix is updated per-frame during animations.

**When to use:** For the 32x32 grid. The current prototype creates 1024 individual THREE.Mesh objects, each cloning materials. This is 1024 draw calls.

**Example:**
```typescript
// GridMesh.ts
const GRID = 32;
const COUNT = GRID * GRID; // 1024

const geometry = new THREE.BoxGeometry(CELL_SIZE, CELL_SIZE, CELL_SIZE);
const material = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  metalness: 0.1,
  roughness: 0.3,
});

const mesh = new THREE.InstancedMesh(geometry, material, COUNT);
mesh.castShadow = true;
mesh.receiveShadow = true;

// Position each instance
const matrix = new THREE.Matrix4();
const offset = (GRID * (CELL_SIZE + GAP)) / 2;

for (let j = 0; j < GRID; j++) {
  for (let i = 0; i < GRID; i++) {
    const idx = j * GRID + i;
    matrix.setPosition(
      i * (CELL_SIZE + GAP) - offset,
      CELL_SIZE / 2,
      j * (CELL_SIZE + GAP) - offset
    );
    mesh.setMatrixAt(idx, matrix);
  }
}
mesh.instanceMatrix.needsUpdate = true;

// To show/hide individual cubes: set scale to 0 for hidden
// Or use a custom shader with per-instance visibility attribute
```

### Pattern 3: High-Resolution Export via WebGLRenderTarget

**What:** For generative merch, render the scene to an offscreen render target at print resolution (3600x4800 for 12"x16" at 300 DPI), read the pixels, and create a PNG blob.

**When to use:** When exporting a match design for print-on-demand.

**Example:**
```typescript
async function exportHighRes(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  width: number,
  height: number
): Promise<Blob> {
  const renderTarget = new THREE.WebGLRenderTarget(width, height, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType,
  });

  // Render to target
  renderer.setRenderTarget(renderTarget);
  renderer.render(scene, camera);

  // Read pixels
  const pixels = new Uint8Array(width * height * 4);
  renderer.readRenderTargetPixels(renderTarget, 0, 0, width, height, pixels);
  renderer.setRenderTarget(null); // Reset to screen

  // Flip Y (WebGL is bottom-up, canvas is top-down)
  const flipped = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    const srcRow = y * width * 4;
    const dstRow = (height - 1 - y) * width * 4;
    flipped.set(pixels.subarray(srcRow, srcRow + width * 4), dstRow);
  }

  // Create canvas and draw ImageData
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d')!;
  const imageData = new ImageData(new Uint8ClampedArray(flipped.buffer), width, height);
  ctx.putImageData(imageData, 0, 0);

  // Export as PNG blob
  return canvas.convertToBlob({ type: 'image/png' });
}
```

**Critical note:** Maximum WebGL texture size varies by device. Most modern GPUs support 4096x4096 or 8192x8192. Check `renderer.capabilities.maxTextureSize` before attempting large renders. For 3600x4800, this is well within limits. For very large prints (e.g., 24"x36" at 300 DPI = 7200x10800), you may need to tile-render and stitch.

### Pattern 4: Match Data to Visual Parameters Mapping

**What:** A pure function that takes match statistics and outputs visual configuration for the grid renderer.

**When to use:** After a match finishes, to generate the unique design.

**Example:**
```typescript
interface MatchStats {
  homeScore: number;
  awayScore: number;
  possession: [number, number];   // [home%, away%]
  shots: [number, number];
  shotsOnTarget: [number, number];
  corners: [number, number];
  fouls: [number, number];
  yellowCards: [number, number];
  redCards: [number, number];
  events: MatchEvent[];           // goals, cards, subs with minute
}

interface GenerativeConfig {
  // Grid parameters
  gridScale: number;              // 0.3 - 1.5
  gridRotation: number;           // 0 - 360 degrees
  shapeMode: 'cube' | 'sphere';
  darkMode: boolean;

  // Fluid parameters
  fluidIntensity: number;         // maps from total goals
  fluidColor: [number, number, number]; // derived from winning team colors
  splatCount: number;             // maps from total shots

  // Composition
  logoBlend: number;              // 0-1, how much home vs away logo shows
  transitionStyle: string;        // determined by goal difference

  // Metadata embedded in design
  matchTitle: string;
  score: string;
  date: string;
}

function matchToGenerativeConfig(
  stats: MatchStats,
  homeTeam: TeamData,
  awayTeam: TeamData
): GenerativeConfig {
  const totalGoals = stats.homeScore + stats.awayScore;
  const goalDiff = Math.abs(stats.homeScore - stats.awayScore);

  return {
    gridScale: 0.8 + (totalGoals * 0.05),
    gridRotation: (stats.possession[0] / 100) * 360,
    shapeMode: totalGoals > 4 ? 'sphere' : 'cube',
    darkMode: stats.homeScore > stats.awayScore,
    fluidIntensity: Math.min(totalGoals * 0.15, 1.0),
    fluidColor: stats.homeScore >= stats.awayScore
      ? homeTeam.primaryColor : awayTeam.primaryColor,
    splatCount: stats.shots[0] + stats.shots[1],
    logoBlend: stats.possession[0] / 100,
    transitionStyle: goalDiff === 0 ? 'wave'
      : goalDiff === 1 ? 'spiral'
      : goalDiff >= 3 ? 'diagonal' : 'random',
    matchTitle: `${homeTeam.name} vs ${awayTeam.name}`,
    score: `${stats.homeScore} - ${stats.awayScore}`,
    date: new Date().toISOString().split('T')[0],
  };
}
```

### Anti-Patterns to Avoid

- **Storing Three.js state in React state:** Never put camera position, rotation values, animation progress, or any per-frame values in `useState`. This causes 60fps re-renders. Use refs or plain class properties.

- **Creating new materials/geometries per frame:** The prototype clones materials during `flipVector`. With InstancedMesh, material is shared across all instances. Use per-instance attributes (color, visibility) instead of cloning.

- **Mounting multiple WebGL contexts:** The fluid sim and the grid each use separate WebGL contexts in the prototype. In the React SPA, be careful about GPU memory. Consider whether the fluid sim can be composited as a texture within the Three.js scene rather than a separate canvas (saves one WebGL context).

- **Not disposing Three.js resources:** When navigating away from a team/match page, the entire scene (geometries, materials, textures, render targets, WebGL context) must be disposed. Memory leaks from undisposed Three.js resources will crash mobile browsers after a few page navigations.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image-to-pixel-grid conversion | Manual pixel-by-pixel tracing for 48 logos | Canvas-based downscaling script (see below) | 48 logos x 1-3 hours manual = 50-150 hours. A script does it in seconds with hand-refinement after. |
| Three.js lifecycle in React | Custom event system for React-Three communication | Controller class pattern with useRef | Well-established pattern, avoids state sync bugs |
| Flip animation system | CSS transitions or React animation libraries | Keep existing requestAnimationFrame approach | The prototype's flip animation is already clean and performant |
| High-res image stitching | Custom tile renderer for very large canvases | Single WebGLRenderTarget up to GPU max texture size | 3600x4800 is within all modern GPU limits (min 4096x4096, most 8192+) |

**Key insight:** The biggest "don't hand-roll" item is the 48-team pixel art library. Use a script:

```typescript
// tools/logo-to-pixels.ts
// Downscale a team logo image to 32x32 and extract pixel indices
function imageToPixelIndices(imagePath: string, threshold: number = 128): number[] {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;

  const img = new Image();
  img.src = imagePath;
  ctx.drawImage(img, 0, 0, 32, 32);

  const imageData = ctx.getImageData(0, 0, 32, 32);
  const indices: number[] = [];

  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const i = (y * 32 + x) * 4;
      const brightness = (imageData.data[i] + imageData.data[i+1] + imageData.data[i+2]) / 3;
      if (brightness > threshold) {
        indices.push(y * 32 + x + 1); // 1-indexed like existing data
      }
    }
  }
  return indices;
}
```

Then hand-refine each output. This cuts the 50-150 hour estimate to ~15-30 hours (script + review + tweaks).

## Common Pitfalls

### Pitfall 1: React 18 Strict Mode Double-Mount

**What goes wrong:** Three.js scene initializes twice, creating duplicate WebGL contexts and canvases.
**Why it happens:** React 18 strict mode mounts, unmounts, and remounts components in development to detect side effects.
**How to avoid:** Use a ref guard: `if (controllerRef.current) return;` at the top of the useEffect. Also ensure the cleanup function properly disposes everything so the second mount works correctly.
**Warning signs:** Two canvases visible, doubled GPU memory usage in dev mode.

### Pitfall 2: WebGL Context Limits

**What goes wrong:** Browser refuses to create another WebGL context, showing blank canvas or errors.
**Why it happens:** Browsers limit WebGL contexts (typically 8-16). The prototype uses 2 contexts (fluid sim + Three.js). If the user navigates between team pages without proper cleanup, contexts accumulate.
**How to avoid:** Always call `renderer.dispose()` and `gl.getExtension('WEBGL_lose_context')?.loseContext()` in cleanup. Consider merging the fluid sim into the Three.js scene as a fullscreen quad with custom shader (1 context instead of 2).
**Warning signs:** Console warning "Too many active WebGL contexts", blank canvas on page navigation.

### Pitfall 3: Print Resolution GPU Limits

**What goes wrong:** `readRenderTargetPixels` returns black or garbage data for large render targets.
**Why it happens:** GPU max texture size exceeded. While most modern GPUs support 8192x8192+, some mobile GPUs cap at 4096x4096.
**How to avoid:** Check `renderer.capabilities.maxTextureSize` before creating the render target. For mobile, cap at 4096 on the longest dimension and adjust DPI expectation accordingly (4096/16" = 256 DPI, still acceptable for most POD).
**Warning signs:** Black exported images, WebGL errors in console.

### Pitfall 4: Fluid Sim + Three.js Canvas Layering

**What goes wrong:** Fluid sim appears above/below the grid incorrectly, or mouse events don't reach the right canvas.
**Why it happens:** The prototype uses CSS `position: fixed` with `z-index` to layer two canvases. In a React SPA with scroll and other UI, this layering breaks.
**How to avoid:** Either: (a) Keep the two-canvas approach but constrain both to a positioned container div, or (b) merge the fluid sim output as a background texture in the Three.js scene. Option (b) is cleaner long-term but requires porting the fluid shaders to Three.js ShaderMaterial.
**Warning signs:** Grid cubes invisible, fluid sim covering the entire page, pointer events not working on the grid.

### Pitfall 5: Memory Leaks on Page Navigation

**What goes wrong:** Mobile browser crashes or becomes sluggish after navigating between several team pages.
**Why it happens:** Three.js geometries, materials, textures, and render targets are not automatically garbage collected -- they must be explicitly disposed.
**How to avoid:** The controller's `dispose()` method must call `.dispose()` on every geometry, material, texture, and render target. Use `scene.traverse()` to catch everything.
**Warning signs:** Increasing GPU memory in DevTools performance monitor, eventual crash on mobile.

## Code Examples

### Team Page Route and Component

```typescript
// App.tsx additions
<Route path="/team/:slug" element={<Team />} />
<Route path="/match/:id" element={<MatchDetailPage />} />

// pages/Team.tsx
import { useParams } from 'react-router';
import { getTeamBySlug } from '../data/teams';
import { TeamHeader } from '../components/team/TeamHeader';
import { TeamCloset } from '../components/team/TeamCloset';

export function Team() {
  const { slug } = useParams<{ slug: string }>();
  const team = getTeamBySlug(slug!);
  if (!team) return <div>Team not found</div>;

  return (
    <>
      <TeamHeader team={team} />
      <TeamCloset teamSlug={team.slug} />
    </>
  );
}
```

### Team Data Structure

```typescript
// data/teams.ts
export interface TeamData {
  name: string;
  slug: string;           // URL-safe: "south-korea", "cote-d-ivoire"
  code: string;           // FIFA code: "GER", "FRA", "NED"
  group: string;          // "A" through "L"
  flag: string;           // emoji flag
  logoPixels: number[];   // 1-indexed pixel positions for 32x32 grid
  primaryColor: [number, number, number]; // RGB 0-1 for generative design
}

// Generate from matches.ts team names
export const TEAMS: TeamData[] = [
  {
    name: 'Mexico',
    slug: 'mexico',
    code: 'MEX',
    group: 'A',
    flag: '\u{1F1F2}\u{1F1FD}',
    logoPixels: [], // To be filled
    primaryColor: [0.0, 0.39, 0.25],
  },
  // ... 47 more
];

export function getTeamBySlug(slug: string): TeamData | undefined {
  return TEAMS.find(t => t.slug === slug);
}

export function getTeamByName(name: string): TeamData | undefined {
  return TEAMS.find(t => t.name === name);
}
```

### Pixel Data File Format

```typescript
// data/team-logos/germany.ts
// 1-indexed pixel positions that should be WHITE (visible) in the 32x32 grid
// Pixel 1 = top-left (row 0, col 0), Pixel 1024 = bottom-right (row 31, col 31)
export const GERMANY_PIXELS: number[] = [
  77,78,79,80,81,82,83,84,
  107,108,109,110,111,112,113,114,115,116,117,118,
  // ... (existing data from grid.html)
];
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Individual Mesh per grid cell | InstancedMesh for all cells | Three.js r125+ (2022) | 1024 draw calls -> 1-2 draw calls. Major mobile perf improvement. |
| preserveDrawingBuffer for screenshots | WebGLRenderTarget + readRenderTargetPixels | Always available, but RenderTarget is better practice | No persistent perf cost from preserveDrawingBuffer. On-demand high-res. |
| canvas.toBlob() for export | OffscreenCanvas.convertToBlob() (Promise-based) | Modern browsers (2023+) | Cleaner async API, works off main thread |
| Three.js r128 (prototype) | Three.js r183 (current) | Ongoing releases | Better memory management, WebGPU support (not needed for v1), improved shadow maps |

**Deprecated/outdated:**
- Three.js r128 (used in grid.html CDN): Upgrade to r183. The InstancedMesh API is stable across both versions, but r183 has significant memory and shader compilation improvements.
- The prototype loads Three.js from CDN (`cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`). In the React app, import from npm package.

## Open Questions

1. **Fluid sim as separate canvas vs. merged into Three.js scene**
   - What we know: The prototype uses 2 WebGL contexts (separate canvases). This works but uses 2 GPU contexts.
   - What's unclear: Whether porting the fluid sim into a Three.js fullscreen quad with custom ShaderMaterial is worth the effort for v1.
   - Recommendation: Keep 2 canvases for v1 (proven approach from prototype). Merge in v2 if context limits become a problem. Constrain both canvases to a container div rather than using `position: fixed`.

2. **48 team logos -- how many are blockers for launch?**
   - What we know: Only 3 logos exist (Germany, Netherlands/Amsterdam, France). 48 needed total. The logo-to-pixels script can accelerate creation.
   - What's unclear: Whether all 48 must be ready before Phase 2 is "done" or if a subset (e.g., the 24 teams from match data) suffices.
   - Recommendation: Prioritize the 24 teams that appear in the existing match fixtures. Use a placeholder (team's first letter rendered in the grid) for any team without pixel art. This unblocks the code work from the art work.

3. **Generative design aesthetic -- what makes each design unique enough?**
   - What we know: Match stats map to grid parameters (scale, rotation, shape, fluid colors, transition style).
   - What's unclear: Whether parameter mapping alone creates visually distinct designs, or if additional visual elements (text overlay, border design, match event timeline) are needed.
   - Recommendation: Start with parameter mapping only. Generate 5-10 test designs from varied match stats and evaluate visual distinctiveness. Add overlay elements if needed.

4. **Client-side vs. server-side generative render**
   - What we know: Architecture decision is client-side for v1 (admin triggers render in browser, uploads PNG).
   - What's unclear: How to trigger the render -- manual admin action, or automated via a hidden page that loads match data and auto-exports?
   - Recommendation: Build a `/admin/generate/:matchId` route that loads match data, renders the design, shows a preview, and has an "Upload to Printful" button. Semi-automated for v1.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `frontend/vitest.config.ts` |
| Quick run command | `cd frontend && npx vitest run --reporter=verbose` |
| Full suite command | `cd frontend && npx vitest run` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEAM-01 | Team page renders for valid slug | unit | `npx vitest run src/pages/Team.test.tsx -t "renders team page"` | No -- Wave 0 |
| TEAM-02 | PixelGrid component mounts and creates canvas | unit | `npx vitest run src/components/grid/PixelGrid.test.tsx` | No -- Wave 0 |
| TEAM-03 | Team closet queries Shopify by team collection | unit | `npx vitest run src/components/team/TeamCloset.test.tsx` | No -- Wave 0 |
| TEAM-04 | PixelGrid controller handles mouse/touch events | manual-only | N/A (requires WebGL context) | N/A |
| TEAM-05 | All 48 team logo pixel arrays are valid (non-empty, indices 1-1024) | unit | `npx vitest run src/data/team-logos/logos.test.ts` | No -- Wave 0 |
| MTCH-01 | Match detail page shows score for finished match | unit | `npx vitest run src/pages/MatchDetailPage.test.tsx -t "shows score"` | No -- Wave 0 |
| MTCH-02 | Wager outcome displayed correctly | unit | `npx vitest run src/components/match/MatchResult.test.tsx` | No -- Wave 0 |
| MTCH-03 | PixelGrid match mode initializes with two logos | manual-only | N/A (requires WebGL context) | N/A |
| MTCH-04 | matchToGenerativeConfig produces valid config | unit | `npx vitest run src/lib/generative.test.ts` | No -- Wave 0 |
| MTCH-05 | exportHighRes returns a PNG Blob | manual-only | N/A (requires WebGL context) | N/A |

### Sampling Rate

- **Per task commit:** `cd frontend && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd frontend && npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `frontend/src/pages/Team.test.tsx` -- covers TEAM-01
- [ ] `frontend/src/components/grid/PixelGrid.test.tsx` -- covers TEAM-02 (mock WebGL)
- [ ] `frontend/src/components/team/TeamCloset.test.tsx` -- covers TEAM-03
- [ ] `frontend/src/data/team-logos/logos.test.ts` -- covers TEAM-05 (validate all logo arrays)
- [ ] `frontend/src/pages/MatchDetailPage.test.tsx` -- covers MTCH-01, MTCH-02
- [ ] `frontend/src/lib/generative.test.ts` -- covers MTCH-04

Note: TEAM-04, MTCH-03, and MTCH-05 require WebGL context and are manual-only (test in browser). Vitest with jsdom cannot create WebGL contexts.

## Sources

### Primary (HIGH confidence)

- [Three.js r183 official docs](https://threejs.org/docs/) -- InstancedMesh, WebGLRenderTarget, WebGLRenderer
- [Three.js InstancedMesh docs](https://threejs.org/docs/pages/InstancedMesh.html) -- API for instanced rendering
- [Three.js WebGLRenderer docs](https://threejs.org/docs/pages/WebGLRenderer.html) -- readRenderTargetPixels, preserveDrawingBuffer
- Three.js npm: version 0.183.2 (verified via `npm view three version`)
- Existing `grid.html` prototype -- working implementation of fluid sim + grid + logo transitions

### Secondary (MEDIUM confidence)

- [Three.js forum: Exporting high-resolution images](https://discourse.threejs.org/t/exporting-high-resolution-images-of-the-canvas/89030) -- community patterns for high-res export
- [Three.js forum: Ultra high resolution](https://discourse.threejs.org/t/how-can-i-get-ultra-high-resolution-in-three-js/40519) -- render target approach validation
- [Integrating Three.js with React](https://medium.com/@alfinohatta/integrating-three-js-278774d45973) -- useRef/useEffect patterns
- [React Three.js integration gist](https://gist.github.com/aarosil/c370d8beb6aa0f7166bf6ba4a4270928) -- controller class pattern
- [FIFA World Cup 2026 qualified teams](https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/world-cup-2026-who-has-qualified) -- 42 of 48 confirmed as of March 2026

### Tertiary (LOW confidence)

- InstancedMesh performance claims (can be slower in some cases per [GitHub issue #30352](https://github.com/mrdoob/three.js/issues/30352)) -- need to benchmark with 1024 cubes specifically
- Fluid sim as Three.js ShaderMaterial viability -- not yet validated, recommended to defer to v2

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Three.js r183, React 19, existing prototype validates the approach
- Architecture: MEDIUM-HIGH -- React+Three.js integration pattern is well-established, but the specific fluid sim + grid combo has prototype-only validation
- Pitfalls: HIGH -- WebGL context limits, memory leaks, and strict mode double-mount are well-documented issues
- Generative pipeline: MEDIUM -- The parameter mapping concept is sound but visual quality needs empirical validation with real match data
- Pixel art library: MEDIUM -- Script-assisted approach is validated conceptually but the 48-team effort is still significant

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable domain, Three.js releases are incremental)
