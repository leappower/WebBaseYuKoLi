import { test, expect } from '@playwright/test';

test.describe('Solutions Pages', () => {
  test('OEM page is accessible and contains expected keywords', async ({ page }) => {
    await page.goto('/solutions/oem/');
    await page.waitForLoadState('networkidle');
    const body = await page.locator('body').textContent();
    expect(body?.toLowerCase()).toMatch(/oem|来料/);
    const cta = page.locator('button, a').filter({ hasText: /Quote|样品/i });
    await expect(cta.first()).toBeVisible({ timeout: 5_000 });
  });

  test('ODM page contains ODM keywords', async ({ page }) => {
    await page.goto('/solutions/odm/');
    await page.waitForLoadState('networkidle');
    const body = await page.locator('body').textContent();
    expect(body?.toLowerCase()).toMatch(/odm|私标/);
  });

  test('OBM page contains OBW keywords', async ({ page }) => {
    await page.goto('/solutions/obm/');
    await page.waitForLoadState('networkidle');
    const body = await page.locator('body').textContent();
    expect(body?.toLowerCase()).toMatch(/obm|品牌/);
  });

  test('comparison table exists', async ({ page }) => {
    await page.goto('/solutions/');
    await page.waitForLoadState('networkidle');
    const table = page.locator('table');
    await expect(table.first()).toBeVisible({ timeout: 5_000 });
  });
});
