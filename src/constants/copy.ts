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
    newPasswordHint: 'At least 12 characters, with a mix of cases, a number, and a symbol.',
    send: 'Send reset code',
    submit: 'Reset password',
    sent: 'If that email is registered, a reset code is on its way.',
    done: 'Your password has been reset. You can sign in now.',
    genericError: 'Something went wrong. Please try again.',
    back: 'Back to sign in',
  },

  signUp: {
    title: 'Create your account',
    entrySubtitle: 'Start with your email, then choose how to join',
    orgCodeSubtitle: 'Set a password and enter your organization code',
    email: 'Email',
    emailPlaceholder: 'you@example.com',
    howToJoin: 'How would you like to join?',
    orgCodeOption: 'I have an organization code',
    orgCodeOptionHint: 'Join through your workplace or provider.',
    payOption: 'Pay to join',
    payOptionHint: 'Subscribe and get started right away.',
    payStarting: 'Starting checkout…',
    password: 'Password',
    passwordPlaceholder: 'Create a password',
    passwordHint: 'At least 12 characters, with a mix of cases, a number, and a symbol.',
    code: 'Organization code',
    codePlaceholder: 'Your code',
    join: 'Join',
    joining: 'Checking…',
    // Org-code confirm: a verify email was sent.
    confirmTitle: 'Check your email',
    confirmBody: 'Your account is set up. We sent a confirmation link to finish verifying your email — open it, then sign in.',
    // Paid path, already-registered (checkout_url null): generic, no existence leak.
    payCheckEmailTitle: 'Check your email',
    payCheckEmailBody: 'We’ve sent you an email with the next step. Open it to continue.',
    goToSignIn: 'Go to sign in',
    back: 'Back',
    invalidEmail: 'Enter a valid email address.',
    rateLimited: 'Too many attempts. Please wait a moment and try again.',
    genericError: 'Could not complete signup. Please try again.',
    checkoutUnavailable: 'Paying to join isn’t available right now. Try an organization code, or check back soon.',
    checkoutError: 'We couldn’t start checkout. Please try again.',
  },

  signUpReturn: {
    confirmingTitle: 'Confirming your payment',
    confirmingBody: 'Hang tight while we finish setting up your account…',
    successTitle: 'Check your email',
    successBody: 'You’re in. We’ve sent you an email to set your password and confirm your address — open it to finish, then sign in.',
    cancelledTitle: 'No charge was made',
    cancelledBody: 'Your checkout was cancelled and nothing was charged. You can try again or join with an organization code.',
    expiredTitle: 'Payment window lapsed',
    expiredBody: 'This checkout expired before it completed. Please start again — you won’t be charged twice.',
    slowTitle: 'This is taking a moment',
    slowBody: 'Your payment is still being confirmed. If you paid, you’ll get an email to set your password shortly — you can safely close this page.',
    errorTitle: 'We hit a snag',
    errorBody: 'We couldn’t confirm your signup. If you completed payment, check your email for a link to set your password; otherwise please try again.',
    goToSignIn: 'Go to sign in',
    backToSignUp: 'Back to sign up',
  },

  onboarding: {
    // Paid path: set-password landing (/welcome/:token).
    setPasswordTitle: 'Set your password',
    checkingTitle: 'One moment',
    checkingBody: 'Checking your link…',
    settingUpFor: 'Setting up', // "Setting up <masked email>"
    password: 'Password',
    passwordPlaceholder: 'Create a password',
    passwordHint: 'At least 12 characters, with a mix of cases, a number, and a symbol.',
    setPassword: 'Set password and continue',
    setting: 'Setting up…',
    doneTitle: 'You’re all set',
    doneBody: 'Your password is set and your email is confirmed. You can sign in now.',
    // Org-code path: verify-only landing (/verify-email/:token).
    verifyingTitle: 'Confirming your email',
    verifyingBody: 'Hang tight while we confirm your email…',
    verifiedTitle: 'Email confirmed',
    verifiedBody: 'Your email is confirmed. You can sign in now.',
    // Shared terminal states.
    expiredTitle: 'This link has expired',
    expiredBody: 'This link is no longer valid — it may have expired or already been used. Please start again or request a new one.',
    alreadyTitle: 'Already set up',
    alreadyBody: 'This account is already set up. You can sign in now.',
    errorTitle: 'We hit a snag',
    errorBody: 'We couldn’t complete this step. Please try again.',
    goToSignIn: 'Go to sign in',
    backToSignUp: 'Back to sign up',
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
