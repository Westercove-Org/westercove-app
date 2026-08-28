import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CrisisBanner } from '@/components/CrisisBanner';
import { ChevronRightIcon } from '@/components/icons';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { services, type Organization } from '@/services';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

/** Organizations for a loss type. Reached at `/support/org/:loss`. */
export function OrgDetail() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { loss } = useLocalSearchParams<{ loss: string }>();
  const [orgs, setOrgs] = useState<Organization[] | null>(null);

  useEffect(() => {
    let active = true;
    services.content.organizationsFor(loss ?? '').then((o) => {
      if (active) setOrgs(o);
    });
    return () => {
      active = false;
    };
  }, [loss]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={styles.back}
        >
          <ChevronRightIcon size={24} color={colors.textPrimary} />
        </Pressable>
        <Text variant="screenTitle">{loss} loss</Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {orgs === null
          ? [0, 1].map((i) => (
              <Card key={i}>
                <Skeleton width="60%" height={16} />
                <View style={{ height: 8 }} />
                <Skeleton width="90%" height={12} />
              </Card>
            ))
          : orgs.map((org) => (
              <Pressable
                key={org.id}
                accessibilityRole="link"
                accessibilityLabel={`${org.name}. ${org.description} Opens in your browser.`}
                onPress={() => Linking.openURL(org.url)}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Card>
                  <View style={styles.row}>
                    <View style={styles.orgText}>
                      <Text variant="cardTitle">{org.name}</Text>
                      <Text variant="bodySmall" color="textMuted" style={styles.desc}>
                        {org.description}
                      </Text>
                    </View>
                    <ChevronRightIcon size={20} color={colors.textMuted} />
                  </View>
                </Card>
              </Pressable>
            ))}
      </ScrollView>
      <CrisisBanner compact />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  back: {
    transform: [{ rotate: '180deg' }],
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { paddingHorizontal: spacing.screen, paddingTop: spacing.sm, gap: spacing.cardGap },
  desc: { marginTop: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  orgText: { flex: 1 },
  pressed: { opacity: 0.6 },
});
