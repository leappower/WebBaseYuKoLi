// Take baseline screenshots for pre-refactor comparison
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, 'screenshots-baseline-pre-refactor');

const PAGES = [
  { name: 'home', url: '/home/' },
  { name: 'products', url: '/products/' },
  { name: 'pdp', url: '/products/coffee/BT-001/' },
  { name: 'support', url: '/support/' },
];

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  for (const { name, url } of PAGES) {
    errors.length = 0;
    console.log(`📸 Navigating to ${url}...`);
    await page.goto(`http://localhost:3099${url}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const filePath = path.join(OUT_DIR, `${name}.png`);
    await page.screenshot({ path: filePath, fullPage: true });
    console.log(`   Saved: ${filePath} (${(fs.statSync(filePath).size / 1024).toFixed(1)} KB)`);
    
    if (errors.length > 0) {
      console.log(`   ⚠️  JS Errors: ${errors.length}`);
      errors.forEach(e => console.log(`     - ${e}`));
    } else {
      console.log(`   ✅ No JS errors`);
    }
  }

  await browser.close();
  console.log(`\n✅ Baseline screenshots saved to ${OUT_DIR}`);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
