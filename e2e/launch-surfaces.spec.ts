import { expect, test, type Page } from '@playwright/test';

/**
 * Launch-gate E2E (Q-Set v7, USE_FOUR_DOORS default ON). Exercises the FE
 * surfaces a real user hits before the tab shell: the S0 welcome gate (verbatim
 * notice, passive v12 acknowledgement, acceptance recorded on Begin), the four-doors intake with
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

// The S0 gate fetches the server disclaimer content; intercept it so the tests
// are deterministic (no dependency on a live backend). `null` aborts the request
// to exercise the offline fallback.
const V13_CONTENT = {
  version: 'v13.2026-09-05',
  title: 'Welcome to Westercove™',
  summary: ['Please read this before you begin. It is short, and it matters.'],
  paragraphs: [
    'What Westercove™ is.',
    'Westercove™ is a digital grief wellness companion offering guided journaling, education, and personalized support for adults navigating complex loss, all in one quiet space.',
    'You must be 18 or older to use it.',
    'If you are in crisis, please reach a person.',
    'Westercove™ is not an emergency service. Call or text 988 to reach the Suicide and Crisis Lifeline.',
    'Your writing belongs to you.',
    'You can delete your account at any time, with thirty days to change your mind.',
    'A few promises.',
    'We will not use the word closure. We will sit with the silence.',
  ],
  bullets: [],
  acknowledgement_checks: [
    'By continuing, you confirm that you are 18 or older. You will have an opportunity to review and accept our Terms and Privacy Notice before using Westercove™.',
  ],
  acknowledgement_label: 'Begin',
  save_and_read_later_label: 'Save and read later',
  community_guidelines_url: '/about/westercove#community-guidelines',
  links: [{ label: 'Terms', document: 'terms' }],
  last_updated: '2026-09-05',
};

async function mockDisclaimer(page: Page, content: object | null) {
  await page.route('**/legal-disclaimer/content*', (route) =>
    content
      ? // The content fetch is cross-origin (API host ≠ the served app), so the
        // fulfilled response needs CORS headers or the browser hides it (→ fallback).
        route.fulfill({ json: content, headers: { 'access-control-allow-origin': '*' } })
      : route.abort(),
  );
}

test.describe('S0 welcome gate', () => {
  test('renders the server-owned v13 body (served path)', async ({ page }) => {
    await mockDisclaimer(page, V13_CONTENT);
    await page.goto('/disclaimer');
    await expect(page.getByText('Welcome to Westercove™').first()).toBeVisible();
    // Served sections + the 18+ body line.
    await expect(page.getByText('What Westercove™ is.')).toBeVisible();
    await expect(page.getByText('You must be 18 or older to use it.')).toBeVisible();
    await expect(page.getByText(/thirty days to change your mind/)).toBeVisible();
    await expect(page.getByText(/We will not use the word closure/)).toBeVisible();
    // ™ glyph, never the literal word "trademark".
    await expect(page.getByText(/trademark/i)).toHaveCount(0);
  });

  test('passive acknowledgement: the exact sentence shows, Begin is always enabled', async ({
    page,
  }) => {
    await mockDisclaimer(page, V13_CONTENT);
    await page.goto('/disclaimer');
    // Passive ack — no checkbox; pressing Begin is the acknowledgement.
    await expect(
      page.getByText(
        /By continuing, you confirm that you are 18 or older\. You will have an opportunity to review and accept our Terms and Privacy Notice/,
      ),
    ).toBeVisible();
    await expect(page.getByRole('checkbox')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Begin' })).toBeEnabled();
  });

  test('records the version of the body shown — v13 on the served path', async ({ page }) => {
    await mockDisclaimer(page, V13_CONTENT);
    await page.goto('/disclaimer?intent=signup');
    await page.getByRole('button', { name: 'Begin' }).click();
    await expect(page).not.toHaveURL(/disclaimer/);
    const accepted = await page.evaluate(() =>
      Object.entries(window.localStorage)
        .map(([, v]) => v)
        .join('|'),
    );
    expect(accepted).toContain('v13.2026-09-05');
  });

  test('falls back to the hardcoded notice and records v12 when the fetch fails', async ({
    page,
  }) => {
    await mockDisclaimer(page, null); // abort → offline fallback
    await page.goto('/disclaimer?intent=signup');
    // Fallback (v12) copy is shown, not a blank gate.
    await expect(
      page.getByText('Westercove™ is for adults. You must be 18 or older to use it.'),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Begin' }).click();
    await expect(page).not.toHaveURL(/disclaimer/);
    const accepted = await page.evaluate(() =>
      Object.entries(window.localStorage)
        .map(([, v]) => v)
        .join('|'),
    );
    // Version integrity: the fallback records ITS OWN version, never v13.
    expect(accepted).toContain('v12.2026-09-05');
    expect(accepted).not.toContain('v13.2026-09-05');
  });

  test('the crisis line stays fixed at the foot of the gate', async ({ page }) => {
    await mockDisclaimer(page, V13_CONTENT);
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
