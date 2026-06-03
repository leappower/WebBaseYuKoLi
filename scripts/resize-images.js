#!/usr/bin/env node
/**
 * resize-images.js — Sharp multi-size image pipeline
 *
 * Generates responsive image derivatives from original WebP files.
 * Supports incremental mode via .cache/image-hashes.json (md5 cache).
 *
 * Usage:
 *   node scripts/resize-images.js               # incremental mode
 *   node scripts/resize-images.js --force        # force full rebuild
 *   SKIP_RESIZE=1 node scripts/resize-images.js  # skip entirely
 *
 * Classification and size tiers:
 *   A (Hero/Background): 375, 828, 1200, 1920, 2048
 *   B (Card/Content):     375, 828, 1200
 *   C (Thumbnail/Icon):   keep original (no resize)
 *   D (Product detail):   375, 828, 1200 (if source >= 1200px, else skipped by withoutEnlargement)
 *   E (Product hero card): 375, 828, 1200, 1920 (allow upscaling for HTML requirements)
 *
 * Image quality: A=75, B=80, C=75, D=75, E=75
 *
 * Output naming: {relative-path-stem}-{width}w.webp
 *   e.g. applications/food-factory/hero.webp → applications/food-factory/hero-375w.webp
 *
 * All output files are written into the same directory as the source image.
 * withoutEnlargement handles skipping sizes larger than source for all but E.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let sharp;
try {
  sharp = require('sharp');
} catch {
  console.error('❌ sharp is not installed. Run: npm install sharp');
  process.exit(1);
}

// ─── Configuration ─────────────────────────────────────────────────
const ROOT = path.resolve(__dirname, '..');
const IMG_DIR = path.join(ROOT, 'src', 'assets', 'images');
const CACHE_DIR = path.join(ROOT, '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'image-hashes.json');
const ERROR_LOG = path.join(CACHE_DIR, 'resize-errors.log');
const FORCE = process.argv.includes('--force');

// Size tiers per classification
const TIERS = {
  A: [375, 828, 1200, 1920, 2048],
  B: [375, 828, 1200],
  C: [],        // no resize, keep original
  D: [375, 828, 1200, 1920],  // product detail: include 1200w for HTML reference, withoutEnlargement handles skip
  E: [375, 828, 1200, 1920],  // product hero cards: allow upscaling to 1920w
};

// Quality settings per classification
const QUALITY = {
  A: 75,   // background/hero
  B: 80,   // card/content
  C: 75,   // thumbnail/icon
  D: 75,   // product detail
  E: 75,   // product hero card
};

// ─── Classification ────────────────────────────────────────────────
function classifyImage(imgRelPath) {
  const basename = path.basename(imgRelPath, '.webp').toLowerCase();
  const parts = imgRelPath.split('/');
  const isInOem = parts.includes('oem');
  const isInProducts = parts.includes('products') || parts.includes('product');

  // A: Hero/Background images — full size tier including 1920w/2048w
  if (
    basename.includes('hero') ||
    basename.endsWith('-bg') ||
    basename.endsWith('_bg') ||
    basename === 'factory-video-poster' ||
    basename === 'og-home' ||
    basename === 'workshop-bg' ||
    basename === 'hero-all-products' ||
    basename === 'contact-partner-tour'
  ) {
    return 'A';
  }
  if (isInOem && (basename.includes('hero') || basename.endsWith('bg'))) {
    return 'A';
  }
  // oem/factory/* are large hero-level images (2048px)
  if (parts.includes('factory') && isInOem) {
    return 'A';
  }
  // oem/resources/* and oem/about/* are typically large/full-width images
  if ((parts.includes('resources') || parts.includes('about')) && isInOem) {
    return 'A';
  }
  if (isInProducts && /^\d{3}$/.test(basename)) {
    return 'D';
  }
  // Product category hero card images (oem/products/*.webp at flat level)
  // These are 1376px cards where HTML expects 1920w variants
  if (isInOem && parts.includes('products') && parts.length === 3) {
    return 'E';
  }
  if (
    basename.startsWith('logo-') ||
    basename.startsWith('cert-') ||
    basename.startsWith('wechat') ||
    basename.endsWith('-qr')
  ) {
    return 'C';
  }
  if (parts.includes('certs') && basename.startsWith('cert-')) {
    return 'C';
  }
  return 'B';
}

// ─── Load / save md5 cache ─────────────────────────────────────────
function loadCache() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function saveCache(cache) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
}

// ─── MD5 hash ───────────────────────────────────────────────────────
function md5File(filePath) {
  return crypto.createHash('md5').update(fs.readFileSync(filePath)).digest('hex');
}

// ─── Collect original WebP files ────────────────────────────────────
function collectOriginals(dir) {
  const results = [];
  function walk(d) {
    for (const entry of fs.readdirSync(d)) {
      const fp = path.join(d, entry);
      const stat = fs.statSync(fp);
      if (stat.isDirectory()) {
        walk(fp);
      } else if (entry.endsWith('.webp') && !/-\d+w\.webp$/.test(entry) && !entry.endsWith('-blur.webp')) {
        const rel = path.relative(IMG_DIR, fp);
        // Use POSIX separators for cross-platform cache key consistency
        const relPosix = rel.split(path.sep).join('/');
        results.push({
          relPath: relPosix,
          absPath: fp,
          name: entry,
        });
      }
    }
  }
  walk(dir);
  return results;
}

// ─── Log errors ─────────────────────────────────────────────────────
function logError(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(ERROR_LOG, line, 'utf-8');
  console.error(`  ⚠️  ${message}`);
}

// ─── Get the stem (without extension) preserving subdirectory ──────
function getOutputStem(relPath) {
  // e.g. "applications/food-factory/hero.webp" → "applications/food-factory/hero"
  return relPath.replace(/\.webp$/, '');
}

// ─── Main ──────────────────────────────────────────────────────────
async function main() {
  if (process.env.SKIP_RESIZE === '1') {
    console.log('⏭️  SKIP_RESIZE=1 — skipping image resize');
    return;
  }

  const startTime = Date.now();
  console.log('🖼️  Resizing images with sharp...');

  const originals = collectOriginals(IMG_DIR);
  console.log(`   Found ${originals.length} original WebP images`);

  const cache = loadCache();
  let processed = 0;
  let skipped = 0;
  let errors = 0;

  // Clear previous error log
  fs.writeFileSync(ERROR_LOG, '', 'utf-8');

  for (const img of originals) {
    const category = classifyImage(img.relPath);
    const tiers = TIERS[category] || TIERS.B;
    const quality = QUALITY[category] || QUALITY.B;

    // Skip tier C (thumbnail/icon) — no resize
    if (tiers.length === 0) {
      skipped++;
      continue;
    }

    // Compute current hash
    const currentHash = md5File(img.absPath);

    // Check cache
    const cachedEntry = cache[img.relPath];
    let imageNeedsRebuild = FORCE;

    if (cachedEntry && cachedEntry.hash === currentHash && !FORCE) {
      // Check that all output files still exist
      const allExist = cachedEntry.outputs.every(out => {
        const outPath = path.join(path.dirname(img.absPath), out);
        return fs.existsSync(outPath);
      });
      if (allExist) {
        skipped++;
        continue;
      }
      imageNeedsRebuild = true;
    }

    // Process: resize to each tier width
    const stem = getOutputStem(img.relPath);
    const outputDir = path.dirname(img.absPath);
    const outputs = [];

    try {
      const imgSharp = sharp(img.absPath);
      const metadata = await imgSharp.metadata();

      for (const width of tiers) {
        // Category E (product hero cards): allow upscaling up to 1920w
        // to satisfy HTML requirements (1376px sources that need 1920w variants)
        const allowEnlarge = (category === 'E' || category === 'D') && width <= 1920;

        // Output name includes relative subdirectory
        const outName = `${stem}-${width}w.webp`;
        const outPath = path.join(IMG_DIR, outName);

        // Ensure output subdirectory exists
        fs.mkdirSync(path.dirname(outPath), { recursive: true });

        await imgSharp
          .clone()
          .resize({ width, withoutEnlargement: !allowEnlarge })
          .webp({ quality })
          .toFile(outPath);

        // Store just the filename (relative to img dir) for cache checking
        const outRelName = path.relative(outputDir, outPath);
        outputs.push(outRelName);
      }

      // Generate LQIP blur-up thumbnail for Hero images
      if (category === 'A') {
        const blurOutName = `${stem}-blur.webp`;
        const blurOutPath = path.join(IMG_DIR, blurOutName);
        await imgSharp
          .clone()
          .resize({ width: 10, withoutEnlargement: true })
          .webp({ quality: 30 })
          .toFile(blurOutPath);
        outputs.push(path.basename(blurOutName));
      }

      processed++;

      // Update cache
      cache[img.relPath] = {
        hash: currentHash,
        outputs,
        category,
        lastProcessed: Date.now(),
      };
    } catch (err) {
      errors++;
      logError(`Failed to resize ${img.relPath}: ${err.message}`);
    }

    // Progress indicator
    if ((processed + skipped) % 50 === 0) {
      const pct = (((processed + skipped) / originals.length) * 100).toFixed(1);
      console.log(`   Progress: ${processed + skipped}/${originals.length} (${pct}%) — ${processed} processed, ${skipped} skipped`);
    }
  }

  // Save cache
  saveCache(cache);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✅ Resize complete:`);
  console.log(`   Processed: ${processed}`);
  console.log(`   Skipped:   ${skipped}`);
  console.log(`   Errors:    ${errors}`);
  console.log(`   Time:      ${elapsed}s`);

  if (errors > 0) {
    console.log(`   Errors logged to: .cache/resize-errors.log`);
  }

  // Exit non-zero if ALL images errored
  if (processed === 0 && errors > 0 && errors >= originals.length) {
    console.error('❌ All images failed to resize');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Resize pipeline failed:', err.message);
  process.exit(1);
});
