import { expect, test } from '@playwright/test';
import { completeOnboarding } from './helpers';

test.describe('appearance theme control', () => {
  test('choosing a theme persists across a reload', async ({ page }) => {
    await completeOnboarding(page);
    await page.getByRole('tab', { name: 'Profile' }).click();

    await expect(page.getByText('APPEARANCE')).toBeVisible();
    await page.getByRole('button', { name: 'Light' }).click();

    // The choice is written to persisted storage.
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('westercove.theme')))
      .toContain('"mode":"light"');

    // And it survives a full reload.
    await page.reload();
    const after = await page.evaluate(() => localStorage.getItem('westercove.theme'));
    expect(after).toContain('"mode":"light"');
  });
});
