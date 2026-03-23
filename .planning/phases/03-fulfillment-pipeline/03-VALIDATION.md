---
phase: 3
slug: fulfillment-pipeline
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (api/vitest.config.ts) |
| **Config file** | api/vitest.config.ts (exists from Phase 1) |
| **Quick run command** | `cd api && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd api && npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd api && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd api && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | FULF-01 | unit | `cd api && npx vitest run` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | FULF-02 | unit | `cd api && npx vitest run` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | FULF-03 | manual | N/A (external service) | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `api/src/services/printful.test.ts` — covers FULF-01 (mock Printful API responses)
- [ ] `api/src/routes/designs.test.ts` — covers FULF-02 (R2 upload + Printful product creation)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| R2 bucket publicly accessible | FULF-02 (ops) | External service config | Upload test file → verify public URL returns 200 |
| Printful product appears in dashboard | FULF-02 (ops) | External service | Create test product → verify in Printful dashboard |
| Printful syncs product to Shopify | FULF-01 (ops) | External service integration | Create Printful product → verify appears in Shopify admin |
| Order auto-routes to Printful | FULF-03 | External service integration | Place test order in Shopify → verify order appears in Printful |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
