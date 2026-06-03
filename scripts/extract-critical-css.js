#!/usr/bin/env node
/**
 * extract-critical-css.js — 提取关键 CSS（首屏 Above-the-fold）
 *
 * 使用 Puppeteer 加载首页，分析各视口尺寸下首屏区域的 CSS 规则，
 * 提取并写入 src/assets/css/critical.css。
 *
 * 用法: node scripts/extract-critical-css.js
 * 依赖: puppeteer-core + Chrome
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const puppeteer = require('puppeteer-core');
const { execSync } = require('child_process');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SRC_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(SRC_DIR, 'dist');
const PORT = 5199; // 避免与 devServer (5000) 冲突

// ─── 1. Serve dist with a minimal HTTP server ──────────────────────
function startServer(dir, port) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(dir, req.url === '/' ? '/home/index-pc.html' : req.url);
      // Remove query strings
      filePath = filePath.split('?')[0];

      // Try exact path first, then append index-pc.html for directories
      if (!fs.existsSync(filePath)) {
        // Try as directory
        const dirIndex = path.join(filePath, 'index-pc.html');
        if (fs.existsSync(dirIndex)) {
          filePath = dirIndex;
        } else {
          // Try with the original request path
          const alt = path.join(dir, req.url.replace(/\/$/, '') + '/index-pc.html');
          if (fs.existsSync(alt)) {
            filePath = alt;
          } else {
            // Fallback to home
            filePath = path.join(dir, '/home/index-pc.html');
          }
        }
      }

      const ext = path.extname(filePath);
      const mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.webp': 'image/webp',
        '.woff2': 'font/woff2',
        '.woff': 'font/woff',
        '.ttf': 'font/ttf',
      };

      try {
        const content = fs.readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        res.end(content);
      } catch (e) {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    server.listen(port, '127.0.0.1', () => {
      console.log(`  Server running at http://127.0.0.1:${port}`);
      resolve(server);
    });
  });
}

// ─── 2. Extract critical CSS ──────────────────────────────────────
async function extractCriticalCSS(browser, url) {
  const viewports = [
    { width: 1920, height: 1080, name: 'desktop' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 375, height: 812, name: 'mobile' },
  ];

  const allRules = new Set();

  for (const vp of viewports) {
    console.log(`  📐 ${vp.name} (${vp.width}x${vp.height})...`);
    const page = await browser.newPage();
    await page.setViewport(vp);
    
    try {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    } catch (e) {
      console.log(`  ⚠️  ${vp.name}: timeout, continuing with partial content`);
    }

    // Wait a bit for any late-loading CSS
    await new Promise(r => setTimeout(r, 1000));

    // Extract critical CSS using page's styleSheets
    const criticalRules = await page.evaluate(() => {
      // Helper: check if element is in viewport (above the fold)
      function isAboveFold(el) {
        const rect = el.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0;
      }

      // Collect all elements above the fold (or partially visible)
      const aboveFoldElements = new Set();
      const allElements = document.querySelectorAll('*');
      for (const el of allElements) {
        if (isAboveFold(el)) {
          aboveFoldElements.add(el);
        }
      }

      // Collect matched CSS rules from all stylesheets
      const rules = [];
      for (const sheet of document.styleSheets) {
        try {
          const cssRules = sheet.cssRules || sheet.rules;
          if (!cssRules) continue;
          
          for (let i = 0; i < cssRules.length; i++) {
            const rule = cssRules[i];
            
            // @font-face — keep all font declarations
            if (rule.type === CSSRule.FONT_FACE_RULE) {
              rules.push(rule.cssText);
              continue;
            }
            
            // @keyframes — keep all animation declarations
            if (rule.type === CSSRule.KEYFRAMES_RULE) {
              rules.push(rule.cssText);
              continue;
            }
            
            // @media — check nested rules
            if (rule.type === CSSRule.MEDIA_RULE) {
              const mediaRules = [];
              for (let j = 0; j < rule.cssRules.length; j++) {
                const nested = rule.cssRules[j];
                if (nested.selectorText) {
                  try {
                    const matches = document.querySelectorAll(nested.selectorText);
                    for (const el of matches) {
                      if (aboveFoldElements.has(el)) {
                        mediaRules.push(nested.cssText);
                        break;
                      }
                    }
                  } catch (e) {
                    // Invalid selector, skip
                  }
                }
              }
              if (mediaRules.length > 0) {
                rules.push(`@media ${rule.media.mediaText} {\n  ${mediaRules.join('\n  ')}\n}`);
              }
              continue;
            }
            
            // Regular style rules
            if (rule.selectorText) {
              try {
                const matches = document.querySelectorAll(rule.selectorText);
                for (const el of matches) {
                  if (aboveFoldElements.has(el)) {
                    rules.push(rule.cssText);
                    break;
                  }
                }
              } catch (e) {
                // Invalid selector (e.g., :root, pseudo-elements)
                // Keep common important rules even if we can't match them
                const sel = rule.selectorText;
                if (sel === ':root' || sel === 'body' || sel === 'html' || 
                    sel.includes(':root') || sel.startsWith('*') ||
                    sel.includes('dark') || sel.includes('light')) {
                  rules.push(rule.cssText);
                }
              }
            }
          }
        } catch (e) {
          // CORS stylesheet, skip
        }
      }
      
      return rules;
    });

    for (const rule of criticalRules) {
      allRules.add(rule);
    }

    await page.close();
    console.log(`  Found ${criticalRules.length} rules`);
  }

  return Array.from(allRules);
}

// ─── 3. Main ──────────────────────────────────────────────────────
async function main() {
  console.log('🎨 Extracting Critical CSS...\n');

  // Ensure dist is built
  if (!fs.existsSync(DIST_DIR) || !fs.existsSync(path.join(DIST_DIR, 'home/index-pc.html'))) {
    console.log('  ⚠️  dist not found or incomplete. Building...');
    try {
      execSync('npm run build:css', { cwd: SRC_DIR, stdio: 'inherit' });
      execSync('npx webpack --mode=production 2>&1 | tail -3', { cwd: SRC_DIR, stdio: 'inherit' });
      execSync('node scripts/build-ssg.js 2>&1 | head -20', { cwd: SRC_DIR, stdio: 'inherit' });
      
      // Copy HTML pages manually
      const pagesDir = path.join(SRC_DIR, 'src/pages');
      function copyPages(src, rel) {
        for (const entry of fs.readdirSync(src)) {
          const full = path.join(src, entry);
          if (fs.statSync(full).isDirectory()) {
            copyPages(full, rel ? `${rel}/${entry}` : entry);
          } else if (entry.endsWith('.html')) {
            const distPath = path.join(DIST_DIR, rel || '', entry);
            fs.mkdirSync(path.dirname(distPath), { recursive: true });
            fs.copyFileSync(full, distPath);
          }
        }
      }
      copyPages(pagesDir, '');
      fs.copyFileSync(path.join(SRC_DIR, 'src/index.html'), path.join(DIST_DIR, 'index.html'));
      
      // Copy assets
      const assetDirs = ['css', 'js', 'fonts', 'lang', 'images'];
      for (const dir of assetDirs) {
        const srcDir = path.join(SRC_DIR, 'src/assets', dir);
        const dstDir = path.join(DIST_DIR, 'assets', dir);
        if (fs.existsSync(srcDir)) {
          fs.mkdirSync(dstDir, { recursive: true });
          execSync(`cp -R "${srcDir}/" "${dstDir}/"`, { stdio: 'ignore' });
        }
      }
    } catch (e) {
      console.error('❌ Build failed:', e.message);
      process.exit(1);
    }
    console.log('  ✅ Build complete for critical CSS extraction\n');
  }

  // Start server
  const server = await startServer(DIST_DIR, PORT);
  const url = `http://127.0.0.1:${PORT}`;

  try {
    // Launch browser
    const browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    console.log('📄 Loading homepage at 3 breakpoints...\n');
    const rules = await extractCriticalCSS(browser, url);

    // De-duplicate and sort
    const uniqueRules = [...new Set(rules)].sort();

    // Build critical CSS content
    let css = `/* Critical CSS — auto-generated by extract-critical-css.js */
/* Do not edit manually. Re-run script after major CSS changes. */
/* Generated: ${new Date().toISOString()} */
/* Total rules: ${uniqueRules.length} */

${uniqueRules.join('\n')}
`;

    // Write to file
    const outputPath = path.join(SRC_DIR, 'src/assets/css/critical.css');
    fs.writeFileSync(outputPath, css, 'utf-8');
    
    const size = Buffer.byteLength(css, 'utf-8');
    console.log(`\n✅ Critical CSS saved to src/assets/css/critical.css`);
    console.log(`   ${uniqueRules.length} rules, ${(size / 1024).toFixed(1)} KB`);
    
    await browser.close();
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    server.close();
    process.exit(0);
  }
}

main();
