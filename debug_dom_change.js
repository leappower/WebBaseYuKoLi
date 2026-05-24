const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--ignore-certificate-errors'] });
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  
  // 捕获 DOM 变化
  await page.goto('https://192.168.3.181:3098/home/index-mobile.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
  
  // 在 JS 执行前检查
  const beforeJS = await page.evaluate(() => {
    const el = document.querySelector('[class*="h-["]');
    return el ? el.className : 'not found';
  });
  
  console.log('Before JS:', beforeJS);
  
  await page.waitForTimeout(3000);
  
  const afterJS = await page.evaluate(() => {
    const el = document.querySelector('[class*="h-["]');
    return el ? el.className : 'not found';
  });
  
  console.log('After JS:', afterJS);
  
  await browser.close();
})();
