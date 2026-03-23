---
phase: 2
slug: team-match-visuals
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x |
| **Config file** | frontend/vitest.config.ts (exists from Phase 1) |
| **Quick run command** | `cd frontend && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd frontend && npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd frontend && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd frontend && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | TEAM-02, TEAM-04 | unit | `npx vitest run src/components/grid/PixelGrid.test.tsx` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | TEAM-05 | unit | `npx vitest run src/data/team-logos/logos.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | TEAM-01, TEAM-03 | unit | `npx vitest run src/pages/Team.test.tsx` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | MTCH-01, MTCH-02, MTCH-03 | unit | `npx vitest run src/pages/MatchDetailPage.test.tsx` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 2 | MTCH-04 | unit | `npx vitest run src/lib/generative.test.ts` | ❌ W0 | ⬜ pending |
| 02-04-01 | 04 | 3 | MTCH-05 | manual | N/A (requires WebGL) | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `frontend/src/components/grid/PixelGrid.test.tsx` — covers TEAM-02 (mock WebGL context)
- [ ] `frontend/src/data/team-logos/logos.test.ts` — covers TEAM-05 (validate all 48 logo arrays)
- [ ] `frontend/src/pages/Team.test.tsx` — covers TEAM-01, TEAM-03
- [ ] `frontend/src/pages/MatchDetailPage.test.tsx` — covers MTCH-01, MTCH-02
- [ ] `frontend/src/lib/generative.test.ts` — covers MTCH-04
- [ ] `frontend/src/components/team/TeamCloset.test.tsx` — covers TEAM-03

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PixelGrid interactive drag/zoom | TEAM-04 | Requires WebGL context | Open team page → drag to rotate, scroll to zoom |
| Match mode dual-logo display | MTCH-03 | Requires WebGL context | Open match detail → verify both team logos render and cycle |
| High-res PNG export | MTCH-05 | Requires WebGL context | Open admin generate → click export → verify 3600x4800 PNG |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
