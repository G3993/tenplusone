---
phase: 02-team-match-visuals
plan: 02
subsystem: ui
tags: [react, three.js, shopify, routing, team-pages]

requires:
  - phase: 02-01
    provides: "PixelGrid component, team data (TEAMS, getTeamBySlug), team-logos (getLogoPixels)"
  - phase: 01-02
    provides: "Shopify client, ProductCard, fetchProducts"
provides:
  - "Team page route (/team/:slug) with 3D pixel logo + merch"
  - "TeamHeader component (PixelGrid + team identity)"
  - "TeamCloset component (team-filtered merch collection)"
  - "fetchProductsByCollection for collection-scoped Shopify queries"
  - "ProductGrid teamFilter prop for organized-by-team merch"
  - "Clickable team links in match list"
affects: [02-03, 02-04, 03-commerce-fulfillment]

tech-stack:
  added: []
  patterns: ["Collection-scoped Shopify GraphQL queries", "URL param to data lookup (useParams + getTeamBySlug)"]

key-files:
  created:
    - frontend/src/pages/Team.tsx
    - frontend/src/pages/Team.module.css
    - frontend/src/components/team/TeamHeader.tsx
    - frontend/src/components/team/TeamHeader.module.css
    - frontend/src/components/team/TeamCloset.tsx
    - frontend/src/components/team/TeamCloset.module.css
  modified:
    - frontend/src/lib/shopify.ts
    - frontend/src/App.tsx
    - frontend/src/components/merch/ProductGrid.tsx
    - frontend/src/components/matches/MatchList.tsx

key-decisions:
  - "TeamCloset uses separate fetchProductsByCollection rather than filtering client-side -- server-scoped query is more efficient"
  - "TBD teams render as plain text in match list (no broken links)"
  - "Line counter starts at 100 in TeamCloset to avoid overlap with TeamHeader line numbers"

patterns-established:
  - "Team page pattern: useParams slug -> getTeamBySlug -> render components with team data"
  - "Collection-filtered merch: fetchProductsByCollection with Shopify collection handle"

requirements-completed: [TEAM-01, TEAM-03]

duration: 5min
completed: 2026-03-23
---

# Phase 2 Plan 2: Team Pages Summary

**Team pages with 3D pixel logo header, team-filtered merch closet, and clickable team links in match browser**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-23T02:08:46Z
- **Completed:** 2026-03-23T02:13:46Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Team page at /team/:slug renders TeamHeader (PixelGrid with team logo) and TeamCloset (team-filtered merch)
- ProductGrid accepts optional teamFilter prop for collection-scoped product fetching
- Match list team names are clickable links to team pages (TBD teams excluded)
- fetchProductsByCollection added to shopify.ts with collection GraphQL query

## Task Commits

Each task was committed atomically:

1. **Task 1: Build Team page with TeamHeader and TeamCloset components** - `f12d7ba` (feat)
2. **Task 2: Add team route and update navigation with team links** - `c1b8a86` (feat)

## Files Created/Modified
- `frontend/src/pages/Team.tsx` - Team page route component, resolves slug to team data
- `frontend/src/pages/Team.module.css` - Page container styles
- `frontend/src/components/team/TeamHeader.tsx` - Team identity display with PixelGrid logo
- `frontend/src/components/team/TeamHeader.module.css` - Header typography styles
- `frontend/src/components/team/TeamCloset.tsx` - Team-filtered merch collection section
- `frontend/src/components/team/TeamCloset.module.css` - Closet section spacing
- `frontend/src/lib/shopify.ts` - Added fetchProductsByCollection with collection GraphQL query
- `frontend/src/App.tsx` - Added /team/:slug route
- `frontend/src/components/merch/ProductGrid.tsx` - Added optional teamFilter prop
- `frontend/src/components/matches/MatchList.tsx` - Team names link to /team/:slug pages

## Decisions Made
- TeamCloset uses fetchProductsByCollection for server-scoped queries rather than client-side filtering
- TBD teams (code === 'TBD') render as plain text, not links, to avoid broken routes
- Line counter starts at 100 in TeamCloset to visually separate from TeamHeader numbering

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed incorrect team link route path in MatchList**
- **Found during:** Task 2
- **Issue:** MatchList used `/teams/` path prefix but route is `/team/` (singular). Also used inline slug generation instead of getTeamByName lookup
- **Fix:** Changed to `/team/${team.slug}` using getTeamByName for proper slug resolution
- **Files modified:** frontend/src/components/matches/MatchList.tsx
- **Verification:** TypeScript compiles, links match route definition
- **Committed in:** c1b8a86

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Fix was necessary for team links to work. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Team pages ready for all 48 teams (3 with real logos, 45 with placeholder letters)
- Match browser links navigate to team pages
- ProductGrid teamFilter ready for use in any context needing team-scoped merch
- Ready for 02-03 (match detail) and 02-04 (group visualizations)

## Self-Check: PASSED

All 7 created files verified present. Both commits (f12d7ba, c1b8a86) verified in git log. All acceptance criteria grep checks pass.

---
*Phase: 02-team-match-visuals*
*Completed: 2026-03-23*
