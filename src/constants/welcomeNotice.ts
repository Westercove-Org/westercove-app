/**
 * The S0 welcome-notice gate copy (Q-Set v7, spec lines 42-58), VERBATIM and
 * IN THE ATTORNEY-SIGNED ORDER ('the wording, in full'). Reproduced exactly —
 * not paraphrased, shortened, softened, or resequenced. The crisis numbers, the
 * 18+ line (which sits right after the crisis section), and the promises
 * ("We will not use the word closure" ...) are load-bearing and must never
 * drift. A wording change that alters what a person agreed to MUST bump
 * NOTICE_VERSION so the acceptance is re-asked.
 *
 * The notice is modelled as one ordered `blocks` list so the render is exact
 * document order by construction and the sequence is testable. A block with a
 * heading and no body is a standalone line (the 18+ line); a block with a body
 * and no heading is a trailing paragraph (the closing).
 *
 * ponytail: FE is the source of the verbatim text for the beta gate. Stanley's
 * qs7-be-welcome-notice-consent will later serve this copy + version from
 * GET /legal/content; when it lands, swap the source and keep this as fallback.
 */
// Matches the server's current notice version (Stanley's qs7-be-welcome-notice-
// consent, GET /legal-disclaimer/content). Kept in sync so a member is not
// re-asked once after signup; swap to the served version when that fetch lands.
// v12: Wesley's consent-wording change (passive ack, no pre-agreement to Terms);
// aligns with QuietRoom #234 (d642e30). A v11 acker gets one expected re-ask.
export const NOTICE_VERSION = 'v12.2026-09-05';

export interface NoticeBlock {
  heading?: string;
  body?: string;
}

export const WELCOME_NOTICE = {
  title: 'Welcome to Westercove™',
  tagline: 'Here for you when the world goes quiet.',
  lede: 'Please read this before you begin. It is short, and it matters.',
  blocks: [
    { heading: 'Westercove™ is a companion, not care.', body: 'Westercove™ is an AI grief companion. You are talking with software, not with a person. It can sit with you, help you put words to what you are carrying, and point you toward people who can help. It is not therapy and it is not medical care. It does not replace a counselor, a doctor, a veterinarian, a hospice nurse, or a grief specialist. If you are working with someone, please keep working with them. If you need someone, we will help you find them. Because Westercove™ is not a licensed provider, what you write here does not carry the legal confidentiality that therapy does.' },
    { heading: 'If you are in crisis, please reach a person.', body: 'Westercove™ is not an emergency service. Call or text 988 to reach the Suicide and Crisis Lifeline. Text HOME to 741741 to reach the Crisis Text Line. If anyone is in immediate danger, call 911. These numbers stay at the bottom of every screen.' },
    { heading: 'Westercove™ is for adults. You must be 18 or older to use it.' },
    { heading: 'What this space will hold.', body: 'Whoever you are grieving, a person or an animal, your loss belongs here. Sadness, rage, guilt, dark humor, complicated love, conflicting feelings, hopelessness, despair, longing, regret, and almost any other shape grief takes. You do not have to soften any of it. If something you write suggests that you, another person, or an animal is in danger, Westercove™ will respond with crisis resources, and in rare cases we may need to act to keep someone safe. Our full policy is in the Terms, and we would rather you know that now than be surprised later.' },
    { heading: 'Your writing belongs to you.', body: 'Your journals, memories, anniversaries, and notes are yours. They are encrypted. They are never sold and never used to advertise to you. They are not visible to other members unless you choose to place them in your peer profile. You can export your full archive at any time, and you can delete your account at any time, with thirty days to change your mind.' },
    { heading: 'A few promises.', body: 'We will tell you the truth, including the parts that are hard to hear. We will not use the word closure. We will not call this a journey. We will not say “at least.” We will not tell you that everything happens for a reason. We will not tell you that you can get another one. We will use their name when you share it. We will sit with the silence.' },
    { body: 'You do not have to be okay. You do not have to perform anything here. There is no daily goal and no streak. Come back when you are ready, use Westercove™ as much as you need, or not at all.' },
  ] as NoticeBlock[],
  // Passive acknowledgement (Wesley, v12): shown as static text by Begin — NOT a
  // checkbox. We cannot ask someone to agree to the Terms before they have seen
  // them, and "I understand" is not the same as agreeing to continue. Pressing
  // Begin IS the acknowledgement. VERBATIM; must match the server's
  // LEGAL_DISCLAIMER_ACKNOWLEDGEMENT_CHECKS[0] (served via /legal-disclaimer/content).
  ackStatement:
    'By continuing, you confirm that you are 18 or older. You will have an opportunity to review and accept our Terms and Privacy Notice before using Westercove™.',
  beginLabel: 'Begin',
} as const;
