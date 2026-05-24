const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--ignore-certificate-errors'] });
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await page.goto('https://192.168.3.181:3098/home/index-mobile.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(5000);
  
  const info = await page.evaluate(() => {
    const el = document.querySelector('[class*="h-["]');
    if (!el) return { error: 'element not found' };
    
    const cs = getComputedStyle(el);
    const results = [];
    
    // 列出所有影响高度的 CSS 规则
    for (let i = 0; i < document.styleSheets.length; i++) {
      const ss = document.styleSheets[i];
      if (!ss.cssRules) continue;
      for (let j = 0; j < ss.cssRules.length; j++) {
        const rule = ss.cssRules[j];
        if (rule.selectorText && rule.style) {
          if (el.matches(rule.selectorText)) {
            results.push({
              sheet: ss.href?.split('/').pop() || 'inline',
              selector: rule.selectorText,
              height: rule.style.height,
              priority: rule.style.getPropertyPriority('height'),
            });
          }
        }
      }
    }
    
    return {
      className: el.className?.substring(0, 60),
      computedHeight: cs.height,
      matchingRules: results,
    };
  });
  
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
