import { expect, test } from '@playwright/test';

/**
 * Full v6-demo flow: trimmed onboarding → 4-step day-zero gate → Home question
 * card ("Tell me about [name]") → Profile Test Profiles + Demo Controls.
 */
test('sign-in, gate, home question, and test profiles', async ({ page }) => {
  await page.goto('/launch');
  await page.getByText('Begin').click();
  await page.getByText('I understand, continue').click();

  // Welcome / sign-in: any name + password continues.
  await expect(page.getByText('Welcome')).toBeVisible();
  await page.getByPlaceholder('Your name').fill('Corinne');
  await page.getByPlaceholder('Password').fill('demo1234');
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Getting to know you — step 1 of 4.
  await expect(page.getByText('Getting to know you')).toBeVisible();
  await expect(page.getByText(/Step 1 of 4/)).toBeVisible();
  await page.getByPlaceholder('Your name').fill('Corinne');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  await page.getByPlaceholder('Their name').fill('Lily');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  await page.getByText('My child', { exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  await page.getByText('Gentle and warm').click();
  await page.getByRole('button', { name: 'Enter Westercove' }).click();

  // Home shows the companion's first question about Lily.
  await expect(page.getByText(/Tell me about Lily/)).toBeVisible();
  await expect(page.getByText('What are you feeling?')).toBeVisible();

  // Profile: the active test profile and the demo controls exist.
  await page.getByRole('tab', { name: 'Profile' }).click();
  await expect(page.getByText('TEST PROFILES')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Corinne' })).toBeVisible();
  await expect(page.getByText('Simulate a journaling session')).toBeVisible();
  await expect(page.getByText(/0 of 9/)).toBeVisible();
});
