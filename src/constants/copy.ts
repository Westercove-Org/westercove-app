/**
 * Verbatim product copy, lifted from the high-fidelity screens and specs.
 * The voice is deliberate: plain and warm, the word "died" over softer
 * substitutes, and never a nudge about absence.
 */
export const copy = {
  wordmark: 'Westercove',

  crisis: {
    bannerLine: 'In crisis? Call or text 988 · Text HOME to 741741',
    /** The lead-in used by the compact bar, where the numbers are tappable spans. */
    bannerLead: 'In crisis?',
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
    tagline: 'Here for you when the world goes quiet.',
    begin: 'Begin',
    haveAccount: 'I already have an account',
  },

  disclaimerScreen: {
    title: 'Before you begin',
    body1:
      'Westercove is a wellness companion, not therapy. It does not diagnose, and it is not a substitute for professional care.',
    body2:
      'If you are in crisis, or if you are worried about yourself or someone else, please use the crisis line at the bottom of every screen.',
    body3:
      'By continuing, you confirm you are 18 or older and that you agree to our Terms and Privacy notice.',
    continue: 'I understand, continue',
    goBack: 'Go back',
  },

  signIn: {
    title: 'Welcome',
    subtitle: 'Sign in to continue',
    email: 'Email',
    emailPlaceholder: 'you@example.com',
    password: 'Password',
    passwordPlaceholder: 'Password',
    signIn: 'Sign in',
    forgot: 'Forgot your password?',
    genericError: 'Something went wrong signing in. Please try again.',
    newHere: 'New to Westercove',
    inviteOnly: 'Westercove is invitation-only. Check your email for an invite to set your password.',
    newPasswordSubtitle: 'Set a password to finish setting up your account',
    newPassword: 'New password',
    newPasswordPlaceholder: 'Create a password',
    newPasswordHint: 'At least 12 characters, with a mix of cases, a number, and a symbol.',
    setPassword: 'Set password and continue',
    back: 'Back',
  },

  forgotPassword: {
    title: 'Reset your password',
    requestSubtitle: 'Enter your email and we will send a reset code',
    confirmSubtitle: 'Enter the code we emailed you and a new password',
    email: 'Email',
    emailPlaceholder: 'you@example.com',
    code: 'Reset code',
    codePlaceholder: '6-digit code',
    newPassword: 'New password',
    newPasswordPlaceholder: 'Create a password',
    newPasswordHint: 'At least 8 characters, with a mix of cases, a number, and a symbol.',
    send: 'Send reset code',
    submit: 'Reset password',
    sent: 'If that email is registered, a reset code is on its way.',
    done: 'Your password has been reset. You can sign in now.',
    genericError: 'Something went wrong. Please try again.',
    back: 'Back to sign in',
  },

  gate: {
    title: 'Getting to know you',
    step: 'Step', // "Step X of N"
    skip: 'Skip',
    next: 'Continue',
    back: 'Back',
    done: 'Enter Westercove',
    q1: 'What would you like me to call you?',
    q1Placeholder: 'Your name',
    q2: 'What was their name?',
    q2Placeholder: 'Their name',
    q3: 'Who were they to you?',
    q4Pet: 'What kind of animal was [name]?',
    q4PetPlaceholder: 'Dog, cat, bird…',
    q4Breed: 'If you would like to share it, what breed or mix were they?',
    q4BreedHint: 'Optional. You can skip.',
    q4BreedPlaceholder: 'Breed or mix',
    q5: 'Everyone needs something different. How would you like me to be with you?',
    tonePrompt: 'You can change this anytime.',
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
    // Level 4 — full-screen crisis interface.
    crisisTitle: 'You deserve support right now',
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
  { id: 'essays', title: 'Essays' },
  { id: 'framework', title: 'Framework explainers' },
  { id: 'glossary', title: 'Grief glossary' },
  { id: 'white-papers', title: 'White papers' },
  { id: 'why', title: 'Why Westercove', subtitle: 'Founder story' },
] as const;
