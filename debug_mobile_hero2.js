const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--ignore-certificate-errors'] });
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await page.goto('https://192.168.3.181:3098/home/index-mobile.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(5000);
  
  const info = await page.evaluate(() => {
    const hero = document.querySelector('section');
    const divs = hero.querySelectorAll('div');
    const results = [];
    
    divs.forEach((d, i) => {
      const cls = d.className;
      if (cls.includes('h-[') || cls.includes('flex') || cls.includes('img')) {
        const rect = d.getBoundingClientRect();
        results.push({
          i, cls: cls.substring(0, 50),
          computed: getComputedStyle(d).height,
          rect: Math.round(rect.height),
          children: d.children.length,
        });
      }
    });
    
    // 检查 img
    const imgs = hero.querySelectorAll('img');
    imgs.forEach(img => {
      results.push({
        src: img.src.split('/').pop(),
        rect: Math.round(img.getBoundingClientRect().height),
        natural: `${img.naturalWidth}x${img.naturalHeight}`,
        objectFit: getComputedStyle(img).objectFit,
      });
    });
    
    return results;
  });
  
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
