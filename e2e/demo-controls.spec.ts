import { expect, test } from '@playwright/test';
import { completeOnboarding } from './helpers';

test.describe('demo controls and home questions', () => {
  test('answering the opening question and simulating a session', async ({ page }) => {
    await completeOnboarding(page, { name: 'Corinne', loved: 'Lily' });

    // The companion's first question is on Home; answer it.
    await expect(page.getByText(/Tell me about Lily/)).toBeVisible();
    await page
      .getByPlaceholder('Say as much or as little as you want…')
      .fill('She drew foxes on everything.');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('It is heard. It stays here.')).toBeVisible();

    // Demo controls: cadence starts at 0 of 9; Simulate advances it.
    await page.getByRole('tab', { name: 'Profile' }).click();
    await expect(page.getByText(/0 of 9/)).toBeVisible();
    await page.getByRole('button', { name: 'Simulate a journaling session' }).click();
    await expect(page.getByText(/1 of 9/)).toBeVisible();

    // Reset progress returns the cadence to zero.
    await page.getByRole('button', { name: 'Reset progress' }).click();
    await expect(page.getByText(/0 of 9/)).toBeVisible();
  });

  test('companion tone reflects the gate choice', async ({ page }) => {
    await completeOnboarding(page, { tone: 'Quiet and minimal' });
    await page.getByRole('tab', { name: 'Profile' }).click();
    await expect(page.getByText('COMPANION TONE')).toBeVisible();
    await expect(page.getByText('Quiet and minimal')).toBeVisible();
  });
});
