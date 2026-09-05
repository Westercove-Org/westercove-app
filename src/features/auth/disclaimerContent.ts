import { NOTICE_VERSION, WELCOME_NOTICE, type NoticeBlock } from '@/constants/welcomeNotice';
import type { DisclaimerContent } from '@/services';

/**
 * Recognized section headings, used ONLY to style a served paragraph as a
 * section heading vs body text. The backend owns the disclaimer copy (served via
 * /legal-disclaimer/content); this list does not define the copy, and an
 * unrecognized line simply renders as body — so heading text can drift on the BE
 * without breaking the render. Keep in sync with the served headings when they
 * change (design-disclaimer-rewrite v13).
 */
export const SECTION_HEADINGS = new Set<string>([
  'What Westercove™ is.',
  'If you are in crisis, please reach a person.',
  'What this space will hold.',
  'One thing we ask.',
  'Your writing belongs to you.',
  'A few promises.',
]);

/** Public site origin for resolving relative legal links (e.g. the served
 * community-guidelines path "/about/westercove#…"). Matches the Terms/Privacy
 * host. ponytail: if the BE ever serves a non-westercove.com relative path this
 * assumption breaks — revisit if Community Guidelines moves off the main site. */
const PUBLIC_SITE_BASE = 'https://westercove.com';

/** A served legal URL may be absolute (open as-is) or a site-relative path
 * (prefix with the public site origin). Null stays null (rendered as plain text). */
function absoluteUrl(url: string | null): string | null {
  if (!url) return null;
  return /^https?:\/\//i.test(url) ? url : `${PUBLIC_SITE_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

export interface ResolvedDisclaimer {
  /** The version of the body ACTUALLY displayed — served content.version, or the
   * fallback constant's own version. The gate records THIS on Begin so the
   * recorded acceptance always matches the copy the person saw. */
  version: string;
  /** Intro paragraphs shown above the sectioned body. */
  intro: string[];
  /** Sectioned body: a block with a heading starts a section; a block with a
   * body is a paragraph. */
  blocks: NoticeBlock[];
  communityGuidelinesUrl: string | null;
  /** True when the served content was unavailable and the hardcoded notice is
   * shown instead (offline / fetch failure). */
  usingFallback: boolean;
}

/**
 * Resolve the disclaimer to a single render model. Served content is the source
 * of truth; when it is null (fetch failed / offline) we fall back to the
 * hardcoded WELCOME_NOTICE, which is self-consistent (its own v12 copy AND
 * version) — never a v13 version stamped on v12 text, or vice-versa.
 */
export function resolveDisclaimer(content: DisclaimerContent | null): ResolvedDisclaimer {
  if (content) {
    return {
      version: content.version,
      intro: content.summary,
      blocks: content.paragraphs.map((p) =>
        SECTION_HEADINGS.has(p) ? { heading: p } : { body: p },
      ),
      communityGuidelinesUrl: absoluteUrl(content.communityGuidelinesUrl),
      usingFallback: false,
    };
  }
  return {
    version: NOTICE_VERSION,
    intro: [WELCOME_NOTICE.lede],
    blocks: WELCOME_NOTICE.blocks,
    communityGuidelinesUrl: null,
    usingFallback: true,
  };
}
