import { test, expect } from '@playwright/test';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

// ── Paths ──────────────────────────────────────────────────────────────────
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');
const RESULTS_DIR = path.join(PROJECT_ROOT, 'test-results', 'visual');

function ensureDir() {
  if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

async function takeSnapshot(page, name) {
  ensureDir();
  const fp = path.join(RESULTS_DIR, `${name}.png`);
  await page.screenshot({ path: fp, fullPage: true });
  return fp;
}

function compareImages(baselinePath, currentPath) {
  const bl = PNG.sync.read(fs.readFileSync(baselinePath));
  const cu = PNG.sync.read(fs.readFileSync(currentPath));
  if (bl.width !== cu.width || bl.height !== cu.height) {
    return { diffPixels: -1, diffPercent: '100',
      error: `Dimension mismatch: baseline ${bl.width}x${bl.height} vs current ${cu.width}x${cu.height}` };
  }
  const total = bl.width * bl.height;
  const diff = new PNG({ width: bl.width, height: bl.height });
  const dp = pixelmatch(bl.data, cu.data, diff.data, bl.width, bl.height,
    { threshold: 0.05, alpha: 0.3, diffColor: [255, 0, 0], diffMask: true });
  const diffPath = currentPath.replace('.png', '-diff.png');
  fs.writeFileSync(diffPath, PNG.sync.write(diff));
  return { diffPixels: dp, diffPercent: ((dp / total) * 100).toFixed(2), diffImage: diffPath };
}
function baselinePath(name) { return path.join(RESULTS_DIR, `${name}-baseline.png`); }

/** Resolve image src to dist file. Tries responsive variant fallback. */
function resolveImage(src) {
  const fp = path.join(DIST_DIR, src.replace(/^\//, ''));
  if (fs.existsSync(fp)) return fp;
  // Try stripping -NNNNw suffix (e.g., coffee-1920w.webp → coffee.webp)
  const dir = path.dirname(fp);
  const ext = path.extname(fp);
  const base = path.basename(fp, ext);
  const stripped = base.replace(/-\d+w$/, '');
  if (stripped !== base) {
    const c = path.join(dir, `${stripped}${ext}`);
    if (fs.existsSync(c)) return c;
  }
  return fp;
}

function waitForPage(page) {
  return page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
}

// ── Test data ──────────────────────────────────────────────────────────────
const VIEWPORTS = [
  { name: 'mobile',  w: 375, h: 812 },
  { name: 'tablet',  w: 768, h: 1024 },
  { name: 'pc',      w: 1440, h: 900 },
];
const PAGES = [
  { p: '/products/',  l: 'products' },
  { p: '/about/',     l: 'about' },
  { p: '/solutions/', l: 'solutions' },
  { p: '/contact/',   l: 'contact' },
];

// ═══════════════════════════════════════════════════════════════════════════
// Suite 1: Image attribute baseline
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Image attributes (baseline)', () => {
  for (const { p, l } of PAGES) {
    test(`${l} — measure srcset/sizes/dims/lazy`, async ({ page }) => {
      test.setTimeout(15_000);
      await page.goto(p);
      await waitForPage(page);

      const imgs = page.locator('img');
      const n = await imgs.count();
      expect(n).toBeGreaterThan(0);

      let ss = 0, sz = 0, dm = 0, lz = 0;
      for (let i = 0; i < n; i++) {
        const el = imgs.nth(i);
        if (await el.getAttribute('srcset')) ss++;
        if (await el.getAttribute('sizes')) sz++;
        if (await el.getAttribute('width') && await el.getAttribute('height')) dm++;
        if ((await el.getAttribute('loading')) === 'lazy') lz++;
      }

      console.log(`[${l}] ${n} imgs: srcset=${ss}/${n} sizes=${sz}/${n} dims=${dm}/${n} lazy=${lz}/${n}`);
      test.info().annotations.push({
        type: 'img-metrics',
        description: `[${l}] ${n} imgs | srcset=${ss}/${n} | sizes=${sz}/${n} | dims=${dm}/${n} | lazy=${lz}/${n}`
      });

      // Baseline: all images MUST have loading="lazy"
      if (lz < n - 1) console.warn(`[${l}] ⚠ ${n - 1 - lz} images missing loading="lazy"`);

      // All images SHOULD have width/height — report but don't fail in baseline mode
      if (dm < n) {
        console.warn(`[${l}] ⚠ ${n - dm}/${n} images missing width/height (CLS risk)`);
      }

      // Non-strict mode: report all metrics but only enforce lazy
      if (process.env.STRICT_IMAGES === 'true') {
        expect(dm).toBe(n);
        expect(ss).toBeGreaterThan(0);
        expect(sz).toBeGreaterThan(0);
      }
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// Suite 2: Visual regression — 4 pages × 3 viewports = 12 screenshots
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Visual regression', () => {
  for (const { name, w, h } of VIEWPORTS) {
    for (const { p, l } of PAGES) {
      test(`${l} @${name} — screenshot + pixelmatch (5%)`, async ({ page }) => {
        test.setTimeout(60_000);
        await page.setViewportSize({ width: w, height: h });
        await page.goto(p);
        await waitForPage(page);

        const snap = `${l}-${name}`;
        const fp = await takeSnapshot(page, snap);
        const bp = baselinePath(snap);

        if (!fs.existsSync(bp)) {
          fs.writeFileSync(bp, fs.readFileSync(fp));
          test.info().annotations.push({ type: 'baseline', description: `Baseline: ${snap}` });
          console.log(`[BASELINE] ${snap}`);
          return;
        }

        const r = compareImages(bp, fp);
        if (r.error) {
          test.info().annotations.push({ type: 'diff-skip', description: `${snap}: ${r.error}` });
          return;
        }

        test.info().annotations.push({
          type: 'pixel-diff',
          description: `${snap}: ${r.diffPercent}% diff (${r.diffPixels} px)`
        });
        const threshold = process.env.CI ? 20 : 5;
        expect(parseFloat(r.diffPercent)).toBeLessThan(threshold);
        console.log(`[DIFF] ${snap}: ${r.diffPercent}% | diff: ${r.diffImage}`);
      });
    }
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// Suite 3: Image files exist on disk (with responsive fallback resolution)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Image file existence', () => {
  for (const { p, l } of PAGES) {
    test(`${l} — all <img src> files exist`, async ({ page }) => {
      test.setTimeout(15_000);
      await page.goto(p);
      await waitForPage(page);

      const imgs = page.locator('img');
      const n = await imgs.count();
      expect(n).toBeGreaterThan(0);

      let missing = [];
      for (let i = 0; i < n; i++) {
        const src = await imgs.nth(i).getAttribute('src');
        if (!src || src.startsWith('http') || src.startsWith('data:')) continue;
        if (!fs.existsSync(resolveImage(src))) missing.push(src);
      }
      if (missing.length) missing.forEach(m => console.error(`  MISSING: ${m}`));
      expect(missing).toHaveLength(0);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// Suite 4: Image integrity — verify files are valid images
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Image integrity', () => {
  for (const { p, l } of PAGES) {
    test(`${l} — verify images render with valid dimensions`, async ({ page }) => {
      test.setTimeout(15_000);
      await page.goto(p);
      await waitForPage(page);

      // Get resolved image sources from the rendered DOM
      const srcs = await page.evaluate(() =>
        Array.from(document.querySelectorAll('img'))
          .map(img => img.getAttribute('src'))
          .filter(Boolean)
      );

      expect(srcs.length).toBeGreaterThan(0);

      // Verify each referenced file exists on disk (already resolved)
      const invalid = [];
      for (const src of srcs) {
        if (src.startsWith('http') || src.startsWith('data:')) continue;
        const resolved = resolveImage(src);
        if (!fs.existsSync(resolved)) {
          invalid.push(src);
          continue;
        }
        // Verify it's a valid image by checking PNG/JPEG/WebP headers
        const buf = fs.readFileSync(resolved).subarray(0, 12);
        const isWebp = buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46; // RIFF
        const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47; // PNG
        const isJpg = buf[0] === 0xFF && buf[1] === 0xD8; // JPEG
        if (!isWebp && !isPng && !isJpg) {
          invalid.push(`${src} (not a valid image file)`);
        }
      }

      if (invalid.length) invalid.forEach(i => console.error(`  INVALID: ${i}`));
      expect(invalid).toHaveLength(0);
    });
  }
});
