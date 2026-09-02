import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { StackScreen } from '@/components/StackScreen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';
import { useProfilesStore } from '@/features/profile/profilesStore';
import { spacing } from '@/theme/tokens';

/**
 * Loved-one profiles (sv7-premium-second-profile): list the profiles on the
 * account, switch between them, and add another. Switching re-points every
 * per-profile store; adding runs the same intake the onboarding gate uses.
 * No rename/delete/merge, no avatars — create, switch, gate.
 */
export default function LovedOnesScreen() {
  const router = useRouter();
  const profiles = useProfilesStore((s) => s.profiles);
  const activeId = useProfilesStore((s) => s.activeId);
  const switchProfile = useProfilesStore((s) => s.switchProfile);

  return (
    <StackScreen title="Loved-one profiles">
      <Card padded={false}>
        {profiles.map((p, i) => (
          <ListRow
            key={p.id}
            label={p.name || `Profile ${i + 1}`}
            subtitle={p.id === activeId ? 'Active' : undefined}
            divider={i < profiles.length - 1}
            onPress={() => {
              if (p.id !== activeId) {
                switchProfile(p.id);
                router.replace('/');
              }
            }}
          />
        ))}
      </Card>

      <View style={styles.add}>
        <Button label="Add a loved one" onPress={() => router.push('/profile/add-loved-one')} />
      </View>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  add: { marginTop: spacing.lg },
});
