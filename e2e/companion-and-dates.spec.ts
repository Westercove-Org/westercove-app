import { expect, test } from '@playwright/test';
import { completeOnboarding } from './helpers';

test.describe('companion replies and hard dates', () => {
  test('a journal entry gets a reply that names the loved one and echoes it', async ({ page }) => {
    await completeOnboarding(page, { name: 'Corinne', loved: 'Lily' });

    // Open the compose surface from Home and write a memory.
    await page.getByRole('button', { name: 'Write an entry' }).click();
    await page
      .getByLabel('Write your entry')
      .fill('She drew foxes on everything and narrated her whole life out loud.');
    await page.getByRole('button', { name: 'Save entry' }).click();

    // The entry thread shows a contextual companion reply that names Lily.
    // (The fragment-echo behaviour is covered deterministically in the
    // companion unit test; here we confirm a real reply renders in the thread.)
    await expect(page.getByText(/alongside Lily/)).toBeVisible();
  });

  test('answering the meaningful-dates question surfaces a Home hard-date card', async ({ page }) => {
    await completeOnboarding(page, { name: 'Corinne', loved: 'Lily' });

    // Q1 — "Tell me about Lily" (free text).
    await page
      .getByPlaceholder('Say as much or as little as you want…')
      .fill('She ran this house.');
    await page.getByRole('button', { name: 'Save' }).click();

    // Q2 — the photo offer (info). Skip it with "Okay".
    await page.getByRole('button', { name: 'Okay' }).click();

    // Q3 — meaningful dates. Give real dates.
    await page
      .getByPlaceholder('Only if you want to…')
      .fill('Born May 3, 2017. Died February 9, 2026.');
    await page.getByRole('button', { name: 'Save' }).click();

    // Home now shows a hard-date card driven by the captured date.
    await expect(page.getByText(/is coming up/)).toBeVisible();
  });
});
