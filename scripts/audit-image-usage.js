#!/usr/bin/env node
/**
 * audit-image-usage.js
 *
 * Phase 0 — Image Usage Audit + Lighthouse baseline
 *
 * Traverse all webp files under src/assets/images/, check which HTML pages
 * reference each image, classify by usage category (A/B/C/D), and report
 * original dimensions via sharp.
 *
 * Usage:
 *   node scripts/audit-image-usage.js
 *   node scripts/audit-image-usage.js --json   # JSON output to stdout (for tooling)
 *
 * Output: docs/analysis/image-usage-audit.md (Markdown report)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let sharp;
try {
  sharp = require('sharp');
} catch {
  console.warn('⚠️  sharp not available — dimension reporting will be limited');
}

const ROOT = path.resolve(__dirname, '..');
const IMG_DIR = path.join(ROOT, 'src', 'assets', 'images');
const PAGES_DIR = path.join(ROOT, 'src', 'pages');
const INDEX_HTML = path.join(ROOT, 'src', 'index.html');
const CSS_DIR = path.join(ROOT, 'src', 'assets', 'css');
const OUTPUT_FILE = path.join(ROOT, 'docs', 'analysis', 'image-usage-audit.md');

// ─── Classification rules (A/B/C/D) ────────────────────────────────
// A = Hero / Background (large, full-width)
// B = Card / Content (medium, inside content blocks)
// C = Thumbnail / Icon (small, decorative)
// D = Product detail (product variant photos)
function classifyImage(imgPath) {
  const basename = path.basename(imgPath, '.webp').toLowerCase();
  const relDir = path.dirname(imgPath);
  const parts = relDir.split(path.sep);
  const isInOem = parts.includes('oem');
  const isInProducts = parts.includes('products') || parts.includes('product');

  // ── Hero / Background ──────────────────────────────────────
  // Files named *-hero*, *hero-*, *-bg*, *-poster* in root or top-level dirs
  if (
    basename.includes('hero') ||
    basename.endsWith('-bg') ||
    basename.endsWith('_bg') ||
    basename === 'factory-video-poster' ||
    basename === 'og-home' ||
    basename === 'workshop-bg'
  ) {
    return 'A';
  }

  // OEM hero/hero-pc2 images
  if (isInOem && (basename.includes('hero') || basename.endsWith('bg'))) {
    return 'A';
  }

  // ── Product detail ──────────────────────────────────────────
  // Numbered images in products/<category>/ directories (001.webp, 002.webp…)
  if (isInProducts && /^\d{3}$/.test(basename)) {
    return 'D';
  }

  // ── Thumbnail / Icon / Small ────────────────────────────────
  // Logos, certs, QR codes, small cards, icons
  if (
    basename.startsWith('logo-') ||
    basename.startsWith('cert-') ||
    basename.startsWith('wechat') ||
    basename.endsWith('-qr') ||
    basename === 'og-home'
  ) {
    return 'C';
  }

  // Cert files in certs/ dir
  if (parts.includes('certs') && basename.startsWith('cert-')) {
    return 'C';
  }

  // ── Card / Content (default) ────────────────────────────────
  // Product category cards (coffee.webp, tea.webp, …), factory gallery,
  // solution cards, about images, case study images, application images
  return 'B';
}

// ─── Collect all webp images ────────────────────────────────────────
function collectImages(dir) {
  const results = [];
  function walk(current) {
    for (const entry of fs.readdirSync(current)) {
      const fp = path.join(current, entry);
      const stat = fs.statSync(fp);
      if (stat.isDirectory()) {
        walk(fp);
      } else if (
        entry.endsWith('.webp') &&
        // Skip already-resized files (contain width suffix like -375w, -828w)
        !/-\d+w\.webp$/.test(entry)
      ) {
        const rel = path.relative(IMG_DIR, fp);
        const relWithPrefix = path.join('src/assets/images', rel);
        results.push({
          relPath: rel,
          absPath: fp,
          fullRelPath: relWithPrefix,
          name: entry,
          sizeBytes: stat.size,
          mtimeMs: stat.mtimeMs,
        });
      }
    }
  }
  walk(dir);
  return results;
}

// ─── Get image dimensions ──────────────────────────────────────────
async function getDimensions(absPath) {
  if (!sharp) return { width: null, height: null };
  try {
    const meta = await sharp(absPath).metadata();
    return { width: meta.width, height: meta.height };
  } catch {
    return { width: null, height: null, error: 'sharp decode failed' };
  }
}

// ─── Build page → image reference map ─────────────────────────────
function buildPageImageMap() {
  const pageImages = {};

  // Collect all HTML files from pages/
  function scanPages(dir) {
    for (const entry of fs.readdirSync(dir)) {
      const fp = path.join(dir, entry);
      const stat = fs.statSync(fp);
      if (stat.isDirectory()) {
        scanPages(fp);
      } else if (entry.endsWith('.html')) {
        const rel = path.relative(PAGES_DIR, fp);
        const content = fs.readFileSync(fp, 'utf-8');
        // Extract image src references: /assets/images/... and relative paths
        const refs = [];
        const imgRegex = /src=["']([^"']*\.(?:webp|png|jpg|jpeg|svg))["']/gi;
        const urlRegex = /url\(["']?([^"')]*\.(?:webp|png|jpg|jpeg|svg))["']?\)/gi;
        let m;
        while ((m = imgRegex.exec(content)) !== null) {
          refs.push(m[1]);
        }
        while ((m = urlRegex.exec(content)) !== null) {
          refs.push(m[1]);
        }
        pageImages[rel] = { file: fp, refs };
      }
    }
  }
  scanPages(PAGES_DIR);

  // Also check index.html
  if (fs.existsSync(INDEX_HTML)) {
    const content = fs.readFileSync(INDEX_HTML, 'utf-8');
    const refs = [];
    const imgRegex = /src=["']([^"']*\.(?:webp|png|jpg|jpeg|svg))["']/gi;
    const urlRegex = /url\(["']?([^"')]*\.(?:webp|png|jpg|jpeg|svg))["']?\)/gi;
    let m;
    while ((m = imgRegex.exec(content)) !== null) refs.push(m[1]);
    while ((m = urlRegex.exec(content)) !== null) refs.push(m[1]);
    pageImages['index.html'] = { file: INDEX_HTML, refs };
  }

  return pageImages;
}

// ─── Map image rel path → list of pages that reference it ────────
function buildImagePageRefs(pageImageMap) {
  const imagePages = {};
  for (const [pageRel, { refs }] of Object.entries(pageImageMap)) {
    // /assets/images/... are the reference paths in HTML
    for (const ref of refs) {
      // Normalize: strip leading /assets/images/ to get relative path
      let imgRel = ref;
      // Handle /assets/images/foo/bar.webp → foo/bar.webp
      if (imgRel.startsWith('/assets/images/')) {
        imgRel = imgRel.replace(/^\/assets\/images\//, '');
      }
      // Handle assets/images/foo/bar.webp → foo/bar.webp
      if (imgRel.startsWith('assets/images/')) {
        imgRel = imgRel.replace(/^assets\/images\//, '');
      }
      // Handle /images/ → images/ (dev server serves from /images/)
      if (imgRel.startsWith('/images/')) {
        imgRel = imgRel.replace(/^\/images\//, '');
      }
      if (!imagePages[imgRel]) {
        imagePages[imgRel] = [];
      }
      imagePages[imgRel].push(pageRel);
    }
  }
  return imagePages;
}

// ─── Get MD5 hash of a file ────────────────────────────────────────
function md5File(filePath) {
  return crypto.createHash('md5').update(fs.readFileSync(filePath)).digest('hex');
}

// ─── Main ──────────────────────────────────────────────────────────
async function main() {
  const startTime = Date.now();

  console.log('🔍 BrewYuKoLi — Image Usage Audit');
  console.log(`   Image directory: ${IMG_DIR}`);
  console.log(`   Pages directory: ${PAGES_DIR}\n`);

  // Collect images
  const images = collectImages(IMG_DIR);
  console.log(`📸 Found ${images.length} original WebP images\n`);

  // Get dimensions for all images
  console.log('   Reading dimensions...');
  const dimensionPromises = images.map(img => getDimensions(img.absPath));
  const dimensions = await Promise.all(dimensionPromises);
  for (let i = 0; i < images.length; i++) {
    images[i].dimensions = dimensions[i];
  }

  // Build page → image refs
  const pageImageMap = buildPageImageMap();
  const totalPages = Object.keys(pageImageMap).length;

  // Build image → pages refs
  const imagePageRefs = buildImagePageRefs(pageImageMap);

  // Assign classifications
  for (const img of images) {
    img.category = classifyImage(img.absPath);
    img.referencedIn = imagePageRefs[img.relPath] || [];
  }

  // Unreferenced images
  const unreferenced = images.filter(img => img.referencedIn.length === 0);

  // Category counts
  const catCounts = { A: 0, B: 0, C: 0, D: 0 };
  for (const img of images) catCounts[img.category]++;

  // File size stats
  const totalSizeMB = images.reduce((s, i) => s + i.sizeBytes, 0) / (1024 * 1024);

  // ─── Check for resized files already present ──────────────
  const resizedFiles = [];
  function walkForResized(dir) {
    for (const entry of fs.readdirSync(dir)) {
      const fp = path.join(dir, entry);
      if (fs.statSync(fp).isDirectory()) {
        walkForResized(fp);
      } else if (entry.endsWith('.webp') && /-\d+w\.webp$/.test(entry)) {
        resizedFiles.push(path.relative(IMG_DIR, fp));
      }
    }
  }
  walkForResized(IMG_DIR);

  // ─── Generate Markdown report ──────────────────────────────
  const lines = [];
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  lines.push('# 图片使用审计报告');
  lines.push('');
  lines.push(`> 生成时间: ${now}`);
  lines.push(`> 扫描范围: \`src/assets/images/\` (${images.length} 张原始 WebP)`);
  lines.push(`> HTML 页面: \`src/pages/\` + \`src/index.html\` (${totalPages} 页)`);
  lines.push('');
  lines.push('## 概述');
  lines.push('');
  lines.push(`| 指标 | 数值 |`);
  lines.push(`|------|------|`);
  lines.push(`| 原始图片总数 | ${images.length} |`);
  lines.push(`| 总文件大小 | ${totalSizeMB.toFixed(1)} MB |`);
  lines.push(`| HTML 页面数 | ${totalPages} |`);
  lines.push(`| 未引用图片 | ${unreferenced.length} |`);
  lines.push(`| 已有 Resize 衍生文件 | ${resizedFiles.length} |`);
  lines.push('');
  lines.push('### 分类分布');
  lines.push('');
  lines.push(`| 分类 | 描述 | 数量 |`);
  lines.push(`|------|------|------|`);
  lines.push(`| A | Hero/背景 (大图, 全宽) | ${catCounts.A} |`);
  lines.push(`| B | 卡片/内容 (中等尺寸) | ${catCounts.B} |`);
  lines.push(`| C | 缩略图/图标 (小尺寸) | ${catCounts.C} |`);
  lines.push(`| D | 产品细节 (编号产品图) | ${catCounts.D} |`);
  lines.push('');

  // ─── Detailed table ────────────────────────────────────────
  lines.push('## 详细清单');
  lines.push('');
  lines.push('| # | 文件路径 | 分类 | 宽×高 | 文件大小 | 引用页面 |');
  lines.push('|---|----------|------|--------|----------|----------|');

  // Sort: by category then path
  images.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.relPath.localeCompare(b.relPath);
  });

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const dims = img.dimensions;
    const dimStr = dims.width ? `${dims.width}×${dims.height}` : '—';
    const sizeKB = Math.round(img.sizeBytes / 1024);
    const refPages = img.referencedIn.length > 0
      ? img.referencedIn.map(p => `\`${p}\``).join(', ')
      : '⚠️ 未引用';
    lines.push(`| ${i + 1} | \`${img.relPath}\` | ${img.category} | ${dimStr} | ${sizeKB} KB | ${refPages} |`);
  }

  // ─── Unreferenced images report ────────────────────────────
  if (unreferenced.length > 0) {
    lines.push('');
    lines.push('## ⚠️ 未引用的图片');
    lines.push('');
    lines.push('以下图片未被任何 HTML 页面引用，可以考虑清理或确认是否需要保留：');
    lines.push('');
    for (const img of unreferenced) {
      const sizeKB = Math.round(img.sizeBytes / 1024);
      lines.push(`- \`${img.relPath}\` (${sizeKB} KB, 分类 ${img.category})`);
    }
  }

  // ─── Pages referencing many images (performance hotspots) ──
  lines.push('');
  lines.push('## 页面图片引用分析');
  lines.push('');
  lines.push('| 页面 | 图片引用数 | 建议 |');
  lines.push('|------|-----------|------|');

  const pageRefCounts = {};
  for (const [imgRel, pages] of Object.entries(imagePageRefs)) {
    for (const page of pages) {
      if (!pageRefCounts[page]) pageRefCounts[page] = new Set();
      pageRefCounts[page].add(imgRel);
    }
  }

  const sortedPages = Object.entries(pageRefCounts)
    .map(([page, set]) => ({ page, count: set.size }))
    .sort((a, b) => b.count - a.count);

  for (const { page, count } of sortedPages) {
    let suggestion = '正常';
    if (count > 20) suggestion = '⚠️ 图片较多，考虑懒加载';
    if (count > 50) suggestion = '🚨 图片过多，强烈建议懒加载 + 预占位';
    lines.push(`| \`${page}\` | ${count} | ${suggestion} |`);
  }

  // ─── Existing resized files ─────────────────────────────────
  if (resizedFiles.length > 0) {
    lines.push('');
    lines.push('## 已有 Resize 衍生文件');
    lines.push('');
    lines.push(`已存在 ${resizedFiles.length} 个 resize 后的文件（命名规则: \`*-{width}w.webp\`）：`);
    lines.push('');
    for (const f of resizedFiles) {
      lines.push(`- \`${f}\``);
    }
  }

  // ─── Recommendations ────────────────────────────────────────
  lines.push('');
  lines.push('## 优化建议');
  lines.push('');
  lines.push(`1. **未引用图片**: ${unreferenced.length} 张图片未被任何页面引用，可清理。`);
  lines.push('2. **A 类图片** (Hero/背景): 应生成 375w, 828w, 1200w, 1920w, 2048w 多尺寸。');
  lines.push('3. **B 类图片** (卡片/内容): 应生成 375w, 828w, 1200w 多尺寸。');
  lines.push('4. **C 类图片** (缩略图/图标): 保留原尺寸，不做 resize。');
  lines.push('5. **D 类图片** (产品细节): 应生成 375w, 828w 多尺寸。');
  lines.push('6. **图片质量**: 照片类 80，插图类 85，背景大图 75，产品缩略图 75。');
  for (const { page, count } of sortedPages.filter(p => p.count > 20)) {
    lines.push(`7. **\`${page}\`** 引用了 ${count} 张图片，考虑懒加载。`);
  }
  lines.push('');

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  lines.push(`---`);
  lines.push(`*审计耗时: ${elapsed}s | 共扫描 ${images.length} 张图片，${totalPages} 个页面*`);

  const report = lines.join('\n');

  // Write report
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, report, 'utf-8');
  console.log(`✅ Audit report written to ${path.relative(ROOT, OUTPUT_FILE)}`);

  // If --json flag, also output JSON
  if (process.argv.includes('--json')) {
    const jsonReport = {
      totalImages: images.length,
      totalPages,
      totalSizeMB: Math.round(totalSizeMB * 100) / 100,
      categories: catCounts,
      unreferenced: unreferenced.map(i => i.relPath),
      pageRefCounts: sortedPages,
      resizedFiles: resizedFiles.length,
      images: images.map(i => ({
        path: i.relPath,
        category: i.category,
        width: i.dimensions.width,
        height: i.dimensions.height,
        sizeKB: Math.round(i.sizeBytes / 1024),
        pages: i.referencedIn,
      })),
    };
    process.stdout.write(JSON.stringify(jsonReport, null, 2) + '\n');
  }

  // Exit with non-zero if >50% images are unreferenced (build fail)
  if (unreferenced.length > images.length * 0.5) {
    console.error('❌ More than 50% of images are unreferenced — possible stale build');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Audit failed:', err.message);
  process.exit(1);
});
