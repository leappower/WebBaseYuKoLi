import { test, expect } from '@playwright/test';

test.describe('Contact Page', () => {
  test('page is accessible', async ({ page }) => {
    await page.goto('/contact/');
    await page.waitForLoadState('networkidle');
    const body = await page.locator('body').textContent();
    expect(body?.length).toBeGreaterThan(0);
  });

  test('page contains form elements', async ({ page }) => {
    await page.goto('/contact/');
    await page.waitForLoadState('networkidle');
    const input = page.locator('input, textarea');
    await expect(input.first()).toBeVisible({ timeout: 5_000 });
  });

  test('WhatsApp link exists', async ({ page }) => {
    await page.goto('/contact/');
    await page.waitForLoadState('networkidle');
    const waLink = page.locator('a[href*="wa.me"]');
    await expect(waLink.first()).toBeVisible({ timeout: 5_000 });
  });
});
