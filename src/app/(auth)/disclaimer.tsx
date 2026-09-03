import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { CrisisBanner } from '@/components/CrisisBanner';
import { HeroHeader } from '@/components/HeroHeader';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { copy } from '@/constants/copy';
import { linkifyConsentLine } from '@/features/legal/linkifyConsent';
import { services, type DisclaimerContent } from '@/services';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

const heroImage = require('../../../assets/images/westercove_valley_green.jpg');

/**
 * Pre-account 18+/not-therapy gate. Renders entirely from the PUBLIC, no-auth
 * legal content endpoint (sv7-legal-preauth-server-copy) — no legal copy is
 * hardcoded in the client. The member confirms the checks and continues; the
 * acknowledgement itself is recorded post-account (authed /acknowledge). On a
 * load failure we show no legal text and keep the door shut (Continue disabled)
 * rather than let anyone past an unseen disclaimer.
 */
export default function DisclaimerScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const d = copy.disclaimerScreen;
  // A new user arriving via the launch "Create an account" CTA continues to
  // sign-up; everyone else continues to sign-in. The notice is shown first.
  const { intent } = useLocalSearchParams<{ intent?: string }>();
  const next = intent === 'signup' ? '/sign-up' : '/sign-in';

  const [content, setContent] = useState<DisclaimerContent | null>(null);
  const [checks, setChecks] = useState<boolean[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    void services.legal
      .getContent('disclaimer')
      .then((c) => {
        if (!alive) return;
        setContent(c);
        setChecks(new Array(c.acknowledgementChecks.length).fill(false));
      })
      .catch(() => alive && setError(d.loadError));
    return () => {
      alive = false;
    };
  }, [d.loadError, attempt]);

  const allChecked = checks.every(Boolean);
  const toggle = (i: number) => setChecks((prev) => prev.map((v, j) => (j === i ? !v : v)));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <HeroHeader variant="compact" title={content?.title ?? d.title} image={heroImage} />

      <ScrollView contentContainerStyle={styles.content}>
        {error ? (
          <>
            <Text variant="body" color="crisis" accessibilityRole="alert" style={styles.para}>
              {error}
            </Text>
            <Button
              label="Try again"
              variant="secondary"
              onPress={() => {
                setError(null);
                setContent(null);
                setAttempt((a) => a + 1);
              }}
            />
          </>
        ) : !content ? (
          <ActivityIndicator color={colors.textMuted} />
        ) : (
          <>
            {content.summary.map((line, i) => (
              <Text
                key={`s${i}`}
                variant="body"
                color={i === content.summary.length - 1 ? 'textMuted' : 'textPrimary'}
                style={styles.para}
              >
                {/* Linkify any legal document the server names inline (e.g.
                    Terms). A stale label or an unserved target degrades to plain
                    text — never a dead tap on a consent screen. */}
                {linkifyConsentLine(line, content.links).map((seg, j) =>
                  seg.route ? (
                    <Text
                      key={`l${j}`}
                      variant="body"
                      color="forest"
                      accessibilityRole="link"
                      onPress={() => router.push(seg.route as Href)}
                      style={styles.link}
                    >
                      {seg.text}
                    </Text>
                  ) : (
                    seg.text
                  ),
                )}
              </Text>
            ))}

            {content.paragraphs.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setExpanded((v) => !v)}
                style={styles.readMore}
              >
                <Text variant="bodySmall" color="forest">
                  {expanded ? 'Hide the full disclaimer' : 'Read the full disclaimer'}
                </Text>
              </Pressable>
            ) : null}

            {expanded
              ? content.paragraphs.map((p, i) => (
                  <Text key={`p${i}`} variant="bodySmall" color="textMuted" style={styles.full}>
                    {p}
                  </Text>
                ))
              : null}

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
          </>
        )}

        <View style={styles.actions}>
          <Button
            label={content?.acknowledgementLabel ?? d.continue}
            variant="amethyst"
            disabled={!content || !allChecked}
            onPress={() => router.push(next)}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={d.goBack}
            onPress={() => router.back()}
            style={styles.goBack}
          >
            <Text variant="body" color="textMuted">
              {d.goBack}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Pre-account: the one screen a person in crisis has no other route from,
          so the crisis line is fixed at the bottom here too. */}
      <CrisisBanner compact />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.xl,
    paddingBottom: 88,
    gap: spacing.lg,
  },
  para: { fontSize: 17, lineHeight: 27 },
  link: { textDecorationLine: 'underline' },
  full: { lineHeight: 22 },
  readMore: { minHeight: 44, justifyContent: 'center' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 44 },
  box: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkLabel: { flex: 1 },
  actions: { marginTop: spacing.xl, gap: spacing.sm },
  goBack: { alignItems: 'center', minHeight: 44, justifyContent: 'center' },
});
