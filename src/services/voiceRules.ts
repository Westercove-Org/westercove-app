/**
 * Westercove brand-voice guardrail (SOP §4): companion text must never use em
 * dashes, never use exclamation points, and never soften death — the word is
 * always "died". `sanitize` enforces these on every generated companion string
 * so the rules hold even if a template slips.
 */

const EUPHEMISMS: [RegExp, string][] = [
  [/\bpassed away\b/gi, 'died'],
  [/\bpassed on\b/gi, 'died'],
  [/\bpassing away\b/gi, 'dying'],
  [/\bhas passed\b/gi, 'has died'],
  [/\bhave passed\b/gi, 'have died'],
  [/\bpassed\b/gi, 'died'],
];

/** Preserve the original casing of a replaced word (Passed → Died). */
function matchCase(source: string, replacement: string): string {
  if (source[0] === source[0]?.toUpperCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

export function sanitize(text: string): string {
  let out = text;

  // Euphemisms for death → "died", keeping the original capitalization.
  for (const [pattern, replacement] of EUPHEMISMS) {
    out = out.replace(pattern, (m) => matchCase(m, replacement));
  }

  // Em/en dashes → a comma + space (or nothing at edges), never a dash.
  out = out.replace(/\s*[—–]\s*/g, ', ');

  // Exclamation points → a period; collapse any runs.
  out = out.replace(/!+/g, '.');

  // Tidy any doubled punctuation/space introduced by the replacements.
  out = out.replace(/\.\s*\./g, '.').replace(/,\s*,/g, ',').replace(/\s{2,}/g, ' ');
  out = out.replace(/,\s*\./g, '.').replace(/\s+([.,])/g, '$1');

  return out.trim();
}
