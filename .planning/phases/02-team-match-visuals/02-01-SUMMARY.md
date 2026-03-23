---
phase: 02-team-match-visuals
plan: 01
subsystem: ui
tags: [three.js, webgl, fluid-simulation, instanced-mesh, react, pixel-grid]

requires:
  - phase: 01-commerce-foundation
    provides: React app shell, component patterns, data structures
provides:
  - PixelGrid React component with Three.js 3D cube grid
  - FluidSimulation WebGL2 class with chrome display shader
  - GridMesh InstancedMesh-based 1024-cell grid manager
  - 6 transition types for logo animations
  - 48-team data registry with TeamData interface
  - 3 real logo pixel arrays (Germany, France, Netherlands)
  - Placeholder letter generator for remaining 45 teams
affects: [02-02, 02-03, 02-04, team-pages, match-views, generative-export]

tech-stack:
  added: [three, "@types/three"]
  patterns: [InstancedMesh for batch rendering, WebGL2 fluid sim class encapsulation, useRef controller pattern for Three.js in React]

key-files:
  created:
    - frontend/src/components/grid/FluidSimulation.ts
    - frontend/src/components/grid/GridMesh.ts
    - frontend/src/components/grid/transitions.ts
    - frontend/src/components/grid/PixelGridController.ts
    - frontend/src/components/grid/PixelGrid.tsx
    - frontend/src/components/grid/PixelGrid.module.css
    - frontend/src/data/teams.ts
    - frontend/src/data/team-logos/index.ts
    - frontend/src/data/team-logos/germany.ts
    - frontend/src/data/team-logos/france.ts
    - frontend/src/data/team-logos/netherlands.ts
    - frontend/src/data/team-logos/placeholder.ts
  modified:
    - frontend/package.json
    - frontend/package-lock.json

key-decisions:
  - "InstancedMesh with per-cell scale animation instead of 1024 individual meshes -- 1 draw call vs 1024"
  - "Cell flip animation via setCellMatrix in animation loop instead of cloning materials per flip"
  - "Fluid sim canvas and Three.js canvas layered via CSS z-index (matching prototype approach)"
  - "Placeholder logos use simple 5x7 bitmap font letters centered in 32x32 grid"

patterns-established:
  - "Controller pattern: Three.js state lives in class, React only holds ref -- no React state for per-frame values"
  - "FluidSimulation.attachPointerEvents() returns cleanup function for React useEffect"
  - "Team data keyed by slug for URL routing, with helpers for lookup by name/code/group"

requirements-completed: [TEAM-02, TEAM-04, TEAM-05]

duration: 6min
completed: 2026-03-23
---

# Phase 2 Plan 1: Grid Engine + Team Data Summary

**Three.js InstancedMesh pixel grid with WebGL2 fluid simulation, 6 transition animations, and 48-team data registry with 3 real pixel logos**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-23T01:59:20Z
- **Completed:** 2026-03-23T02:05:44Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- Extracted ~800 lines of grid.html prototype into 5 typed TypeScript modules
- InstancedMesh approach: 1 draw call for 1024 cells instead of 1024 individual meshes
- All 6 transition types (wave, spiral, random, rows, columns, diagonal) with exact delay formulas from prototype
- 48-team registry covering all World Cup 2026 groups A-L with accurate FIFA codes and emoji flags

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract Three.js grid engine into typed TypeScript modules** - `54b48c2` (feat)
2. **Task 2: Create 48-team data infrastructure with logo pixel arrays** - `108a5aa` (feat)

## Files Created/Modified
- `frontend/src/components/grid/FluidSimulation.ts` - WebGL2 fluid sim with chrome display, pointer events
- `frontend/src/components/grid/GridMesh.ts` - InstancedMesh grid with cube/sphere toggle, shadow plane
- `frontend/src/components/grid/transitions.ts` - 6 transition delay calculators
- `frontend/src/components/grid/PixelGridController.ts` - Scene/camera/lighting/animation orchestrator
- `frontend/src/components/grid/PixelGrid.tsx` - React wrapper with useRef/useEffect lifecycle
- `frontend/src/components/grid/PixelGrid.module.css` - Container styles
- `frontend/src/data/teams.ts` - 48 TeamData entries with lookup helpers
- `frontend/src/data/team-logos/germany.ts` - Exact pixel array from prototype
- `frontend/src/data/team-logos/france.ts` - Exact pixel array from prototype
- `frontend/src/data/team-logos/netherlands.ts` - Exact pixel array from prototype (was "amsterdam")
- `frontend/src/data/team-logos/placeholder.ts` - A-Z bitmap letter generator
- `frontend/src/data/team-logos/index.ts` - Re-exports with getLogoPixels fallback

## Decisions Made
- InstancedMesh with scale-based visibility (0,0,0 vs 1,1,1) instead of 1024 individual meshes
- Cell flip animation handled via animation state map in controller's animation loop (not per-cell material clones)
- Fluid sim and Three.js are two separate canvases layered via CSS z-index, matching prototype architecture
- Placeholder logos use centered 5x7 bitmap font of the team's first letter
- TBD playoff teams included with neutral gray primary color and white flag emoji

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- PixelGrid component ready for integration into team pages (02-02) and match views (02-03)
- Team data registry ready for all downstream consumers
- 45 placeholder logos need real pixel art eventually (documented in research as 50-150 hours of design work)

---
*Phase: 02-team-match-visuals*
*Completed: 2026-03-23*

## Self-Check: PASSED

All 12 created files verified on disk. Both task commits (54b48c2, 108a5aa) found in git log.
