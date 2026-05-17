import { test, expect } from '@playwright/test';

test.describe('Products Pages', () => {
  test('/products/ page is accessible', async ({ page }) => {
    await page.goto('/products/');
    await page.waitForLoadState('networkidle');
    const body = await page.locator('body').textContent();
    expect(body?.length).toBeGreaterThan(0);
  });

  test('coffee category contains coffee-related keywords', async ({ page }) => {
    await page.goto('/products/coffee/');
    await page.waitForLoadState('networkidle');
    const body = await page.locator('body').textContent();
    expect(body?.toLowerCase()).toMatch(/coffee|咖啡/);
  });

  test('product detail page has Download Spec button', async ({ page }) => {
    await page.goto('/products/detail/');
    await page.waitForLoadState('networkidle');
    const specBtn = page.locator('button, a').filter({ hasText: /spec/i });
    await expect(specBtn.first()).toBeVisible({ timeout: 5_000 });
  });
});
