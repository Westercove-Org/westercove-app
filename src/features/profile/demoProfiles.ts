/**
 * Test-profile roster, ported from the Lovable demo's `src/lib/demoProfiles.ts`.
 *
 * Sign-in recognizes a fixed set of nine test-profile names. Signing in by one
 * of them resumes that person's saved data on this device, so the demo does not
 * forget from day to day. No profile content is baked in: every profile starts
 * blank, and the tester fills in each person's answers and entries by hand. A
 * tester's own writing lives in that profile's saved state and is never
 * overwritten from here.
 */

export interface DemoProfile {
  /** Stable id, so a tester's saved data stays attached to the same person. */
  id: string;
  /** The friendly first name the companion uses in conversation. */
  name: string;
  /** First and last, the account name printed on the downloaded journal. */
  fullName: string;
}

export const DEMO_PROFILES: Record<string, DemoProfile> = {
  corinne: { id: 'demo-corinne', name: 'Corinne', fullName: 'Corinne Baker' },
  carol: { id: 'demo-carol', name: 'Carol', fullName: 'Carol & Paul Sutton' },
  dale: { id: 'demo-dale', name: 'Dale', fullName: 'Dale Munson' },
  patrice: { id: 'demo-patrice', name: 'Patrice', fullName: 'Patrice Ellison' },
  maria: { id: 'demo-maria', name: 'Maria', fullName: 'Maria Delgado' },
  denise: { id: 'demo-denise', name: 'Denise', fullName: 'Denise Whitfield' },
  jenna: { id: 'demo-jenna', name: 'Jenna', fullName: 'Jenna Cole' },
  robert: { id: 'demo-robert', name: 'Robert', fullName: 'Robert Hayes' },
  marcus: { id: 'demo-marcus', name: 'Marcus', fullName: 'Marcus Bell' },
};

/** The roster in sign-in order, for seeding the profile list. */
export const DEMO_ROSTER: DemoProfile[] = Object.values(DEMO_PROFILES);

/**
 * Every name a tester might type, mapped to its canonical profile. Full names,
 * first names, and last names all resolve, case- and space-insensitively.
 */
const ALIASES: Record<string, string> = {
  corinne: 'corinne',
  'corinne baker': 'corinne',
  baker: 'corinne',
  carol: 'carol',
  paul: 'carol',
  'carol sutton': 'carol',
  'paul sutton': 'carol',
  'carol and paul': 'carol',
  'carol and paul sutton': 'carol',
  'carol & paul': 'carol',
  'carol & paul sutton': 'carol',
  sutton: 'carol',
  dale: 'dale',
  'dale munson': 'dale',
  munson: 'dale',
  patrice: 'patrice',
  'patrice ellison': 'patrice',
  ellison: 'patrice',
  maria: 'maria',
  'maria delgado': 'maria',
  delgado: 'maria',
  denise: 'denise',
  'denise whitfield': 'denise',
  whitfield: 'denise',
  jenna: 'jenna',
  'jenna cole': 'jenna',
  cole: 'jenna',
  robert: 'robert',
  'robert hayes': 'robert',
  hayes: 'robert',
  marcus: 'marcus',
  'marcus bell': 'marcus',
  bell: 'marcus',
};

function normalize(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[á]/g, 'a');
}

/** Resolve a typed sign-in name to a test profile, or null if none matches. */
export function resolveDemoProfile(name: string): DemoProfile | null {
  const key = ALIASES[normalize(name)];
  return key ? DEMO_PROFILES[key] : null;
}
