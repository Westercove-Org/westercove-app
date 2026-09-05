import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { CrisisBanner } from '@/components/CrisisBanner';
import { HeroHeader } from '@/components/HeroHeader';
import { CheckIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { NOTICE_VERSION, WELCOME_NOTICE } from '@/constants/welcomeNotice';
import { recordWelcomeAcceptance } from '@/features/auth/welcomeAcceptance';
import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/tokens';

const heroImage = require('../../../assets/images/westercove_valley_green.jpg');

/**
 * S0 welcome gate (Q-Set v7). The verbatim welcome notice, an affirmative 18+
 * tick, and Begin disabled until it is ticked. This is a gate, not a page
 * someone can scroll past: there is no way forward without the tick. The crisis
 * line stays fixed at the foot, as on every screen. On Begin the acceptance is
 * recorded (version + timestamp) and the person continues to sign-up or sign-in.
 */
export default function WelcomeGateScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  // A new user arriving via the launch "Create an account" CTA continues to
  // sign-up after accepting; everyone else continues to sign-in. Either way the
  // notice is shown and must be accepted first — never bypassed.
  const { intent } = useLocalSearchParams<{ intent?: string }>();
  const next = intent === 'signup' ? '/sign-up' : '/sign-in';

  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);

  const onBegin = async () => {
    if (!agreed || busy) return;
    setBusy(true);
    // Record the acceptance before moving on. Failure here must not trap the
    // person on the gate; the signup finalize call re-sends the version.
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

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreed }}
          accessibilityLabel={WELCOME_NOTICE.tickLabel}
          onPress={() => setAgreed((v) => !v)}
          style={styles.tickRow}
          hitSlop={8}
        >
          <View
            style={[
              styles.box,
              { borderColor: colors.line },
              agreed && { backgroundColor: colors.emerald, borderColor: colors.emerald },
            ]}
          >
            {agreed ? <CheckIcon size={16} color={colors.onAccent} /> : null}
          </View>
          <Text variant="body" style={styles.tickLabel}>
            {WELCOME_NOTICE.tickLabel}
          </Text>
        </Pressable>

        <View style={styles.actions}>
          <Button
            label={WELCOME_NOTICE.beginLabel}
            variant="amethyst"
            onPress={onBegin}
            disabled={!agreed || busy}
          />
        </View>
      </ScrollView>

      <CrisisBanner />
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
  tickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    minHeight: 44,
  },
  box: {
    width: 26,
    height: 26,
    borderRadius: radii.chip,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickLabel: { flex: 1, fontSize: 16, lineHeight: 23 },
  actions: { marginTop: spacing.lg },
});
