import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CrisisBanner } from '@/components/CrisisBanner';
import { ChevronRightIcon, SearchIcon } from '@/components/icons';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Text } from '@/components/ui/Text';
import { search, type SearchResult, type SearchScope } from '@/features/search/searchIndex';
import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/tokens';

const PLACEHOLDER: Record<SearchScope, string> = {
  global: 'Search your entries, books, memories',
  discover: 'Search books, training, community',
  support: 'Search support and reading',
};

export function SearchScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { scope: scopeParam } = useLocalSearchParams<{ scope?: string }>();
  const scope: SearchScope =
    scopeParam === 'discover' || scopeParam === 'support' ? scopeParam : 'global';

  const [query, setQuery] = useState('');
  const results = useMemo(() => search(query, scope), [query, scope]);

  const open = (r: SearchResult) => {
    if (r.kind === 'entry') router.push({ pathname: '/entry/[id]', params: { id: r.id } });
    else if (r.kind === 'org') router.push({ pathname: '/support/org/[loss]', params: { loss: r.id } });
  };

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
        <View style={[styles.pill, { backgroundColor: colors.surfaceAlt }]}>
          <SearchIcon size={20} color={colors.textMuted} />
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder={PLACEHOLDER[scope]}
            placeholderTextColor={colors.textMuted}
            accessibilityLabel={PLACEHOLDER[scope]}
            style={[styles.input, { color: colors.textPrimary }]}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {query.trim() === '' ? null : results.length === 0 ? (
          <EmptyState message="Nothing matches yet." />
        ) : (
          results.map((r) => (
            <Pressable
              key={`${r.kind}-${r.id}`}
              accessibilityRole="button"
              accessibilityLabel={r.subtitle ? `${r.title}, ${r.subtitle}` : r.title}
              onPress={() => open(r)}
            >
              <Card>
                <Text variant="cardTitle">{r.title}</Text>
                {r.subtitle ? (
                  <Text variant="bodySmall" color="textMuted" style={styles.sub}>
                    {r.subtitle}
                  </Text>
                ) : null}
              </Card>
            </Pressable>
          ))
        )}
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
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.inputPill,
    paddingHorizontal: spacing.lg,
    minHeight: 44,
  },
  input: { flex: 1, fontSize: 15, minHeight: 44 },
  list: { paddingHorizontal: spacing.screen, paddingTop: spacing.sm, gap: spacing.cardGap },
  sub: { marginTop: 2 },
});
