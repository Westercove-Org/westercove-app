import { expect, test } from '@playwright/test';
import { completeGate, completeOnboarding } from './helpers';

test.describe('test profiles switcher', () => {
  test('create a second person, switch between them, and delete', async ({ page }) => {
    await completeOnboarding(page, { name: 'Corinne', loved: 'Lily' });

    await page.getByRole('tab', { name: 'Profile' }).click();
    await expect(page.getByText('TEST PROFILES')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Corinne' })).toBeVisible();

    // Start a new test — begins blank and routes to the gate.
    await page.getByRole('button', { name: 'Start a new test' }).click();
    await completeGate(page, { name: 'Dale', loved: 'Cody', tone: 'Direct and plain' });

    // Both people now exist; the newest is active.
    await page.getByRole('tab', { name: 'Profile' }).click();
    await expect(page.getByRole('button', { name: 'Corinne' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dale' })).toBeVisible();

    // Switch back to Corinne and confirm her greeting on Home.
    await page.getByRole('button', { name: 'Corinne' }).click();
    await page.getByRole('tab', { name: 'Home' }).click();
    await expect(page.getByText(/Good (morning|afternoon|evening), Corinne/)).toBeVisible();

    // Delete Dale from the switcher (only inactive rows show a delete control).
    await page.getByRole('tab', { name: 'Profile' }).click();
    await page.getByRole('button', { name: 'Delete this test profile' }).click();
    await expect(page.getByRole('button', { name: 'Dale' })).toHaveCount(0);
  });

  test('pet path adds a species step (Step X of 5)', async ({ page }) => {
    await page.goto('/launch');
    await page.getByText('Begin').click();
    await page.getByText('I understand, continue').click();
    await page.getByPlaceholder('Your name').fill('Jenna');
    await page.getByPlaceholder('Password').fill('demo1234');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await completeGate(page, {
      name: 'Jenna',
      loved: 'Scout',
      relationship: 'My pet or animal companion',
      species: 'Dog',
      tone: 'Gentle and warm',
    });
    await expect(page.getByText(/Good (morning|afternoon|evening), Jenna/)).toBeVisible();
  });
});
