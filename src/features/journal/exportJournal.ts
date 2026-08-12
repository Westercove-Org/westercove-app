import './latin1TextDecoder';
import { jsPDF } from 'jspdf';
import { Platform } from 'react-native';

import { useSessionStore } from '@/features/auth/sessionStore';
import { useLibraryStore, type LibraryBook } from '@/features/discover/libraryStore';
import { useQuestionsStore } from '@/features/questions/questionsStore';
import { useWhatIKnowStore } from '@/features/profile/whatIKnowStore';
import { useEntriesStore } from './entriesStore';
import { faithSummary, userEntries } from './exportSelection';

/**
 * Export the journal as a shareable PDF: a kind overview of themes over a date
 * range, built only from the user's own writing. Companion replies, app
 * prompts, questions, and internals never appear, so the file is safe to email
 * to a therapist.
 */

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

/** Standard PDF fonts carry no smart quotes or long dashes; normalize them. */
function san(s: string): string {
  return s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...');
}

/** Every book in the library as the overview needs it, own books with their meta. */
function libraryTitles(books: LibraryBook[]): string {
  return books
    .map((b) => {
      if (b.source !== 'own') return `${b.title} by ${b.author}`;
      const meta = [b.status, b.reader ? `for ${b.reader}` : null].filter(Boolean).join(', ');
      const summary = b.summary ? `: ${b.summary}` : '';
      return `${b.title} by ${b.author}${meta ? ` (${meta})` : ''}${summary}`;
    })
    .join('; ');
}

/** Ask the backend for a theme overview built only from the user's entries. */
async function fetchSummary(entries: { date: string; text: string }[]): Promise<string> {
  try {
    const gate = useSessionStore.getState().session?.gateAnswers;
    const library = useLibraryStore.getState().myLibrary;
    const known = useWhatIKnowStore.getState().learned;

    const res = await fetch('/api/summary', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        entries: entries.map((e) => `${fmtDate(e.date)}\n${e.text}`).join('\n\n----\n\n'),
        name: gate?.callName ?? '',
        loved: gate?.lovedOneName ?? '',
        relationship: gate?.relationship ?? '',
        communication: gate?.tone ?? '',
        faith: faithSummary(useQuestionsStore.getState()),
        books: libraryTitles(library),
        known: known.map((k) => `${k.label}: ${k.value}`).join('\n'),
      }),
    });
    if (!res.ok) return '';
    const data = (await res.json()) as { summary?: string };
    return (data.summary ?? '').trim();
  } catch {
    return '';
  }
}

const AMETHYST: [number, number, number] = [38, 17, 78];
const GOLD: [number, number, number] = [176, 141, 46];
const INK: [number, number, number] = [43, 37, 48];
const SOFT: [number, number, number] = [107, 100, 114];

function makePdf(
  entries: { date: string; text: string }[],
  summary: string,
  names: { name: string; loved: string },
): jsPDF {
  const today = fmtDate(new Date().toISOString());
  const firstDate = entries.length ? fmtDate(entries[0].date) : '';
  const range = firstDate ? `${firstDate} to ${today}` : today;

  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const M = 56;
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const CW = W - M * 2;
  let y = M + 6;

  const ensure = (h: number) => {
    if (y + h > H - M) {
      doc.addPage();
      y = M;
    }
  };

  const para = (
    str: string,
    o: {
      size?: number;
      font?: string;
      style?: string;
      color?: [number, number, number];
      lh?: number;
      gap?: number;
    } = {},
  ) => {
    const size = o.size ?? 12;
    const lh = (o.lh ?? 1.5) * size;
    doc.setFont(o.font ?? 'times', o.style ?? 'normal');
    doc.setFontSize(size);
    const c = o.color ?? INK;
    doc.setTextColor(c[0], c[1], c[2]);
    for (const ln of doc.splitTextToSize(san(str), CW) as string[]) {
      ensure(lh);
      doc.text(ln, M, y);
      y += lh;
    }
    y += o.gap ?? 6;
  };

  para(names.name ? `${names.name}'s Journal` : 'A Grief Journal', {
    size: 24,
    style: 'bold',
    color: AMETHYST,
    gap: 2,
  });
  if (names.loved) {
    para(`In memory of ${names.loved}`, { size: 13, style: 'italic', color: SOFT, gap: 2 });
  }
  para(`Covering ${range}`, {
    size: 11,
    font: 'helvetica',
    style: 'bold',
    color: AMETHYST,
    gap: 8,
  });

  ensure(16);
  doc.setDrawColor(GOLD[0], GOLD[1], GOLD[2]);
  doc.setLineWidth(1.2);
  doc.line(M, y, W - M, y);
  y += 16;

  para(`Prepared ${today}${names.name ? ` by ${names.name}` : ''}.`, {
    size: 9.5,
    font: 'helvetica',
    color: SOFT,
    gap: 14,
  });

  if (summary) {
    para('OVERVIEW OF THEMES', {
      size: 11,
      font: 'helvetica',
      style: 'bold',
      color: AMETHYST,
      gap: 2,
    });
    para('A gentle summary of this journal and what helps, to support care.', {
      size: 9.5,
      font: 'helvetica',
      style: 'italic',
      color: SOFT,
      gap: 12,
    });
    for (const block of summary.split(/\n{2,}/).map((p) => p.trim())) {
      if (!block) continue;
      // A "## Title" line marks a gently titled reference section.
      if (block.startsWith('##')) {
        const [head, ...rest] = block.split('\n');
        const title = head.replace(/^#+\s*/, '').trim();
        if (title) {
          y += 4;
          para(title, { size: 11, font: 'helvetica', style: 'bold', color: GOLD, gap: 4 });
        }
        const body = rest.join('\n').trim();
        if (body) para(body, { size: 12, gap: 10 });
      } else {
        para(block, { size: 12, gap: 10 });
      }
    }
  } else {
    for (const e of entries) {
      para(fmtDate(e.date), { size: 10, font: 'helvetica', style: 'bold', color: GOLD, gap: 4 });
      for (const p of e.text.split(/\n{2,}/)) para(p, { size: 12, gap: 8 });
      y += 6;
    }
  }

  y += 8;
  para(
    summary
      ? "Created with Westercove. This document is a summary of the author's journal themes over the period shown."
      : "Created with Westercove. This document contains the author's personal writing only.",
    { size: 8.5, font: 'helvetica', color: SOFT, gap: 0 },
  );

  return doc;
}

/** Thrown when there is nothing to export — the screen shows this verbatim. */
export class NothingToExportError extends Error {}

/**
 * Build the PDF and hand it to the user: a download on web, the native share
 * sheet elsewhere. Resolves once the file exists; rejects if it could not be
 * written, so the screen never claims an archive is ready when it is not.
 */
export async function downloadJournal(): Promise<void> {
  const gate = useSessionStore.getState().session?.gateAnswers;
  const entries = userEntries(useEntriesStore.getState().entries);
  if (entries.length === 0) {
    throw new NothingToExportError(
      'There are no entries to export yet. Write one first, and it will be here when you come back.',
    );
  }

  const summary = await fetchSummary(entries);
  const doc = makePdf(entries, summary, {
    name: (useSessionStore.getState().session?.fullName || gate?.callName || '').trim(),
    loved: (gate?.lovedOneName ?? '').trim(),
  });

  const base =
    (useSessionStore.getState().session?.fullName || gate?.callName || 'westercove')
      .trim()
      .replace(/[^a-z0-9]+/gi, '-')
      .toLowerCase() || 'westercove';
  const filename = `${base}-journal.pdf`;

  if (Platform.OS === 'web') {
    doc.save(filename);
    return;
  }

  // Native: write the bytes to cache, then offer the system share sheet.
  const [{ File, Paths }, Sharing] = await Promise.all([
    import('expo-file-system'),
    import('expo-sharing'),
  ]);
  const base64 = doc.output('datauristring').split(',')[1];
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(base64, { encoding: 'base64' });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Your journal',
    });
  }
}
