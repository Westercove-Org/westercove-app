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
      {/* h1 = beta's font-serif text-3xl (30px / lh 36); the serif-italic
          subhead sits on the header, matching beta. */}
      <HeroHeader
        variant="compact"
        title={WELCOME_NOTICE.title}
        subhead={WELCOME_NOTICE.tagline}
        image={heroImage}
        titleStyle={styles.h1}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="body" style={styles.intro}>
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

        {/* Gold divider before the consent block (beta's metallic gold rule). */}
        <View style={[styles.divider, { borderTopColor: colors.gold }]} />

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
            <Text variant="bodySmall" color="textMuted" style={styles.smallLink}>
              {WELCOME_NOTICE.goBackLabel}
            </Text>
          </Pressable>
        </View>

        {/* Full Terms / Privacy open the public pages (amethyst, underlined);
            Community Guidelines is plain text — no page exists yet. */}
        <View style={styles.links}>
          <LegalLink label="Full Terms" url={LEGAL_LINK_URLS.terms} />
          <Text variant="bodySmall" color="textMuted" style={[styles.dot, styles.smallLink]}>
            ·
          </Text>
          <LegalLink label="Privacy" url={LEGAL_LINK_URLS.privacy} />
          <Text variant="bodySmall" color="textMuted" style={[styles.dot, styles.smallLink]}>
            ·
          </Text>
          <Text variant="bodySmall" color="textMuted" style={styles.smallLink}>
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
      <Text variant="bodySmall" color="heading" style={styles.linkText}>
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
  // Type sizes match westercove-beta's resolved px (src/routes/disclaimer.tsx +
  // styles.css): same families (Source Serif 4 / Inter, already app-loaded).
  // Subhead: font-serif text-lg italic (18px / lh 28, leading default).
  // h1: font-serif text-3xl (30px / lh 36). Screen-title variant is already
  // Source Serif 4 400 amethyst; only the size grows to match beta.
  h1: { fontSize: 30, lineHeight: 36 },
  // Intro: text-[17px] leading-relaxed (17px / 1.625), foreground (not muted).
  // First line under the header, so no extra top margin (beta main is py-8).
  intro: { fontSize: 17, lineHeight: 27.6 },
  // Section h2: font-serif text-xl leading-snug (20px / 1.375), amethyst-deep.
  // Beta's headings inherit weight 400 (Tailwind preflight resets <h2>), so this
  // is Source Serif 4 Regular — NOT semibold. letterSpacing -0.01em ≈ -0.2 at 20px.
  heading: {
    fontFamily: fonts.serif,
    fontSize: 20,
    lineHeight: 27.5,
    letterSpacing: -0.2,
    marginTop: spacing.xxxl,
  },
  // Standalone 18+ line: font-medium (Inter 500) at body size (17px / 1.625).
  standalone: {
    fontFamily: fonts.sansMedium,
    fontSize: 17,
    lineHeight: 27.6,
    marginTop: spacing.xl,
  },
  // Body paragraphs: text-[17px] leading-relaxed; space-y-3 within a section.
  para: { fontSize: 17, lineHeight: 27.6, marginTop: spacing.md },
  divider: { borderTopWidth: 1, marginTop: spacing.xxxl },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginTop: spacing.xl },
  // Checkbox: beta h-5 w-5 (20px), forest accent.
  box: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkLabel: { flex: 1, fontSize: 17, lineHeight: 27.6 },
  // Helper + links row: text-sm (14px).
  beginHelper: { textAlign: 'center', fontSize: 14, lineHeight: 20 },
  actions: { marginTop: spacing.xl, gap: spacing.sm },
  goBack: { alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  links: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText: { fontSize: 14, lineHeight: 20, textDecorationLine: 'underline' },
  // text-sm (14px) for the links row, Go back, and dots.
  smallLink: { fontSize: 14, lineHeight: 20 },
  dot: { marginHorizontal: spacing.sm },
});
