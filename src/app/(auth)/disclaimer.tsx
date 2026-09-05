import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { HeroHeader } from '@/components/HeroHeader';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { NOTICE_VERSION, WELCOME_NOTICE } from '@/constants/welcomeNotice';
import { recordWelcomeAcceptance } from '@/features/auth/welcomeAcceptance';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

const heroImage = require('../../../assets/images/westercove_valley_green.jpg');

/**
 * S0 welcome gate (Q-Set v7, consent-wording v12). The verbatim welcome notice
 * with a PASSIVE acknowledgement (Wesley): we cannot ask someone to agree to the
 * Terms before they have seen them, and "I understand" is not agreement — so
 * there is no checkbox. Wesley's exact sentence sits by Begin, and pressing
 * Begin IS the acknowledgement: it records acceptance (version + timestamp) and
 * continues to sign-up or sign-in. The crisis line stays fixed at the foot.
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

  const onBegin = async () => {
    if (busy) return;
    setBusy(true);
    // The Begin press is the acknowledgement — record it before moving on.
    // Failure here must not trap the person on the gate; the signup finalize
    // call re-sends the version.
    try {
      await recordWelcomeAcceptance(NOTICE_VERSION);
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
        <Text variant="body" style={styles.para}>
          {WELCOME_NOTICE.lede}
        </Text>

        {WELCOME_NOTICE.blocks.map((b, i) => (
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

        <Text variant="body" color="textMuted" style={styles.ackStatement}>
          {WELCOME_NOTICE.ackStatement}
        </Text>

        <View style={styles.actions}>
          <Button
            label={WELCOME_NOTICE.beginLabel}
            variant="amethyst"
            onPress={onBegin}
            disabled={busy}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.xl,
    paddingBottom: 88,
    gap: spacing.md,
  },
  tagline: { fontStyle: 'italic' },
  para: { fontSize: 17, lineHeight: 27 },
  section: { gap: spacing.xs },
  heading: { marginTop: spacing.sm },
  ackStatement: { marginTop: spacing.lg, fontSize: 15, lineHeight: 22 },
  actions: { marginTop: spacing.lg },
});
