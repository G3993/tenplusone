---
phase: 01-commerce-foundation
plan: 01
subsystem: ui
tags: [react, vite, typescript, zustand, css-modules, react-router, terminal-ui, geist-mono]

# Dependency graph
requires:
  - phase: none
    provides: "First plan, no dependencies"
provides:
  - "Vite + React + TypeScript SPA scaffold"
  - "Terminal design system (tokens, Line, Nav, Editor components)"
  - "Match browser with 24 matches and odds buttons"
  - "Bet slip with Zustand persist store"
  - "Group filtering (12 groups, A-L)"
  - "React Router navigation (matches, groups, slip, merch placeholder)"
  - "Vitest test infrastructure"
affects: [01-02, 01-03, 02-01, 02-02]

# Tech tracking
tech-stack:
  added: [react, react-dom, react-router, zustand, vite, vitest, "@testing-library/react", "@testing-library/jest-dom", jsdom, typescript]
  patterns: [css-modules, zustand-persist, line-number-layout, react-router-spa]

key-files:
  created:
    - frontend/src/styles/tokens.css
    - frontend/src/styles/global.css
    - frontend/src/components/layout/Line.tsx
    - frontend/src/components/layout/Nav.tsx
    - frontend/src/components/layout/Editor.tsx
    - frontend/src/components/matches/MatchList.tsx
    - frontend/src/components/matches/OddsButton.tsx
    - frontend/src/components/slip/BetSlip.tsx
    - frontend/src/stores/slip.ts
    - frontend/src/stores/matches.ts
    - frontend/src/data/matches.ts
    - frontend/src/data/groups.ts
    - frontend/src/pages/Matches.tsx
    - frontend/src/pages/Groups.tsx
    - frontend/src/pages/BetSlipPage.tsx
    - frontend/src/App.tsx
  modified: []

key-decisions:
  - "Used CSS Modules for component-scoped styles instead of global CSS or styled-components"
  - "Zustand with persist middleware for bet slip state (localStorage key: tenplusone-slip)"
  - "Line component with useLineCounter hook as foundational terminal UI primitive"
  - "Green (#4ade80) restricted to hover states only per FRNT-02 requirement"

patterns-established:
  - "Line/Blank components: all content rendered through terminal line-number layout"
  - "CSS custom properties in tokens.css: --bg, --white, --bright, --dim, --faint, --line-num, --green, --font"
  - "CSS Modules with .module.css suffix for component styles"
  - "Zustand stores in src/stores/ with TypeScript interfaces"
  - "Data files in src/data/ with exported TypeScript types and const arrays"
  - "Page components in src/pages/ as thin wrappers around feature components"

requirements-completed: [FRNT-01, FRNT-02, FRNT-03, FRNT-04, COMM-01, COMM-02]

# Metrics
duration: ~45min
completed: 2026-03-22
---

# Phase 1 Plan 01: SPA Scaffold Summary

**Vite + React + TypeScript SPA with terminal design system (Geist Mono, line numbers, monochrome palette), match browser with 24 matches and odds selection, bet slip with Zustand persist, and group filtering**

## Performance

- **Duration:** ~45 min (across checkpoint)
- **Started:** 2026-03-22
- **Completed:** 2026-03-23T00:48:41Z
- **Tasks:** 3 (2 auto + 1 checkpoint verification)
- **Files created:** 33

## Accomplishments
- Terminal design system extracted from prototype: CSS tokens, Line/Blank/useLineCounter components, Nav, Editor layout
- Match browser with 24 World Cup 2026 matches, odds buttons, and group filtering (A-L)
- Bet slip with Zustand persist store (add/remove/toggle predictions, wager selection)
- React Router navigation between matches, groups, slip, and merch placeholder
- Responsive layout at 560px breakpoint
- Vitest test infrastructure configured

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Vite + React + TypeScript project with terminal design system** - `6b22c3b` (feat)
2. **Task 2: Build match browser, group view, and bet slip with Zustand state** - `2d4e599` (feat)
3. **Task 3: Verify terminal aesthetic and interactions** - checkpoint:human-verify (approved, no code commit)

## Files Created/Modified
- `frontend/package.json` - Project dependencies (React, Zustand, React Router, Vitest)
- `frontend/vite.config.ts` - Vite configuration with React plugin
- `frontend/vitest.config.ts` - Vitest configuration with jsdom environment
- `frontend/index.html` - HTML entry point
- `frontend/src/main.tsx` - React app entry, imports global styles
- `frontend/src/App.tsx` - React Router with routes for matches, groups, slip, merch
- `frontend/src/styles/tokens.css` - CSS custom properties (design tokens)
- `frontend/src/styles/global.css` - Global styles, font import, reset, utility classes
- `frontend/src/components/layout/Line.tsx` - Line number component (Line, Blank, useLineCounter)
- `frontend/src/components/layout/Nav.tsx` - Sticky navigation bar with slip badge
- `frontend/src/components/layout/Editor.tsx` - Page wrapper component
- `frontend/src/components/matches/MatchList.tsx` - Match browser with group filter tabs
- `frontend/src/components/matches/OddsButton.tsx` - Odds selection button with toggle
- `frontend/src/components/slip/BetSlip.tsx` - Bet slip with remove/clear/wager controls
- `frontend/src/stores/slip.ts` - Zustand store with persist (toggleBet, removeBet, setWager, clear)
- `frontend/src/stores/matches.ts` - Zustand store for group filter state
- `frontend/src/data/matches.ts` - 24 matches with types (Match, MATCHES, OUTRIGHTS)
- `frontend/src/data/groups.ts` - 12 groups with types (Group, GROUPS)
- `frontend/src/pages/Matches.tsx` - Matches page component
- `frontend/src/pages/Groups.tsx` - Groups page with 12 group tables
- `frontend/src/pages/BetSlipPage.tsx` - Bet slip page component

## Decisions Made
- Used CSS Modules for component-scoped styles -- avoids global namespace collisions while keeping styles co-located with components
- Zustand with persist middleware for bet slip state -- simple API, built-in localStorage serialization
- Line component as foundational UI primitive -- every piece of content goes through Line for consistent terminal aesthetic
- Green (#4ade80) restricted to hover states only -- per FRNT-02 requirement, never used as default color

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Frontend scaffold complete, ready for Shopify Storefront API integration (Plan 01-02)
- Design tokens and component patterns established for all future UI work
- Bet slip store ready for wager-to-merch linking in Plan 01-02
- React Router structure ready for team pages (Phase 2)

## Self-Check: PASSED

- FOUND: frontend/src/styles/tokens.css
- FOUND: frontend/src/components/layout/Line.tsx
- FOUND: frontend/src/stores/slip.ts
- FOUND: frontend/src/components/matches/MatchList.tsx
- FOUND: commit 6b22c3b
- FOUND: commit 2d4e599

---
*Phase: 01-commerce-foundation*
*Completed: 2026-03-23*
