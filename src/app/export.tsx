import { useState } from 'react';

import { StackScreen } from '@/components/StackScreen';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { downloadJournal, NothingToExportError } from '@/features/journal/exportJournal';

/** Export the full archive, any time, in every state including lapsed. */
export default function ExportScreen() {
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onExport = async () => {
    setBusy(true);
    setError(null);
    try {
      await downloadJournal();
      setDone(true);
    } catch (err) {
      setError(
        err instanceof NothingToExportError
          ? err.message
          : 'Your archive could not be prepared just now. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <StackScreen title="Export">
      <Text variant="body" color="textMuted">
        Your entire archive — every entry, memory, and everything you have saved —
        is yours to take, any time.
      </Text>

      {error ? (
        <Text variant="body" color="textPrimary" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      {done ? (
        <Text variant="body" color="forest">
          Your archive is ready.
        </Text>
      ) : (
        <Button label="Export everything" loading={busy} onPress={onExport} />
      )}
    </StackScreen>
  );
}
