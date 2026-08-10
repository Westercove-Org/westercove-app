import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { StackScreen } from '@/components/StackScreen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { downloadJournal, NothingToExportError } from '@/features/journal/exportJournal';
import { useTheme } from '@/theme';

/** Export the full archive, any time, in every state including lapsed. The
 * protected Rage sub-section can be kept out of personal exports. */
export default function ExportScreen() {
  const { colors } = useTheme();
  const [includeRage, setIncludeRage] = useState(true);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onExport = async () => {
    setBusy(true);
    setError(null);
    try {
      await downloadJournal({ includeRage });
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

      <Card>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: includeRage }}
          accessibilityLabel="Include the protected Rage section"
          onPress={() => setIncludeRage((v) => !v)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }}
        >
          <View
            style={{
              width: 48,
              height: 28,
              borderRadius: 14,
              padding: 2,
              justifyContent: 'center',
              backgroundColor: includeRage ? colors.forest : colors.line,
            }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: '#FFFFFF',
                alignSelf: includeRage ? 'flex-end' : 'flex-start',
              }}
            />
          </View>
          <Text variant="body">Include the protected Rage section</Text>
        </Pressable>
      </Card>

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
