import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CrisisBanner } from '@/components/CrisisBanner';
import { ChevronRightIcon } from '@/components/icons';
import { Card } from '@/components/ui/Card';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Text } from '@/components/ui/Text';
import { useWhatIKnowStore, type LearnedItem } from '@/features/profile/whatIKnowStore';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

/**
 * The What I Know transparency page: everything the companion has learned, each
 * item editable and deletable, plus a quiet list of questions not yet answered.
 * No progress bar, ever (handoff §6.4).
 */
export function WhatIKnow() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const learned = useWhatIKnowStore((s) => s.learned);
  const unanswered = useWhatIKnowStore((s) => s.unanswered);
  const hydrate = useWhatIKnowStore((s) => s.hydrateFromSession);

  useEffect(() => {
    if (learned.length === 0) hydrate();
  }, [learned.length, hydrate]);

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
        <Text variant="screenTitle">What I Know</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <Text variant="body" color="textMuted" style={styles.intro}>
          Everything I have learned, from our conversations and from you. Edit or
          remove anything, anytime.
        </Text>

        <SectionLabel>LEARNED</SectionLabel>
        <View style={styles.list}>
          {learned.map((item) => (
            <LearnedRow key={item.id} item={item} />
          ))}
        </View>

        <SectionLabel>QUESTIONS NOT YET ANSWERED</SectionLabel>
        <View style={styles.list}>
          {unanswered.map((q) => (
            <Card key={q.id}>
              <Text variant="body" color="textMuted">
                {q.prompt}
              </Text>
            </Card>
          ))}
        </View>
      </ScrollView>
      <CrisisBanner compact />
    </View>
  );
}

function LearnedRow({ item }: { item: LearnedItem }) {
  const { colors } = useTheme();
  const update = useWhatIKnowStore((s) => s.updateItem);
  const remove = useWhatIKnowStore((s) => s.deleteItem);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.value);

  return (
    <Card>
      <Text variant="meta" color="textMuted">
        {item.label}
      </Text>
      {editing ? (
        <TextInput
          value={draft}
          onChangeText={setDraft}
          accessibilityLabel={`Edit ${item.label}`}
          style={[styles.input, { borderColor: colors.line, color: colors.textPrimary }]}
        />
      ) : (
        <Text variant="body" style={styles.value}>
          {item.value}
        </Text>
      )}
      <View style={styles.rowActions}>
        {editing ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Save ${item.label}`}
            onPress={() => {
              update(item.id, draft.trim() || item.value);
              setEditing(false);
            }}
          >
            <Text variant="bodySmall" color="forest">
              Save
            </Text>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Edit ${item.label}`}
            onPress={() => setEditing(true)}
          >
            <Text variant="bodySmall" color="forest">
              Edit
            </Text>
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${item.label}`}
          onPress={() => remove(item.id)}
        >
          <Text variant="bodySmall" color={colors.textMuted}>
            Remove
          </Text>
        </Pressable>
      </View>
    </Card>
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
  intro: { paddingHorizontal: spacing.screen, paddingTop: spacing.sm },
  list: { paddingHorizontal: spacing.screen, gap: spacing.cardGap },
  value: { marginTop: 2 },
  input: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    minHeight: 44,
    fontSize: 15,
  },
  rowActions: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
});
