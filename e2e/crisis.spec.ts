import { expect, test } from '@playwright/test';

test.describe('crisis banner', () => {
  test('expands to one-tap actions', async ({ page }) => {
    await page.goto('/launch');
    await page.getByRole('button', { name: /In crisis/ }).click();
    await expect(page.getByRole('button', { name: /^Call 988\./ })).toBeVisible();
    await expect(
      page.getByRole('button', { name: /^Text HOME to 741741\. Crisis/ }),
    ).toBeVisible();
  });
});
