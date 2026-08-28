import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { HeroHeader } from '@/components/HeroHeader';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { copy } from '@/constants/copy';
import { ResendEmailButton } from '@/features/auth/ResendEmailButton';
import { services } from '@/services';
import { HttpError } from '@/lib/http';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

const heroImage = require('../../../../assets/images/westercove_hero_valley.jpg');

type View_ = 'verifying' | 'verified' | 'expired' | 'error';

/**
 * Org-code-path onboarding landing (/verify-email/:token). The user already set
 * a password at signup, so this only flips email_verified: POST
 * /auth/onboarding/verify-email fires on load. Single-use token from the URL
 * path. In (auth) so the guard keeps it reachable while unauthenticated.
 */
export default function VerifyEmailTokenScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const c = copy.onboarding;
  const { token } = useLocalSearchParams<{ token: string }>();

  const [view, setView] = useState<View_>(token ? 'verifying' : 'error');

  useEffect(() => {
    if (!token) return;
    let active = true;
    (async () => {
      try {
        await services.signup.verifyEmailToken(token);
        if (active) setView('verified');
      } catch (e) {
        if (!active) return;
        setView(e instanceof HttpError && e.status === 410 ? 'expired' : 'error');
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  if (view === 'verifying') {
    return (
      <Shell colors={colors} title={c.verifyingTitle}>
        <Text variant="body" color="textMuted" accessibilityRole="alert">
          {c.verifyingBody}
        </Text>
      </Shell>
    );
  }

  const terminal =
    view === 'verified'
      ? { title: c.verifiedTitle, body: c.verifiedBody, label: c.goToSignIn, to: '/sign-in' as const }
      : view === 'expired'
        ? { title: c.expiredTitle, body: c.expiredBody, label: c.backToSignUp, to: '/sign-up' as const }
        : { title: c.errorTitle, body: c.errorBody, label: c.backToSignUp, to: '/sign-up' as const };

  return (
    <Shell colors={colors} title={terminal.title}>
      <Text variant="body" color="textMuted">
        {terminal.body}
      </Text>
      {view === 'expired' || view === 'error' ? <ResendEmailButton /> : null}
      <Button label={terminal.label} variant="amethyst" onPress={() => router.replace(terminal.to)} />
    </Shell>
  );
}

function Shell({
  colors,
  title,
  children,
}: {
  colors: { background: string };
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <HeroHeader variant="compact" title={title} image={heroImage} />
      <ScrollView contentContainerStyle={styles.form}>{children}</ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.xl,
    paddingBottom: 88,
    gap: spacing.lg,
  },
});
