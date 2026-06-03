#!/usr/bin/env node
/**
 * inject-blur-placeholders.js — 构建后注入 Blur-up LQIP
 *
 * 遍历 dist 中所有 HTML 文件，找到 hero 图片的 <img> 标签，
 * 添加 data-blur 属性和内联 blur-up background-image。
 *
 * 用法: node scripts/inject-blur-placeholders.js <SRC_DIR> <DIST_DIR>
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob'); // not used, use fs

const SRC = process.argv[2] || 'src';
const DIST = process.argv[3] || 'dist';
const IMG_DIR = path.resolve(SRC, 'assets/images');
const DIST_DIR = path.resolve(DIST);

// ─── Collect blur thumbnails ────────────────────────────────────
function collectBlurs(dir) {
  const map = {};
  function walk(d) {
    for (const entry of fs.readdirSync(d)) {
      const fp = path.join(d, entry);
      const stat = fs.statSync(fp);
      if (stat.isDirectory()) {
        walk(fp);
      } else if (entry.endsWith('-blur.webp')) {
        const rel = path.relative(dir, fp).replace(/\\/g, '/');
        const orig = rel.replace('-blur.webp', '.webp');
        const b64 = fs.readFileSync(fp).toString('base64');
        map[orig] = b64;
      }
    }
  }
  walk(dir);
  return map;
}

// ─── Walk HTML files ────────────────────────────────────────────
function walkHtml(dir, callback) {
  for (const entry of fs.readdirSync(dir)) {
    const fp = path.join(dir, entry);
    const stat = fs.statSync(fp);
    if (stat.isDirectory()) {
      walkHtml(fp, callback);
    } else if (entry.endsWith('.html')) {
      callback(fp);
    }
  }
}

// ─── Main ───────────────────────────────────────────────────────
function main() {
  if (!fs.existsSync(IMG_DIR)) {
    console.error(`  ⚠️  Image directory not found: ${IMG_DIR}`);
    process.exit(0);
  }

  const blurMap = collectBlurs(IMG_DIR);
  const entries = Object.keys(blurMap);
  if (entries.length === 0) {
    console.log('  No blur thumbnails found');
    process.exit(0);
  }

  let totalInjected = 0;
  let modifiedFiles = 0;

  walkHtml(DIST_DIR, (fp) => {
    let html = fs.readFileSync(fp, 'utf-8');
    let changed = false;

    for (const origRel of entries) {
      const assetPath = `/assets/images/${origRel}`;
      
      // Skip if already has data-blur attribute
      if (html.includes(`data-blur="${assetPath}"`)) continue;

      // Find <img> tags with this src
      const regex = new RegExp(
        `(<img\\s[^>]*?src="${escapeRegex(assetPath)}")`,
        'g'
      );
      let match;
      while ((match = regex.exec(html)) !== null) {
        const dataUri = `data:image/webp;base64,${blurMap[origRel]}`;
        const newImg = match[1].replace(
          '<img',
          `<img data-blur="${assetPath}" style="background-image:url(${dataUri});background-size:cover;background-position:center;background-repeat:no-repeat"`
        );
        html = html.replace(match[1], newImg);
        changed = true;
        totalInjected++;
      }
    }

    if (changed) {
      fs.writeFileSync(fp, html, 'utf-8');
      modifiedFiles++;
      console.log(`  Blur-up: ${path.relative(DIST_DIR, fp)}`);
    }
  });

  console.log(`  Injected ${totalInjected} blur-up placeholders across ${modifiedFiles} files`);
  process.exit(0);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

main();
