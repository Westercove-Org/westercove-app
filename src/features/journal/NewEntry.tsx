import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CrisisBanner } from '@/components/CrisisBanner';
import { ChevronRightIcon, MicIcon, PaperclipIcon, SendIcon } from '@/components/icons';
import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { useSessionStore } from '@/features/auth/sessionStore';
import { useSafetyRouter } from '@/features/safety/useSafetyRouter';
import {
  ENTRY_PLACEHOLDERS,
  ENTRY_TYPES,
  isEntryType,
  type EntryType,
} from '@/features/journal/entryTypes';
import { pickDocument, pickImage } from '@/features/journal/attach';
import type { Attachment } from '@/features/journal/types';
import { useEntriesStore } from '@/features/journal/entriesStore';
import { useQuestionTimer } from '@/features/questions/useQuestionTimer';
import { SafetyLevel } from '@/services/safety';
import { services } from '@/services';
import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/tokens';

type Mode = 'thoughts' | 'heard';

export function NewEntry() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ type?: string }>();
  const addEntry = useEntriesStore((s) => s.addEntry);
  const routeSafety = useSafetyRouter();
  const lovedOne = useSessionStore((s) => s.session?.gateAnswers.lovedOneName);

  const initialType: EntryType = isEntryType(params.type) ? params.type : 'Journal';
  const [type, setType] = useState<EntryType>(initialType);
  const [text, setText] = useState('');
  const [mode, setMode] = useState<Mode>('thoughts');
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const addAttachment = async (pick: () => Promise<Attachment | null>) => {
    const a = await pick();
    if (a) setAttachments((cur) => [...cur, a]);
  };
  const removeAttachment = (uri: string) =>
    setAttachments((cur) => cur.filter((a) => a.uri !== uri));

  // Accumulate talk-time while composing a new entry too.
  useQuestionTimer();

  const onMic = async () => {
    setListening(true);
    // Anything already typed stays; the live transcript streams in after it.
    const base = text.trim();
    const merge = (spoken: string) => (base ? `${base} ${spoken}` : spoken);
    try {
      const transcript = await services.voice.capture((partial) => setText(merge(partial)));
      setText(merge(transcript));
    } finally {
      setListening(false);
    }
  };

  const canSend = !!text.trim() || attachments.length > 0;

  const onSend = async () => {
    if (!canSend || busy) return;
    setBusy(true);
    const { id, level } = await addEntry({
      type,
      text: text.trim(),
      justHeard: mode === 'heard',
      attachments,
    });
    // Land on the entry, then surface the safety interface on top for L3/L4.
    router.replace({ pathname: '/entry/[id]', params: { id } });
    if (level >= SafetyLevel.High) routeSafety({ level });
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
          <ChevronRightIcon size={24} color={colors.textPrimary} strokeWidth={2} />
        </Pressable>
        <View>
          <Text variant="screenTitle">New entry</Text>
          {lovedOne ? (
            <Text variant="meta" color="textMuted">
              For {lovedOne}
            </Text>
          ) : null}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.typeScroll}
        contentContainerStyle={styles.typeRow}
      >
        {ENTRY_TYPES.map((t) => (
          <Chip key={t} label={t} selected={t === type} onPress={() => setType(t)} />
        ))}
      </ScrollView>

      <View style={styles.modeRow}>
        <Text variant="bodySmall" color="textMuted" style={styles.modePrompt}>
          Would you like thoughts back, or does this just need to be heard?
        </Text>
        <View style={styles.modeChips}>
          <Chip
            label="Thoughts back"
            selected={mode === 'thoughts'}
            onPress={() => setMode('thoughts')}
          />
          <Chip
            label="Just heard"
            selected={mode === 'heard'}
            onPress={() => setMode('heard')}
          />
        </View>
      </View>

      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={ENTRY_PLACEHOLDERS[type]}
        placeholderTextColor={colors.textMuted}
        multiline
        accessibilityLabel="Write your entry"
        style={[styles.input, { color: colors.textPrimary }]}
      />

      {attachments.length ? (
        <View style={styles.attachRow}>
          {attachments.map((a) => (
            <Pressable
              key={a.uri}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${a.name ?? a.kind}`}
              onPress={() => removeAttachment(a.uri)}
              style={[styles.attachItem, { borderColor: colors.line }]}
            >
              {a.kind === 'image' ? (
                <Image source={{ uri: a.uri }} style={styles.attachThumb} contentFit="cover" />
              ) : (
                <View style={styles.attachDoc}>
                  <PaperclipIcon size={18} color={colors.forest} />
                  <Text variant="meta" color="textMuted" numberOfLines={1} style={styles.attachName}>
                    {a.name ?? 'Document'}
                  </Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={[styles.actions, { paddingBottom: spacing.md }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={listening ? 'Listening' : 'Speak your entry'}
          onPress={onMic}
          style={[
            styles.mic,
            { backgroundColor: listening ? colors.emerald : colors.surfaceAlt },
          ]}
        >
          <MicIcon size={22} color={listening ? colors.onAccent : colors.forest} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Attach a photo"
          onPress={() => void addAttachment(pickImage)}
          style={[styles.mic, { backgroundColor: colors.surfaceAlt }]}
        >
          <PaperclipIcon size={22} color={colors.forest} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Attach a document"
          onPress={() => void addAttachment(pickDocument)}
          style={styles.docLink}
        >
          <Text variant="bodySmall" color="forest">
            Document
          </Text>
        </Pressable>
        {listening ? (
          <Text variant="bodySmall" color="forest">
            Listening…
          </Text>
        ) : null}
        <View style={{ flex: 1 }} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save entry"
          disabled={!canSend || busy}
          onPress={onSend}
          style={[
            styles.send,
            { backgroundColor: colors.emerald },
            (!canSend || busy) && { opacity: 0.4 },
          ]}
        >
          <SendIcon size={22} color={colors.onAccent} />
        </Pressable>
      </View>

      <CrisisBanner />
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
  back: { transform: [{ rotate: '180deg' }], minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  typeScroll: { flexGrow: 0 },
  typeRow: {
    paddingHorizontal: spacing.screen,
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: 'flex-start',
  },
  modeRow: { paddingHorizontal: spacing.screen, paddingTop: spacing.sm, gap: spacing.sm },
  modePrompt: {},
  modeChips: { flexDirection: 'row', gap: spacing.sm },
  input: {
    flex: 1,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
  },
  mic: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  send: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  docLink: { minHeight: 44, paddingHorizontal: spacing.sm, justifyContent: 'center' },
  attachRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
  },
  attachItem: {
    borderWidth: 1,
    borderRadius: radii.avatar,
    overflow: 'hidden',
  },
  attachThumb: { width: 56, height: 56 },
  attachDoc: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    height: 56,
    maxWidth: 160,
  },
  attachName: { flexShrink: 1 },
});
