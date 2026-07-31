import { expect, test } from '@playwright/test';
import { completeOnboarding } from './helpers';

test.describe('discover library', () => {
  test('add a single book and then add all', async ({ page }) => {
    await completeOnboarding(page);
    await page.getByRole('tab', { name: 'Discover' }).click();

    await expect(page.getByText('YOUR LIBRARY', { exact: true })).toBeVisible();

    // The catalog is a full grid, not a 3-book row.
    await expect(page.getByText('Bearing the Unbearable')).toBeVisible();
    await expect(page.getByText('The Grief Recovery Handbook Workbook')).toBeVisible();
    await expect(page.getByText('Disenfranchised Grief')).toBeVisible();

    // Add one book; its control flips to the "in your library" state.
    await page
      .getByRole('button', { name: /Add to your library: Bearing the Unbearable/ })
      .click();
    await expect(
      page.getByRole('button', { name: /In your library: Bearing the Unbearable/ }),
    ).toBeVisible();

    // Add all books to the shelf.
    await page.getByRole('button', { name: 'Add all' }).click();

    // The per-profile library now holds every catalog id (persisted).
    const lib = await page.evaluate(() => {
      for (const k of Object.keys(localStorage)) {
        if (k.includes('.library')) return localStorage.getItem(k);
      }
      return null;
    });
    expect(lib).toContain('b1');
    expect(lib).toContain('b2');
    expect(lib).toContain('b3');
  });
});
