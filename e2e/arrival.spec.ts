import { expect, test } from '@playwright/test';

// A fresh browser has no session, so the guard sends the user to the launch
// screen. The crisis banner must be present before any account exists.
test.describe('arrival', () => {
  test('unauthenticated visitors land on launch with the crisis banner', async ({ page }) => {
    await page.goto('/launch');
    await expect(page.getByRole('heading', { name: 'Westercove' }).first()).toBeVisible();
    await expect(page.getByText('Begin')).toBeVisible();
    await expect(page.getByText(/In crisis\? Call or text 988/)).toBeVisible();
  });

  test('Begin leads into the disclaimer, which confirms 18+ and terms', async ({ page }) => {
    await page.goto('/launch');
    await page.getByText('Begin').click();
    // The S0 welcome gate (Q-Set v7): the notice title and the load-bearing 18+ line.
    await expect(page.getByText('Welcome to Westercove™').first()).toBeVisible();
    await expect(
      page.getByText('Westercove™ is for adults. You must be 18 or older to use it.'),
    ).toBeVisible();
  });
});
