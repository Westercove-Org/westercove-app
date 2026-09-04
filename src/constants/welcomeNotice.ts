/**
 * The S0 welcome-notice gate copy (Q-Set v7, spec lines 42-58), VERBATIM.
 * Reproduced exactly — not paraphrased, shortened, or softened. The crisis
 * numbers, the 18+ line, and the promises ("We will not use the word closure"
 * ...) are load-bearing and must never drift. A wording change that alters what
 * a person agreed to MUST bump NOTICE_VERSION so the acceptance is re-asked.
 *
 * ponytail: FE is the source of the verbatim text for the beta gate. Stanley's
 * qs7-be-welcome-notice-consent will later serve this copy + version from
 * GET /legal/content; when it lands, swap the source and keep this as fallback.
 */
export const NOTICE_VERSION = 'welcome-2026-09-04';

export const WELCOME_NOTICE = {
  title: 'Welcome to Westercove™',
  tagline: 'Here for you when the world goes quiet.',
  lede: 'Please read this before you begin. It is short, and it matters.',
  sections: [
    {
      heading: 'Westercove™ is a companion, not care.',
      body: 'Westercove™ is an AI grief companion. You are talking with software, not with a person. It can sit with you, help you put words to what you are carrying, and point you toward people who can help. It is not therapy and it is not medical care. It does not replace a counselor, a doctor, a veterinarian, a hospice nurse, or a grief specialist. If you are working with someone, please keep working with them. If you need someone, we will help you find them. Because Westercove™ is not a licensed provider, what you write here does not carry the legal confidentiality that therapy does.',
    },
    {
      heading: 'If you are in crisis, please reach a person.',
      body: 'Westercove™ is not an emergency service. Call or text 988 to reach the Suicide and Crisis Lifeline. Text HOME to 741741 to reach the Crisis Text Line. If anyone is in immediate danger, call 911. These numbers stay at the bottom of every screen.',
    },
    {
      heading: 'What this space will hold.',
      body: 'Whoever you are grieving, a person or an animal, your loss belongs here. Sadness, rage, guilt, dark humor, complicated love, conflicting feelings, hopelessness, despair, longing, regret, and almost any other shape grief takes. You do not have to soften any of it. If something you write suggests that you, another person, or an animal is in danger, Westercove™ will respond with crisis resources, and in rare cases we may need to act to keep someone safe. Our full policy is in the Terms, and we would rather you know that now than be surprised later.',
    },
    {
      heading: 'Your writing belongs to you.',
      body: 'Your journals, memories, anniversaries, and notes are yours. They are encrypted. They are never sold and never used to advertise to you. They are not visible to other members unless you choose to place them in your peer profile. You can export your full archive at any time, and you can delete your account at any time, with thirty days to change your mind.',
    },
    {
      heading: 'A few promises.',
      body: 'We will tell you the truth, including the parts that are hard to hear. We will not use the word closure. We will not call this a journey. We will not say “at least.” We will not tell you that everything happens for a reason. We will not tell you that you can get another one. We will use their name when you share it. We will sit with the silence.',
    },
  ],
  adultsLine: 'Westercove™ is for adults. You must be 18 or older to use it.',
  closing: 'You do not have to be okay. You do not have to perform anything here. There is no daily goal and no streak. Come back when you are ready, use Westercove™ as much as you need, or not at all.',
  tickLabel: 'I am 18 or older, and I have read and understand the above.',
  beginLabel: 'Begin',
} as const;

