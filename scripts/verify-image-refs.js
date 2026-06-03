#!/usr/bin/env node
/**
 * verify-image-refs.js
 *
 * Scans dist/ directory for all HTML files and checks that every
 * <img src="..."> reference resolves to an existing file.
 *
 * Usage:
 *   node scripts/verify-image-refs.js          # scan dist/
 *   node scripts/verify-image-refs.js --dir <path>  # custom directory
 *
 * Exit codes:
 *   0 — all refs valid (or < 50% missing)
 *   1 — >= 50% missing → build failure
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST_DIR = process.argv.includes('--dir')
  ? path.resolve(process.argv[process.argv.indexOf('--dir') + 1])
  : path.join(ROOT, 'dist');

// ─── Collect all HTML files ────────────────────────────────────────
function collectHtmlFiles(dir) {
  const results = [];
  function walk(d) {
    for (const entry of fs.readdirSync(d)) {
      const fp = path.join(d, entry);
      const stat = fs.statSync(fp);
      if (stat.isDirectory()) {
        walk(fp);
      } else if (entry.endsWith('.html')) {
        results.push(fp);
      }
    }
  }
  walk(dir);
  return results;
}

// ─── Extract image src references from HTML ────────────────────────
function extractImageRefs(htmlContent, htmlFile) {
  const refs = [];
  // Match src="..." for images
  const imgRegex = /src=["']([^"']*\.(?:webp|png|jpg|jpeg|svg))["']/gi;
  let m;
  while ((m = imgRegex.exec(htmlContent)) !== null) {
    refs.push({ ref: m[1], foundIn: htmlFile });
  }
  // Match srcset="..." (space/comma separated URLs)
  const srcsetRegex = /srcset=["']([^"']*)["']/gi;
  while ((m = srcsetRegex.exec(htmlContent)) !== null) {
    const urls = m[1].split(',').map(s => s.trim().split(/\s+/)[0]);
    for (const url of urls) {
      if (/\.(webp|png|jpg|jpeg|svg)/i.test(url)) {
        refs.push({ ref: url, foundIn: htmlFile });
      }
    }
  }
  // Match CSS url() references in inline styles
  const urlRegex = /url\(["']?([^"')]*\.(?:webp|png|jpg|jpeg|svg))["']?\)/gi;
  while ((m = urlRegex.exec(htmlContent)) !== null) {
    refs.push({ ref: m[1], foundIn: htmlFile });
  }
  return refs;
}

// ─── Resolve a reference path against dist root ────────────────────
function resolveRef(ref, htmlFilePath) {
  // If absolute (starts with /), resolve against dist root
  if (ref.startsWith('/')) {
    return path.join(DIST_DIR, ref);
  }
  // If relative, resolve against the HTML file's directory
  return path.resolve(path.dirname(htmlFilePath), ref);
}

// ─── Main ──────────────────────────────────────────────────────────
function main() {
  const startTime = Date.now();

  if (!fs.existsSync(DIST_DIR)) {
    console.error(`❌ dist directory not found: ${DIST_DIR}`);
    console.error('   Run ./build.sh first');
    process.exit(1);
  }

  console.log(`🔍 Verifying image references in ${DIST_DIR}...`);

  const htmlFiles = collectHtmlFiles(DIST_DIR);
  console.log(`   Found ${htmlFiles.length} HTML files`);

  // Extract all references
  const allRefs = [];
  for (const htmlFile of htmlFiles) {
    const content = fs.readFileSync(htmlFile, 'utf-8');
    const refs = extractImageRefs(content, htmlFile);
    allRefs.push(...refs);
  }

  console.log(`   Found ${allRefs.length} image references`);

  // Check each reference
  const missing = [];
  const valid = [];
  const skipped = []; // external URLs

  for (const { ref, foundIn } of allRefs) {
    // Skip external URLs
    if (ref.startsWith('http://') || ref.startsWith('https://') || ref.startsWith('//') || ref.startsWith('data:')) {
      skipped.push({ ref, foundIn });
      continue;
    }

    // Resolve the path
    const resolved = resolveRef(ref, foundIn);

    // Normalize: if file doesn't exist, check with dist root prepended differently
    if (fs.existsSync(resolved)) {
      valid.push({ ref, foundIn, resolved });
    } else {
      // Try additional resolution: maybe the ref is relative to dist root
      const altResolved = path.join(DIST_DIR, ref);
      if (fs.existsSync(altResolved)) {
        valid.push({ ref, foundIn, resolved: altResolved });
      } else {
        missing.push({ ref, foundIn, resolved });
      }
    }
  }

  const totalChecked = valid.length + missing.length;
  const missingPct = totalChecked > 0 ? (missing.length / totalChecked) * 100 : 0;

  // ─── Report ─────────────────────────────────────────────────
  console.log(`\n📊 Results:`);
  console.log(`   Valid:        ${valid.length}`);
  console.log(`   Missing:      ${missing.length} (${missingPct.toFixed(1)}%)`);
  console.log(`   External/Skipped: ${skipped.length}`);

  if (missing.length > 0) {
    console.log(`\n❌ Missing image references:`);
    // Group by file
    const byFile = {};
    for (const m of missing) {
      const relFile = path.relative(DIST_DIR, m.foundIn);
      if (!byFile[relFile]) byFile[relFile] = [];
      byFile[relFile].push(m.ref);
    }
    for (const [file, refs] of Object.entries(byFile)) {
      console.log(`   ${file}:`);
      for (const ref of refs) {
        console.log(`     - ${ref}`);
      }
    }
  }

  if (skipped.length > 0) {
    console.log(`\nℹ️  Skipped (external/data URIs): ${skipped.length}`);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n⏱️  Verification took ${elapsed}s`);

  // ─── Build failure threshold ────────────────────────────────
  if (missingPct >= 50) {
    console.error(`\n❌ BUILD FAILURE: ${missingPct.toFixed(1)}% of image references are missing (threshold: 50%)`);
    process.exit(1);
  }

  if (missing.length > 0) {
    console.log(`\n⚠️  ${missing.length} image(s) missing (below failure threshold). Verify paths.`);
  } else {
    console.log(`\n✅ All image references verified OK`);
  }
}

main();
