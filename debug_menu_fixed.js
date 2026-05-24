const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--ignore-certificate-errors'] });
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  
  await page.goto('https://192.168.3.181:3098/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(3000);
  
  const toggle = await page.$('#mobile-menu-toggle');
  if (toggle) await toggle.click();
  await page.waitForTimeout(2000);
  
  const info = await page.evaluate(() => {
    const styleEl = document.getElementById('mobile-menu-styles');
    if (!styleEl) return { error: 'no style' };
    const content = styleEl.textContent;
    
    // 检查 CTA 按钮 CSS
    const primaryRule = content.match(/\.mobile-menu-cta-btn\.primary\s*\{[^}]*\}/);
    
    // 检查 primary btn 的实际渲染
    const btn = document.querySelector('.mobile-menu-cta-btn.primary');
    const cs = btn ? getComputedStyle(btn) : null;
    
    return {
      primaryCSS: primaryRule ? primaryRule[0] : 'NOT FOUND',
      hasPrimaryBg: content.includes('background: #2E7D32'),
      hasPrimaryHoverBg: content.includes('background: #1B5E20'),
      renderedBg: cs?.backgroundColor,
      renderedColor: cs?.color,
    };
  });
  
  console.log(JSON.stringify(info, null, 2));
  
  await page.screenshot({ path: '/Users/chee/Projects/BrewYuKoLi/debug_menu_fixed.png', fullPage: false });
  await browser.close();
})();
