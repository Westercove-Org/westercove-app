import { LegalDocumentScreen } from '@/components/LegalDocumentScreen';
import { copy } from '@/constants/copy';

/**
 * The full versioned legal disclaimer (R-34/R-36). Everything — the
 * plain-language intro summary, the full text, the checkboxes, the actions, and
 * re-request — is server-owned versioned copy rendered by the shared
 * LegalDocumentScreen (the disclaimer is the server's default document).
 */
export default function LegalDisclaimerScreen() {
  return <LegalDocumentScreen fallbackTitle={copy.disclaimerScreen.title} />;
}
