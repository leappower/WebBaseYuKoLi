# Baseline Test Results — pre-refactor-v2.2
Date: 2026-06-05T12:08
Branch: dev-refactor-timing

## Unit Tests
- **Total suites**: 11 (1 failed, 10 passed)
- **Total tests**: 99 (3 failed, 96 passed)

### Pre-existing Failures (baseline, not introduced by us)
1. `build-output-integrity` → `assets/js/swup-init.js` — missing (file will be created in T0.1)
2. `build-output-integrity` → `assets/js/vendor/swup.umd.js` — missing (split into swup-bundle.umd.js)
3. `build-output-integrity` → `sitemap.xml` — missing (build artifact not generated)

## Baseline Screenshots (Playwright, 1440x900)
- `screenshots-baseline-pre-refactor/home.png` ✅ (752 KB, no JS errors)
- `screenshots-baseline-pre-refactor/products.png` ✅ (1064 KB, no JS errors)
- `screenshots-baseline-pre-refactor/pdp.png` ✅ (445 KB, no JS errors)
- `screenshots-baseline-pre-refactor/support.png` ✅ (83 KB, no JS errors)
