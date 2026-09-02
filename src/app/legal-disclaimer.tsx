import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { StackScreen } from '@/components/StackScreen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { copy } from '@/constants/copy';
import { getDeviceId } from '@/lib/deviceId';
import { services, type DisclaimerStatus } from '@/services';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

/**
 * The full versioned legal disclaimer (R-34/R-36). The plain-language beta
 * paragraphs open as a summary; the server-rendered full text follows; the two
 * required checkboxes and the accept / save-and-read-later actions come straight
 * from the server `content`. Save-and-read-later never blocks the door — it just
 * leaves. Re-acceptance is driven by the server's `required` flag (a version
 * change), so this screen doubles as the re-request surface. Crisis bar is fixed
 * at the bottom in every state.
 */
export default function LegalDisclaimerScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const d = copy.disclaimerScreen;

  const [status, setStatus] = useState<DisclaimerStatus | null>(null);
  const [checks, setChecks] = useState<boolean[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void getDeviceId()
      .then((id) => services.legal.getStatus(id))
      .then((s) => {
        if (!alive) return;
        setStatus(s);
        setChecks(new Array(s.content.acknowledgementChecks.length).fill(false));
      })
      .catch(() => alive && setError(d.loadError));
    return () => {
      alive = false;
    };
  }, [d.loadError]);

  const allChecked = checks.length > 0 && checks.every(Boolean);

  const onAccept = async () => {
    if (!allChecked || busy) return;
    setBusy(true);
    setError(null);
    try {
      const id = await getDeviceId();
      await services.legal.acknowledge(id);
      router.back();
    } catch {
      setError(d.saveError);
      setBusy(false);
    }
  };

  const toggle = (i: number) =>
    setChecks((prev) => prev.map((v, j) => (j === i ? !v : v)));

  const content = status?.content;

  return (
    <StackScreen title={content?.title ?? d.title}>
        {/* Plain-language summary (the beta paragraphs) always opens. */}
        <Card>
          <Text variant="body" style={styles.para}>
            {d.body1}
          </Text>
          <Text variant="body" style={styles.para}>
            {d.body2}
          </Text>
          <Text variant="body" color="textMuted" style={styles.para}>
            {d.body3}
          </Text>
        </Card>

        {error ? (
          <Text variant="bodySmall" color="crisis">
            {error}
          </Text>
        ) : null}

        {content ? (
          <>
            {/* Full versioned text, server-rendered. */}
            {content.paragraphs.map((p, i) => (
              <Text key={`p${i}`} variant="body" style={styles.para}>
                {p}
              </Text>
            ))}
            {content.bullets.map((b, i) => (
              <View key={`b${i}`} style={styles.bulletRow}>
                <Text variant="body" color="textMuted">
                  {'•'}
                </Text>
                <Text variant="body" color="textMuted" style={styles.bulletText}>
                  {b}
                </Text>
              </View>
            ))}

            {status?.required ? (
              <>
                {content.acknowledgementChecks.map((label, i) => (
                  <Pressable
                    key={`c${i}`}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: checks[i] ?? false }}
                    accessibilityLabel={label}
                    onPress={() => toggle(i)}
                    style={styles.checkRow}
                  >
                    <View
                      style={[
                        styles.box,
                        { borderColor: colors.line },
                        checks[i] && { backgroundColor: colors.forest, borderColor: colors.forest },
                      ]}
                    >
                      {checks[i] ? (
                        <Text variant="bodySmall" color="onAccent">
                          {'✓'}
                        </Text>
                      ) : null}
                    </View>
                    <Text variant="body" style={styles.checkLabel}>
                      {label}
                    </Text>
                  </Pressable>
                ))}

                <Button
                  label={busy ? d.saving : content.acknowledgementLabel}
                  variant="amethyst"
                  disabled={!allChecked || busy}
                  onPress={onAccept}
                />
                {/* Save and read later — never blocks the door. */}
                <Button
                  label={content.saveAndReadLaterLabel}
                  variant="secondary"
                  onPress={() => router.back()}
                />
              </>
            ) : (
              <Text variant="bodySmall" color="textMuted" style={styles.para}>
                {d.upToDate}
              </Text>
            )}
          </>
        ) : null}
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  para: { marginTop: spacing.sm, lineHeight: 24 },
  bulletRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  bulletText: { flex: 1 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, minHeight: 44 },
  box: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkLabel: { flex: 1 },
});
