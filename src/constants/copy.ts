/**
 * Verbatim product copy, lifted from the high-fidelity screens and specs.
 * The voice is deliberate: plain and warm, the word "died" over softer
 * substitutes, and never a nudge about absence.
 */
export const copy = {
  wordmark: 'Westercove',

  crisis: {
    bannerLine: 'In crisis? Call or text 988 · Text HOME to 741741',
    call988: 'Call or text 988',
    call988Sub: 'Suicide and Crisis Lifeline',
    textHome: 'Text HOME to 741741',
    textHomeSub: 'Crisis Text Line',
  },

  home: {
    prompt: 'What are you feeling?',
    search: 'Search your entries, books, memories',
    recent: 'RECENT',
  },

  journal: {
    prompt: 'What are you feeling?',
    entries: 'JOURNALS',
    empty: 'There is nothing here yet, and that is fine. Begin when you are ready.',
  },

  discover: {
    search: 'Search books, training, community',
    tapBook: 'Tap a book to fetch its summary.',
    trainingTitle: 'Trainings and workshops',
    trainingSub: 'By region and loss type, updated over time',
    communityTitle: 'Peer connection',
    communitySub: 'Opens in a later phase',
    communityPhase: 'Phase 3',
  },

  support: {
    needSomeone: 'IF YOU NEED SOMEONE NOW',
    search: 'Search support and reading',
    orgs: 'ORGANIZATIONS BY LOSS TYPE',
    reading: 'READING',
  },

  profile: {
    lovedOnes: 'LOVED ONES',
    yourSpace: 'YOUR SPACE',
    settings: 'SETTINGS',
  },

  disclaimer:
    'Westercove is a wellness companion, not therapy, and it does not diagnose.',

  launch: {
    tagline: 'A quiet place, whenever you want it.',
    begin: 'Begin',
    haveAccount: 'I already have an account',
  },

  disclaimerScreen: {
    title: 'Before you begin',
    body: 'Westercove is a wellness companion, not therapy. It does not diagnose, and it is not a substitute for professional care.',
    crisis:
      'If you are in crisis, or if you are worried about yourself or someone else, please use the crisis line at the bottom of every screen.',
    terms:
      'By continuing, you confirm you are 18 or older and that you agree to our Terms and Privacy notice.',
    continue: 'I understand, continue',
    goBack: 'Go back',
  },

  signIn: {
    title: 'Welcome',
    subtitle: 'Sign in to continue',
    name: 'Your name',
    namePlaceholder: 'Your name',
    password: 'Password',
    passwordPlaceholder: 'Password',
    rememberMe: 'Remember me',
    signIn: 'Sign in',
    forgot: 'Forgot email or password?',
    newHere: 'New to Westercove',
    create: 'Create an account',
    createHint: 'Setting up takes a moment, with no long intake.',
  },

  testProfiles: {
    label: 'TEST PROFILES',
    intro:
      'Each profile is a separate saved person. Use these to test different scenarios and switch between them anytime. Everything is saved in this browser.',
    notSetUp: 'New test (not set up yet)',
    startNew: 'Start a new test',
    signOut: 'Sign out',
    delete: 'Delete this test profile',
  },

  appearance: {
    label: 'APPEARANCE',
    system: 'System',
    light: 'Light',
    dark: 'Dark',
    hint: 'Match your device, or pick a look.',
  },

  demoControls: {
    label: 'DEMO CONTROLS',
    intro:
      'For the demo only. Each journaling session of about 8 minutes unlocks the next set of questions.',
    stage: 'Cadence stage',
    thisSession: 'This session',
    simulate: 'Simulate a journaling session',
    reset: 'Reset progress',
    tone: 'COMPANION TONE',
    currently: 'Currently',
  },

  library: {
    label: 'YOUR LIBRARY',
    addAll: 'Add all',
    intro:
      'Check the books you would like your companion to gently draw on. You can change these anytime. Until you choose any, your companion will draw softly on this whole list.',
    tapHint: 'Tap a book to read its summary. Tap the circle to add or remove it from your library.',
    add: 'Add to your library',
    added: 'In your library',
  },

  gate: {
    saveForLater: 'Save and continue later',
    skip: 'Skip this question',
    next: 'Continue',
    done: 'Enter Westercove',
    q1: 'What would you like me to call you?',
    q1Placeholder: 'Your name',
    q2: 'What is your loved one’s name?',
    q2Placeholder: 'Their name',
    q3: 'Who were they to you?',
    q4Human: '', // species step is pet-only
    q4Pet: 'What kind of animal were they?',
    q5: 'How would you like me to be with you?',
    tonePrompt: 'Tap what fits. You can change it anytime.',
  },

  safety: {
    // Level 2 — gentle, non-blocking, appended below a response.
    inlineTitle: 'Support is here if you want it',
    inlineBody:
      'Whatever you are carrying, you do not have to carry it alone. These are here anytime.',
    // Level 3 — Support Mode.
    supportModeTitle: 'Let us slow down together',
    supportModeBody:
      'There is no rush and nothing to get right. Stay here as long as you need.',
    grounding:
      'If it helps, take one slow breath. Feel where you are sitting. You are here, and this moment will pass.',
    reachTrusted: 'Reach someone you trust',
    // Level 4 — full-screen crisis interface.
    crisisBody: 'Please reach out. Someone is ready to talk or text with you.',
    softExit: 'Return to a quiet screen',
  },
} as const;

/** Organizations by loss type (Support). */
export const LOSS_TYPES = [
  'Child',
  'Military',
  'Overdose',
  'Pet',
  'Suicide',
] as const;

/** Reading list rows (Support). */
export const READING = [
  { title: 'Essays' },
  { title: 'Framework explainers' },
  { title: 'Grief glossary' },
  { title: 'White papers' },
  { title: 'Why Westercove', subtitle: 'Founder story' },
] as const;
