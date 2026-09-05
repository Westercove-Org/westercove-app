import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { HeroHeader } from '@/components/HeroHeader';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { LEGAL_LINK_URLS, WELCOME_NOTICE } from '@/constants/welcomeNotice';
import { DISCLAIMER_NOTICE } from '@/features/auth/disclaimerContent';
import { recordWelcomeAcceptance } from '@/features/auth/welcomeAcceptance';
import { useTheme } from '@/theme';
import { fonts, MAX_CONTENT_WIDTH, spacing } from '@/theme/tokens';

const heroImage = require('../../../assets/images/westercove_valley_green.jpg');

/**
 * S0 welcome gate — v13 disclaimer re-implemented in RN to match Wesley's
 * westercove-beta design: a valley-green photo header, serif "bold-title"
 * section headings over relaxed 17px body, a standalone 18+ line, a gold divider
 * before the passive consent block, and a Begin / Go back pair. The body copy is
 * FE-owned (see disclaimerContent.ts) because the BE content model can't express
 * this structure; Begin records DISCLAIMER_NOTICE.version — the version actually
 * shown. Consent is an affirmative checkbox (Wesley's ref, Rohan's ruling):
 * Begin is disabled until the 18+ box is ticked. Terms/Privacy open the public
 * pages; Community Guidelines is plain text (no page yet). The crisis line stays
 * pinned at the foot via the (auth) layout.
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
  const [agreed, setAgreed] = useState(false);

  const onBegin = async () => {
    if (busy || !agreed) return;
    setBusy(true);
    // The 18+ tick + Begin is the acknowledgement — record the version of the
    // body actually shown. Failure here must not trap the person on the gate;
    // the signup finalize call re-sends the version.
    try {
      await recordWelcomeAcceptance(DISCLAIMER_NOTICE.version);
    } catch {
      // Storage unavailable (private mode): proceed; server re-ask covers it.
    }
    router.push(next);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <HeroHeader variant="compact" title={WELCOME_NOTICE.title} image={heroImage} />

      <ScrollView contentContainerStyle={styles.content}>
        <Text color="amethystText" style={styles.tagline}>
          {WELCOME_NOTICE.tagline}
        </Text>

        <Text variant="body" color="textMuted" style={styles.intro}>
          {DISCLAIMER_NOTICE.intro}
        </Text>

        {DISCLAIMER_NOTICE.blocks.map((b, i) => {
          if (b.kind === 'heading') {
            return (
              <Text key={i} color="heading" style={styles.heading}>
                {b.text}
              </Text>
            );
          }
          if (b.kind === 'standalone') {
            return (
              <Text key={i} style={styles.standalone}>
                {b.text}
              </Text>
            );
          }
          return (
            <Text key={i} variant="body" style={styles.para}>
              {b.text}
            </Text>
          );
        })}

        {/* Gold divider before the consent block (Wesley's ref). */}
        <View style={[styles.divider, { borderTopColor: colors.saffron }]} />

        {/* Affirmative 18+ checkbox (Wesley's ref, Rohan's ruling). The label is
            its own acknowledgement sentence — NOT a pre-agreement to the Terms.
            Begin is disabled until it is ticked. */}
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreed }}
          accessibilityLabel={DISCLAIMER_NOTICE.consentLabel}
          onPress={() => setAgreed((v) => !v)}
          style={styles.checkRow}
        >
          <View
            style={[
              styles.box,
              { borderColor: colors.line },
              agreed && { backgroundColor: colors.forest, borderColor: colors.forest },
            ]}
          >
            {agreed ? (
              <Text variant="bodySmall" color="onAccent">
                {'✓'}
              </Text>
            ) : null}
          </View>
          <Text variant="body" style={styles.checkLabel}>
            {DISCLAIMER_NOTICE.consentLabel}
          </Text>
        </Pressable>

        <View style={styles.actions}>
          <Button
            label={WELCOME_NOTICE.beginLabel}
            variant="amethyst"
            onPress={onBegin}
            disabled={busy || !agreed}
          />
          {!agreed ? (
            <Text variant="bodySmall" color="textMuted" style={styles.beginHelper}>
              {DISCLAIMER_NOTICE.beginHelper}
            </Text>
          ) : null}
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

        {/* Full Terms / Privacy open the public pages (amethyst, underlined);
            Community Guidelines is plain text — no page exists yet. */}
        <View style={styles.links}>
          <LegalLink label="Full Terms" url={LEGAL_LINK_URLS.terms} />
          <Text variant="bodySmall" color="textMuted" style={styles.dot}>
            ·
          </Text>
          <LegalLink label="Privacy" url={LEGAL_LINK_URLS.privacy} />
          <Text variant="bodySmall" color="textMuted" style={styles.dot}>
            ·
          </Text>
          <Text variant="bodySmall" color="textMuted">
            Community Guidelines
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function LegalLink({ label, url }: { label: string; url: string }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={() => Linking.openURL(url).catch(() => {})}
      hitSlop={8}
    >
      <Text variant="bodySmall" color="amethystText" style={styles.linkText}>
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
  },
  tagline: { fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 18, lineHeight: 26 },
  intro: { marginTop: spacing.md, fontSize: 15, lineHeight: 22 },
  // Serif "bold title" look (amethyst-deep), with generous space above to
  // separate sections (Wesley's space-y-8).
  heading: {
    fontFamily: fonts.serifSemibold,
    fontSize: 20,
    lineHeight: 26,
    marginTop: spacing.xxxl,
  },
  // The standalone 18+ line: medium-weight, sits on its own between §1 and §2.
  standalone: {
    fontFamily: fonts.sansMedium,
    fontSize: 17,
    lineHeight: 27,
    marginTop: spacing.xl,
  },
  // Body paragraphs, spaced within a section (Wesley's space-y-3).
  para: { fontSize: 17, lineHeight: 27, marginTop: spacing.md },
  divider: { borderTopWidth: 1, marginTop: spacing.xxxl },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginTop: spacing.xl },
  box: {
    width: 24,
    height: 24,
    borderWidth: 1.5,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkLabel: { flex: 1, fontSize: 15, lineHeight: 22 },
  beginHelper: { textAlign: 'center' },
  actions: { marginTop: spacing.xl, gap: spacing.sm },
  goBack: { alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  links: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText: { textDecorationLine: 'underline' },
  dot: { marginHorizontal: spacing.sm },
});
