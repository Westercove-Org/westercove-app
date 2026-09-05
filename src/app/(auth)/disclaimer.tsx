import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { HeroHeader } from '@/components/HeroHeader';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { LEGAL_LINK_URLS, WELCOME_NOTICE } from '@/constants/welcomeNotice';
import { resolveDisclaimer } from '@/features/auth/disclaimerContent';
import { recordWelcomeAcceptance } from '@/features/auth/welcomeAcceptance';
import { services, type DisclaimerContent } from '@/services';
import { useTheme } from '@/theme';
import { MAX_CONTENT_WIDTH, spacing } from '@/theme/tokens';

const heroImage = require('../../../assets/images/westercove_valley_green.jpg');

/**
 * S0 welcome gate (design-disclaimer-rewrite v13). The disclaimer BODY is
 * server-owned: the gate fetches services.legal.getContent('disclaimer')
 * (public, no-auth — #183) and renders the served summary + sectioned
 * paragraphs, so a copy/version change on the backend flows through without a
 * client release. The hardcoded WELCOME_NOTICE is kept ONLY as an offline
 * fallback so the gate never blanks on a fetch failure. Version integrity: Begin
 * records the version of the body ACTUALLY displayed (served content.version, or
 * the fallback's own version) — never a mismatch. The warm chrome (title,
 * tagline, mountain) and the passive Begin (#128) are FE layout; the crisis line
 * stays pinned at the foot via the (auth) layout.
 */
export default function WelcomeGateScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  // A new user arriving via the launch "Create an account" CTA continues to
  // sign-up after accepting; everyone else continues to sign-in. Either way the
  // notice is shown first — never bypassed.
  const { intent } = useLocalSearchParams<{ intent?: string }>();
  const next = intent === 'signup' ? '/sign-up' : '/sign-in';

  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<DisclaimerContent | null>(null);

  useEffect(() => {
    let alive = true;
    // Public content endpoint (no account yet). On any failure we fall back to
    // the hardcoded notice — the gate must never blank or trap the user.
    services.legal
      .getContent('disclaimer')
      .then((c) => alive && setContent(c))
      .catch(() => alive && setContent(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const resolved = resolveDisclaimer(content);

  const onBegin = async () => {
    if (busy || loading) return;
    setBusy(true);
    // The Begin press is the acknowledgement — record the version of the body
    // that was actually shown. Failure here must not trap the person on the
    // gate; the signup finalize call re-sends the version.
    try {
      await recordWelcomeAcceptance(resolved.version);
    } catch {
      // Storage unavailable (private mode): proceed; server re-ask covers it.
    }
    router.push(next);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <HeroHeader variant="compact" title={WELCOME_NOTICE.title} image={heroImage} />

      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="body" color="textMuted" style={styles.tagline}>
          {WELCOME_NOTICE.tagline}
        </Text>

        {loading ? (
          <ActivityIndicator style={styles.loading} color={colors.emerald} />
        ) : (
          <>
            {resolved.intro.map((line, i) => (
              <Text key={`intro${i}`} variant="body" style={styles.para}>
                {line}
              </Text>
            ))}

            {resolved.blocks.map((b, i) => (
              <View key={i} style={styles.section}>
                {b.heading ? (
                  <Text variant="cardTitle" style={styles.heading}>
                    {b.heading}
                  </Text>
                ) : null}
                {b.body ? (
                  <Text variant="body" style={styles.para}>
                    {b.body}
                  </Text>
                ) : null}
              </View>
            ))}
          </>
        )}

        {/* Passive acknowledgement (#128), unchanged and version-stable — matches
            the server's acknowledgement check. Shown once the body has loaded. */}
        <Text variant="body" color="textMuted" style={styles.ackStatement}>
          {WELCOME_NOTICE.ackStatement}
        </Text>

        <View style={styles.actions}>
          <Button
            label={WELCOME_NOTICE.beginLabel}
            variant="amethyst"
            onPress={onBegin}
            disabled={busy || loading}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={WELCOME_NOTICE.goBackLabel}
            onPress={() => router.back()}
            style={styles.goBack}
          >
            <Text variant="body" color="textMuted">
              {WELCOME_NOTICE.goBackLabel}
            </Text>
          </Pressable>
        </View>

        {/* Terms/Privacy open the public pages; Community Guidelines uses the
            served URL when present, otherwise renders as plain text (no URL yet). */}
        <View style={styles.links}>
          <LegalLink label="Full Terms" url={LEGAL_LINK_URLS.terms} />
          <Text variant="bodySmall" color="textMuted" style={styles.dot}>
            ·
          </Text>
          <LegalLink label="Privacy" url={LEGAL_LINK_URLS.privacy} />
          <Text variant="bodySmall" color="textMuted" style={styles.dot}>
            ·
          </Text>
          <LegalLink label="Community Guidelines" url={resolved.communityGuidelinesUrl} />
        </View>
      </ScrollView>
    </View>
  );
}

function LegalLink({ label, url }: { label: string; url: string | null }) {
  if (!url) {
    return (
      <Text variant="bodySmall" color="textMuted">
        {label}
      </Text>
    );
  }
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={() => Linking.openURL(url).catch(() => {})}
      hitSlop={8}
    >
      <Text variant="bodySmall" color="emerald">
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    // Consistent desktop width — the centered 640 column (see components/Screen.tsx).
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.xl,
    paddingBottom: 88,
    gap: spacing.md,
  },
  tagline: { fontStyle: 'italic' },
  loading: { marginTop: spacing.xl },
  para: { fontSize: 17, lineHeight: 27 },
  section: { gap: spacing.xs },
  heading: { marginTop: spacing.sm },
  ackStatement: { marginTop: spacing.lg, fontSize: 15, lineHeight: 22 },
  actions: { marginTop: spacing.lg, gap: spacing.sm },
  goBack: { alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  links: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: { marginHorizontal: spacing.sm },
});
