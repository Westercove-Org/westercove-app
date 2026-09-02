import { LegalDocumentScreen } from '@/components/LegalDocumentScreen';

/**
 * Terms & Privacy (R-24/R-26). Same server-driven surface as the disclaimer,
 * discriminated by `document="terms"`: the server owns the full Terms + Privacy
 * text, the required checkboxes, the labels, and the last-updated date (rendered
 * at the top by LegalDocumentScreen). No summary paragraphs — the terms text
 * opens directly. Acceptance goes through the same append-only log with the
 * terms discriminator.
 */
export default function LegalTermsScreen() {
  return <LegalDocumentScreen document="terms" fallbackTitle="Terms & Privacy" />;
}
