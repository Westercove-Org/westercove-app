import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { CheckIcon, PlusIcon, TrashIcon } from '@/components/icons';
import { Card } from '@/components/ui/Card';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Text } from '@/components/ui/Text';
import { useSessionStore } from '@/features/auth/sessionStore';
import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/tokens';
import { useProfilesStore } from './profilesStore';

/**
 * Demo "Test Profiles" switcher (Profile). Browser-local personas the demo user
 * can switch between, create, and delete, plus Sign out.
 */
export function TestProfiles() {
  const router = useRouter();
  const { colors } = useTheme();
  const profiles = useProfilesStore((s) => s.profiles);
  const activeId = useProfilesStore((s) => s.activeId);
  const switchTo = useProfilesStore((s) => s.switchTo);
  const createNew = useProfilesStore((s) => s.createNew);
  const remove = useProfilesStore((s) => s.remove);
  const signOut = useSessionStore((s) => s.signOut);

  return (
    <View style={styles.wrap}>
      <SectionLabel>TEST PROFILES</SectionLabel>
      <Card>
        <Text variant="bodySmall" color="textMuted">
          Each profile is a separate saved person. Use these to test different scenarios and
          switch between them anytime. Everything is saved in this browser.
        </Text>

        {profiles.map((p) => {
          const active = p.id === activeId;
          return (
            <View
              key={p.id}
              style={[
                styles.personaRow,
                { borderColor: active ? colors.heading : colors.line },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Switch to ${p.name || 'new test'}`}
                onPress={async () => {
                  await switchTo(p.id);
                  router.replace('/');
                }}
                style={styles.personaMain}
              >
                <View style={[styles.avatar, { backgroundColor: colors.heading }]}>
                  <Text color="onAccent" style={styles.avatarText}>
                    {p.name ? p.name.charAt(0).toUpperCase() : '?'}
                  </Text>
                </View>
                <Text variant="cardTitle">
                  {p.name || 'New test (not set up yet)'}
                </Text>
              </Pressable>
              {active ? (
                <CheckIcon size={20} color={colors.heading} />
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${p.name}`}
                  onPress={() => remove(p.id)}
                  hitSlop={8}
                >
                  <TrashIcon size={20} color={colors.textMuted} />
                </Pressable>
              )}
            </View>
          );
        })}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Start a new test"
          onPress={async () => {
            await createNew();
            router.replace('/');
          }}
          style={[styles.newRow, { borderColor: colors.line }]}
        >
          <PlusIcon size={20} color={colors.textPrimary} />
          <Text variant="cardTitle">Start a new test</Text>
        </Pressable>
      </Card>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        onPress={() => {
          signOut();
          router.replace('/launch');
        }}
        style={[styles.signOut, { borderColor: colors.line, backgroundColor: colors.card }]}
      >
        <Text variant="cardTitle">Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.screen },
  personaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radii.card,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.md,
  },
  personaMain: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700' },
  newRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.card,
    padding: spacing.md,
    marginTop: spacing.md,
    justifyContent: 'center',
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.card,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
});
