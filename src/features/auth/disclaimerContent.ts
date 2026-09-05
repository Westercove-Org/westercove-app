/**
 * S0 disclaimer body — v13 copy in Wesley's westercove-beta STRUCTURE, owned by
 * the FE and rendered verbatim. The BE `getContent('disclaimer')` model is a
 * flat paragraph list and cannot express this document (five headed sections,
 * the standalone 18+ line between §1 and §2, the inline "One thing we ask."
 * opening), so — per Rohan's blessing — the gate hardcodes the body and records
 * THIS version on Begin (version integrity: the recorded acceptance always
 * matches the copy the person actually saw). The authed legal screen stays
 * BE-served. Copy is VERBATIM from shared/disclaimer_copy_v13.md; a wording
 * change MUST bump DISCLAIMER_VERSION so acceptance is re-asked.
 *
 * Render the trademark GLYPH ("Westercove™") — never the word "trademark".
 */

// A single ordered list so document order is exact by construction and testable.
// heading  → serif bold section title (amethyst).
// standalone → a bold line that stands on its own (the 18+ line, between §1/§2).
// para     → a body paragraph.
export type DisclaimerBlock =
  | { kind: 'heading'; text: string }
  | { kind: 'standalone'; text: string }
  | { kind: 'para'; text: string };

// v14: the consent affordance changed from passive to an affirmative checkbox
// (Wesley's ref, Rohan's ruling). The BODY copy is unchanged v13 text, but a
// consent-wording change bumps the acceptance version so it is re-asked.
//
// DRIFT GUARD — LOCKSTEP REQUIRED: the gate no longer fetches getContent, so this
// constant is the sole FE source and can silently diverge from the server. It
// MUST equal QuietRoom's LEGAL_DISCLAIMER_VERSION (Stanley, QR #239 =
// v14.2026-09-05). If BE bumps the version, bump this in the same change or the
// accepted version won't match /legal/status and every user is re-asked.
// disclaimerContent.test.ts pins this string; keep that test in sync too.
export const DISCLAIMER_VERSION = 'v14.2026-09-05';

export const DISCLAIMER_NOTICE = {
  version: DISCLAIMER_VERSION,
  intro: 'Please read this before you begin. It is short, and it matters.',
  // Wesley's affirmative checkbox label — its own 18+ acknowledgement sentence,
  // NOT a pre-agreement to the Terms (guard: nothing here claims agreement to
  // Terms/Privacy before they are viewed). BE serves this verbatim (checks[0],
  // QR #238); hardcoded here because the gate presentation is hardcoded.
  consentLabel: 'I am 18 or older, and I have read and understand the above.',
  beginHelper: 'Tick the box above to continue.',
  blocks: [
    { kind: 'heading', text: 'What Westercove™ is.' },
    {
      kind: 'para',
      text: 'Westercove™ is a digital grief wellness companion offering guided journaling, education, and personalized support for adults navigating complex loss, all in one quiet space.',
    },
    {
      kind: 'para',
      text: 'You are talking with software, not with a person. What we offer is grief wellness and education. We do not diagnose, treat, or cure anything, and we do not promise an outcome. Nobody can tell you how long grief takes or how it should feel, and we will not claim to.',
    },
    {
      kind: 'para',
      text: 'Westercove™ is not therapy and it is not medical care. It does not replace a counselor, a doctor, a veterinarian, a hospice nurse, or a grief specialist. It works alongside the care you already have and never stands in place of it. If you are working with someone, please keep working with them. If you need someone, we will help you find them.',
    },
    { kind: 'standalone', text: 'You must be 18 or older to use it.' },
    { kind: 'heading', text: 'If you are in crisis, please reach a person.' },
    {
      kind: 'para',
      text: 'Westercove™ is not an emergency service. Call or text 988 to reach the Suicide and Crisis Lifeline. Text HOME to 741741 to reach the Crisis Text Line. If anyone is in immediate danger, call 911. These numbers stay at the bottom of every screen.',
    },
    { kind: 'heading', text: 'What this space will hold.' },
    {
      kind: 'para',
      text: 'Whoever you are grieving, yourself, a person or an animal, your loss belongs here. Sadness, rage, guilt, dark humor, complicated love, hopelessness, longing, regret, and almost any other shape grief takes. You do not have to soften any of it.',
    },
    {
      kind: 'para',
      text: 'One thing we ask. This place was built in love, and it can hold your love, hope, anger, and hurt, and the things you cannot say anywhere else. Be as angry as you need to be, at anyone, including the person who died. The one thing this space cannot hold is a threat to harm another person.',
    },
    {
      kind: 'para',
      text: 'If something you write suggests that you, another person, or an animal is in danger, Westercove™ will respond with crisis resources, and in rare cases we may need to act to keep someone safe. Our full policy is in the Terms.',
    },
    { kind: 'heading', text: 'Your writing belongs to you.' },
    {
      kind: 'para',
      text: 'It travels over an encrypted connection, it is encrypted on the servers that store it, and access is locked to your account, so no other member can read it. It is never sold and never used to advertise to you. An organization that pays for your access still cannot read a word of it. You can download your journal at any time, as a summary you can keep or hand to your care team, and you can delete your account at any time, with thirty days to change your mind.',
    },
    {
      kind: 'para',
      text: 'We are building one more layer, so that your writing is encrypted inside the app before it is stored and a copy of the database would hold nothing readable.',
    },
    { kind: 'heading', text: 'A few promises.' },
    {
      kind: 'para',
      text: 'We will tell you the truth, including the parts that are hard to hear. We will not use the word closure. We will not call this a journey. We will not say "at least." We will not tell you that everything happens for a reason. We will not tell you that you can get another one. We will use their name when you share it. We will sit with the silence.',
    },
    {
      kind: 'para',
      text: 'You are welcome to feel what you feel. There is no daily goal and no streak. Come back when you are ready, use Westercove™ as much as you need, or not at all.',
    },
    {
      kind: 'para',
      text: 'You can download your communication at any time. We name the grief research we are built on, so you can check it. We hold many kinds of loss, including the ones other products leave out, and we do not rank them. You set the tone and the place of faith in your own language, and no faith at all is a full option.',
    },
  ] as DisclaimerBlock[],
} as const;
