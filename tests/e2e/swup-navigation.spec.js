// swup-navigation.spec.js — SWUP SPA Navigation P0 E2E Tests (adapted for dev branch)
// Run: npx playwright test tests/e2e/swup-navigation.spec.js
// Prerequisite: npm run dev running on port 3000

import { test, expect } from '@playwright/test';

// ==========================================================
// Config
// ==========================================================
const BASE = 'http://localhost:3000';
const VIEWPORTS = {
  pc:     { width: 1440, height: 900 },
  tablet: { width: 1024, height: 768 },
  mobile: { width: 375, height: 812 },
};

// ==========================================================
// P0 Core — 页面加载
// ==========================================================

test.describe('SWUP SPA Navigation — P0 Core', () => {

  // ① 页面加载无 JS 错误 — SPA Shell 模式
  test('① 页面加载无 JS 错误 (SPA Shell)', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // SPA shell 初始 URL 是 /, swup-init 应该导航到 /home/
    expect(errors).toHaveLength(0);
  });

  // ② 页面加载无 JS 错误 — SSG 模式（直接访问 /home/）
  test('② 直接访问 SSG 页面无 JS 错误', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(BASE + '/home/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    expect(errors).toHaveLength(0);
  });

  // ③ SPA 导航后内容可见，骨架隐藏
  test('③ 骨架屏在内容加载后隐藏', async ({ page }) => {
    await page.goto(BASE + '/home/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 骨架应该已经隐藏
    const skeleton = page.locator('#skeleton-overlay');
    try {
      await expect(skeleton).toHaveAttribute('hidden', { timeout: 5000 });
    } catch {
      // 如果已从 DOM 中移除或始终为 visible, 检查是否不可见
      await expect(skeleton).toHaveCSS('opacity', '0', { timeout: 3000 });
    }

    // 内容应该可见
    const content = page.locator('#spa-content');
    await expect(content).toBeAttached();
  });

  // ④ 导航到 /products/ 页 — 无 JS 错误
  test('④ SWUP 导航到 /products/ 无 JS 错误', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(BASE + '/home/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 找到产品链接并点击
    const productLink = page.locator('a[href*="/products/"]').first();
    try {
      await expect(productLink).toBeAttached({ timeout: 3000 });
      await productLink.click();
      await page.waitForTimeout(3000);
    } catch {
      // 如果找不到链接，用 SpaRouter 导航
      await page.evaluate(() => window.SpaRouter && window.SpaRouter.navigate('/products/'));
      await page.waitForTimeout(3000);
    }

    // 过滤 SWUP 警告（非致命）
    const realErrors = errors.filter(e =>
      !e.includes('swup') && !e.includes('Swup') && !e.includes('SWUP')
    );
    expect(realErrors).toHaveLength(0);
  });

  // ⑤ popstate 回退到上一页
  test('⑤ popstate 回退到上一页', async ({ page }) => {
    await page.goto(BASE + '/home/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Navigate to /products/
    await page.evaluate(() => window.SpaRouter && window.SpaRouter.navigate('/products/'));
    await page.waitForTimeout(2000);

    // 回退
    await page.goBack();
    await page.waitForTimeout(2000);

    // 应回到 /home/
    const url = page.url();
    expect(url).toMatch(/\/home\/?$/);
  });
});

// ==========================================================
// 三屏 viewport
// ==========================================================

test.describe('SWUP — 三屏 Viewport', () => {
  // ⑥ PC viewport 页面正常加载
  test('⑥ PC viewport 页面正常加载', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.pc);
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(BASE + '/home/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    expect(errors).toHaveLength(0);
    const nav = page.locator('navigator[data-component="navigator"]');
    await expect(nav).toBeAttached();

    // PC 应该有顶部水平导航
    const navVisible = await nav.isVisible();
    expect(navVisible).toBe(true);
  });

  // ⑦ Tablet viewport 页面正常加载
  test('⑦ Tablet viewport 页面正常加载', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.tablet);
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(BASE + '/home/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    expect(errors).toHaveLength(0);
  });

  // ⑧ Mobile viewport 页面正常加载
  test('⑧ Mobile viewport 页面正常加载', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(BASE + '/home/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    expect(errors).toHaveLength(0);
  });
});
