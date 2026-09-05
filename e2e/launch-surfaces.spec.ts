import { expect, test, type Page } from '@playwright/test';

/**
 * Launch-gate E2E (Q-Set v7, USE_FOUR_DOORS default ON). Exercises the FE
 * surfaces a real user hits before the tab shell: the S0 welcome gate (verbatim
 * notice, 18+ tick gates Begin, acceptance recorded), the four-doors intake with
 * the five-tone picker, and confirmation that the legacy DayZeroGate is not
 * reachable with the flag on. BE logic is covered separately (Angela).
 */

// Seed a signed-in-but-not-onboarded session so the auth guard routes to /gate
// (needs-gate = session present, gateComplete false). Web secureStorage is
// localStorage; the session persists under westercove.<activeId>.session.
async function seedNeedsGateSession(page: Page) {
  await page.addInitScript(() => {
    const persisted = { state: { session: { gateComplete: false } }, version: 0 };
    window.localStorage.setItem('westercove.p-1.session', JSON.stringify(persisted));
  });
}

test.describe('S0 welcome gate', () => {
  test('shows the verbatim notice with the load-bearing lines', async ({ page }) => {
    await page.goto('/disclaimer');
    await expect(page.getByText('Welcome to Westercove™').first()).toBeVisible();
    // 18+ line sits right after the crisis section — must be present verbatim.
    await expect(
      page.getByText('Westercove™ is for adults. You must be 18 or older to use it.'),
    ).toBeVisible();
    // The "thirty days" promise (Rohan's 30-day ruling) — verbatim.
    await expect(page.getByText(/thirty days to change your mind/)).toBeVisible();
    // Load-bearing promises that must never drift.
    await expect(page.getByText(/We will not use the word closure/)).toBeVisible();
  });

  test('the 18+ tick gates Begin — cannot proceed unticked', async ({ page }) => {
    await page.goto('/disclaimer');
    const begin = page.getByRole('button', { name: 'Begin' });
    await expect(begin).toBeVisible();
    await expect(begin).toBeDisabled();

    // Ticking the affirmative checkbox enables Begin.
    const tick = page.getByRole('checkbox', {
      name: /I am 18 or older, and I have read and understand the above\./,
    });
    await tick.click();
    await expect(begin).toBeEnabled();
  });

  test('Begin records the acceptance at NOTICE_VERSION and moves on', async ({ page }) => {
    await page.goto('/disclaimer?intent=signup');
    await page.getByRole('checkbox', { name: /I am 18 or older/ }).click();
    await page.getByRole('button', { name: 'Begin' }).click();
    // Left the gate (sign-up is the next surface for the signup intent).
    await expect(page).not.toHaveURL(/disclaimer/);
    // Acceptance recorded with the server-matched version.
    const accepted = await page.evaluate(() =>
      Object.entries(window.localStorage)
        .map(([, v]) => v)
        .join('|'),
    );
    expect(accepted).toContain('v11.2026-09-04');
  });

  test('the crisis line stays fixed at the foot of the gate', async ({ page }) => {
    await page.goto('/disclaimer');
    await expect(page.getByText(/In crisis\? Call or text 988/).first()).toBeVisible();
  });
});

test.describe('four-doors intake (flag ON)', () => {
  test('reaches the four-doors gate, not the legacy day-zero wizard', async ({ page }) => {
    await seedNeedsGateSession(page);
    await page.goto('/gate');
    // Four-doors name step — its wording is distinct from DayZeroGate's q1.
    await expect(
      page.getByRole('heading', { name: 'What should your grief companion call you?' }),
    ).toBeVisible();
    // The legacy DayZeroGate's first question must NOT appear.
    await expect(page.getByText('What would you like me to call you?')).toHaveCount(0);
  });

  test('offers the four doors and drives through to the five-tone picker', async ({ page }) => {
    await seedNeedsGateSession(page);
    await page.goto('/gate');

    // name
    await page.getByLabel('What should your grief companion call you?').fill('Sam');
    await page.getByRole('button', { name: 'Next' }).click();

    // door — all four options present
    await expect(page.getByRole('heading', { name: 'What brings you here?' })).toBeVisible();
    for (const label of [
      'A person I love died',
      'Someone I love is still here, but I am losing them',
      'I lost a part of my life or myself',
      'My pet died',
    ]) {
      await expect(page.getByText(label)).toBeVisible();
    }
    await page.getByText('A person I love died').click();
    await page.getByRole('button', { name: 'Next' }).click();

    // q3 (their name) + q4 (relationship) for door 1 are text inputs
    await page.getByPlaceholder('Their name').fill('Alex');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByPlaceholder(/For example, my mother/).fill('my brother');
    await page.getByRole('button', { name: 'Next' }).click();

    // tone — all five, including the previously-missing "Direct and tactful"
    await expect(
      page.getByRole('heading', { name: /How would you like me to be with you/ }),
    ).toBeVisible();
    for (const tone of [
      'Gentle and warm',
      'Direct and plain',
      'Quiet and minimal',
      'Direct and tactful',
      'Spiritual',
    ]) {
      await expect(page.getByText(tone)).toBeVisible();
    }
  });
});
