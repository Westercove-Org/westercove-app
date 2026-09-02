import { existsSync } from 'fs';
import { join } from 'path';

import { DEEP_LINK_TARGETS } from '../deepLink';

/**
 * R-63: no email template may link to a route the app does not have. The
 * templates live in GHL, so the check runs against the three fixed URL values:
 * each must resolve to a registered Expo Router file, and each non-home target
 * must be in the allowlist that carries it through sign-in (R-62).
 */
const APP_DIR = join(__dirname, '../../../app');

// Fixed GHL custom values (westercoveapp://<path>) → in-app path. See deepLink.ts.
const FIXED_LINKS: Record<string, string> = {
  app_url: '/',
  membership_url: '/subscription',
  update_card_url: '/update-card',
};

// In-app path → the Expo Router file that registers it.
const ROUTE_FILE: Record<string, string> = {
  '/': '(tabs)/index.tsx',
  '/subscription': 'subscription.tsx',
  '/update-card': 'update-card.tsx',
};

describe('deep-link routes (R-63)', () => {
  it.each(Object.entries(FIXED_LINKS))(
    '%s resolves to a registered Expo route',
    (_name, path) => {
      expect(existsSync(join(APP_DIR, ROUTE_FILE[path]))).toBe(true);
    },
  );

  it('every non-home fixed target is carried through sign-in', () => {
    for (const path of Object.values(FIXED_LINKS)) {
      if (path !== '/') expect(DEEP_LINK_TARGETS.has(path)).toBe(true);
    }
  });
});
