import { expect, type Page } from '@playwright/test';

export interface GateOptions {
  name?: string;
  loved?: string;
  /** Exact relationship row label, e.g. "My child" or "My pet or animal companion". */
  relationship?: string;
  /** Species row label (pet path only), e.g. "Dog". */
  species?: string;
  tone?: string;
}

/** Complete the day-zero gate, starting from the "Getting to know you" screen. */
export async function completeGate(page: Page, opts: GateOptions = {}) {
  const {
    name = 'Corinne',
    loved = 'Lily',
    relationship = 'My child',
    species,
    tone = 'Gentle and warm',
  } = opts;

  await expect(page.getByText('Getting to know you')).toBeVisible();
  await page.getByPlaceholder('Your name').fill(name);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  await page.getByPlaceholder('Their name').fill(loved);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  await page.getByText(relationship, { exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  if (species) {
    await page.getByText(species, { exact: true }).click();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
  }

  await page.getByText(tone, { exact: true }).click();
  await page.getByRole('button', { name: 'Enter Westercove' }).click();
  await expect(page.getByText('What are you feeling?')).toBeVisible();
}

/** Full arrival flow: launch → disclaimer → sign-in → gate → Home. */
export async function completeOnboarding(page: Page, opts: GateOptions = {}) {
  const { name = 'Corinne' } = opts;
  await page.goto('/launch');
  await page.getByText('Begin').click();
  await page.getByText('I understand, continue').click();
  await page.getByPlaceholder('Your name').fill(name);
  await page.getByPlaceholder('Password').fill('demo1234');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await completeGate(page, opts);
}
