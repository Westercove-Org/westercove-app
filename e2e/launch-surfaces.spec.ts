import { expect, test, type Page } from '@playwright/test';

/**
 * Launch-gate E2E (Q-Set v7, USE_FOUR_DOORS default ON). Exercises the FE
 * surfaces a real user hits before the tab shell: the S0 welcome gate (verbatim
 * v13 disclaimer in Wesley's structure, affirmative 18+ checkbox gating Begin,
 * acceptance recorded on Begin), the four-doors intake with the five-tone picker, and
 * confirmation that the legacy DayZeroGate is not reachable with the flag on.
 * BE logic is covered separately (Angela). The disclaimer body is FE-owned
 * (disclaimerContent.ts), so the gate makes no content fetch to intercept.
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
  test('renders the v13 disclaimer in Wesley structure', async ({ page }) => {
    await page.goto('/disclaimer');
    await expect(page.getByText('Welcome to Westercove™').first()).toBeVisible();
    // Serif-italic subhead sits on the header (moved out of the scroll body).
    await expect(page.getByText('Here for you when the world goes quiet.')).toBeVisible();
    // Serif "bold-title" section headings + the standalone 18+ line.
    await expect(page.getByText('What Westercove™ is.')).toBeVisible();
    await expect(page.getByText('If you are in crisis, please reach a person.')).toBeVisible();
    await expect(page.getByText('You must be 18 or older to use it.')).toBeVisible();
    // "One thing we ask." is inline body, not its own heading.
    await expect(page.getByText(/One thing we ask\. This place was built in love/)).toBeVisible();
    await expect(page.getByText(/thirty days to change your mind/)).toBeVisible();
    await expect(page.getByText(/We will sit with the silence/)).toBeVisible();
    // ™ glyph, never the literal word "trademark".
    await expect(page.getByText(/trademark/i)).toHaveCount(0);
  });

  test('affirmative checkbox gates Begin (Wesley ruling); no passive sentence', async ({ page }) => {
    await page.goto('/disclaimer');
    const checkbox = page.getByRole('checkbox', {
      name: 'I am 18 or older, and I have read and understand the above.',
    });
    await expect(checkbox).toBeVisible();
    // The reversed passive sentence must be gone.
    await expect(page.getByText(/By continuing, you confirm that you are 18 or older/)).toHaveCount(
      0,
    );
    // Begin disabled until ticked, with the helper line; ticking enables it.
    await expect(page.getByRole('button', { name: 'Begin' })).toBeDisabled();
    await expect(page.getByText('Tick the box above to continue.')).toBeVisible();
    await checkbox.click();
    await expect(page.getByRole('button', { name: 'Begin' })).toBeEnabled();
    await expect(page.getByText('Tick the box above to continue.')).toHaveCount(0);
  });

  test('links: Full Terms + Privacy are links, Community Guidelines is plain text', async ({
    page,
  }) => {
    await page.goto('/disclaimer');
    await expect(page.getByRole('link', { name: 'Full Terms' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Privacy' })).toBeVisible();
    await expect(page.getByText('Community Guidelines')).toBeVisible();
    // No page exists yet — it must NOT be a link.
    await expect(page.getByRole('link', { name: 'Community Guidelines' })).toHaveCount(0);
  });

  test('records the version of the body shown (v14) on Begin', async ({ page }) => {
    await page.goto('/disclaimer?intent=signup');
    await page
      .getByRole('checkbox', {
        name: 'I am 18 or older, and I have read and understand the above.',
      })
      .click();
    await page.getByRole('button', { name: 'Begin' }).click();
    await expect(page).not.toHaveURL(/disclaimer/);
    const accepted = await page.evaluate(() =>
      Object.entries(window.localStorage)
        .map(([, v]) => v)
        .join('|'),
    );
    expect(accepted).toContain('v14.2026-09-05');
  });

  test('the crisis line stays fixed at the foot of the gate', async ({ page }) => {
    await page.goto('/disclaimer');
    await expect(page.getByText(/In crisis\? Call or text 988/).first()).toBeVisible();
  });
});

test.describe('four-doors intake (flag ON)', () => {
  test('opens on the warm arrival (door first), not the legacy day-zero wizard', async ({
    page,
  }) => {
    await seedNeedsGateSession(page);
    await page.goto('/gate');
    // Warm arrival: the door question is the first screen (not a name prompt).
    await expect(
      page.getByRole('heading', { name: 'What brings you to Westercove?' }),
    ).toBeVisible();
    await expect(page.getByText('Someone I love died')).toBeVisible();
    await expect(page.getByText('You can change this later.')).toBeVisible();
    // The legacy DayZeroGate's first question must NOT appear.
    await expect(page.getByText('What would you like me to call you?')).toHaveCount(0);
  });

  test('offers the four doors and drives through to the five-tone picker', async ({ page }) => {
    await seedNeedsGateSession(page);
    await page.goto('/gate');

    // door — all four options present (Wesley's labels), door is the first step
    await expect(page.getByRole('heading', { name: 'What brings you to Westercove?' })).toBeVisible();
    for (const label of [
      'Someone I love died',
      'I’m caring for someone who is slipping away',
      'Part of my life has changed or ended',
      'I lost a beloved animal',
    ]) {
      await expect(page.getByText(label)).toBeVisible();
    }
    await page.getByText('Someone I love died').click();
    await page.getByRole('button', { name: 'Next' }).click();

    // name — now a quieter step after the door
    await page.getByLabel('What should your grief companion call you?').fill('Sam');
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
