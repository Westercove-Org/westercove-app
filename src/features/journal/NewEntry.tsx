import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CrisisBanner } from '@/components/CrisisBanner';
import { DriftingPhoto } from '@/components/DriftingPhoto';
import { ChevronRightIcon, DownloadIcon, MicIcon, SendIcon } from '@/components/icons';
import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { lovedOneName } from '@/features/auth/sessionStore';
import { useSafetyRouter } from '@/features/safety/useSafetyRouter';
import {
  ENTRY_PLACEHOLDERS,
  ENTRY_TYPES,
  isEntryType,
  type EntryType,
} from '@/features/journal/entryTypes';
import { useDraftStore } from '@/features/journal/draftStore';
import { useEntriesStore } from '@/features/journal/entriesStore';
import { useQuestionTimer } from '@/features/questions/useQuestionTimer';
import { useCadenceJournalingTimer } from '@/features/cadence/useCadence';
import { SafetyLevel } from '@/services/safety';
import { services } from '@/services';
import { useTheme } from '@/theme';
import { radii, spacing } from '@/theme/tokens';

const heroImage = require('../../../assets/images/westercove_meadow_white.jpg');

export function NewEntry() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ type?: string }>();
  const addEntry = useEntriesStore((s) => s.addEntry);
  const routeSafety = useSafetyRouter();
  const lovedOne = lovedOneName();

  const initialType: EntryType = isEntryType(params.type) ? params.type : 'Journal';
  const [type, setType] = useState<EntryType>(initialType);
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Autosave draft (R-30). Seed once from the persisted draft after it hydrates
  // (async storage), then write every change through so closing the app never
  // loses words. ponytail: a keystroke typed in the sub-frame before hydration
  // could be replaced by the restored draft — negligible, and the restore is the
  // writer's own earlier words, not data loss.
  const seeded = useRef(false);
  useEffect(() => {
    const apply = () => {
      if (seeded.current) return;
      seeded.current = true;
      const d = useDraftStore.getState();
      if (d.text) {
        setText(d.text);
        setType(d.type);
      }
    };
    if (useDraftStore.persist.hasHydrated()) apply();
    else return useDraftStore.persist.onFinishHydration(apply);
  }, []);

  const onText = (t: string) => {
    setText(t);
    useDraftStore.getState().setDraft({ text: t, type });
  };
  const onType = (t: EntryType) => {
    setType(t);
    useDraftStore.getState().setDraft({ type: t, text });
  };

  // Accumulate talk-time while composing a new entry too.
  useQuestionTimer();
  useCadenceJournalingTimer();

  const onMic = async () => {
    setListening(true);
    try {
      const transcript = await services.voice.capture();
      setText((t) => {
        const next = t ? `${t} ${transcript}` : transcript;
        useDraftStore.getState().setDraft({ text: next, type });
        return next;
      });
    } catch {
      // Mic denied / unavailable / no speech: leave the field for typing rather
      // than inserting anything or throwing an unhandled rejection.
    } finally {
      setListening(false);
    }
  };

  const onSend = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    setSendError(null);
    try {
      const { id, level } = await addEntry({ type, text: text.trim(), justHeard: false });
      useDraftStore.getState().clear(); // entry saved → the draft is spent
      router.replace({ pathname: '/entry/[id]', params: { id } });
      if (level >= SafetyLevel.High) routeSafety({ level });
    } catch {
      // Keep the draft (not cleared, not navigated) so no words are lost, and let
      // them retry. A plan-limit 402 mid-turn is surfaced separately as the
      // upgrade card; this is the graceful path for any other failure.
      setSendError("We couldn't save that just now. Your words are kept — please try again.");
      setBusy(false);
    }
  };

  const canSend = !!text.trim() && !busy;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <DriftingPhoto source={heroImage} />
        <LinearGradient
          colors={['rgba(246,241,231,0.2)', 'rgba(246,241,231,0)', 'rgba(246,241,231,0.94)']}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerTop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            style={styles.back}
          >
            <View style={styles.backChevron}>
              <ChevronRightIcon size={20} color={colors.heading} strokeWidth={2} />
            </View>
            <Text variant="bodySmall" color="heading">
              Back
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Download journal"
            onPress={() => router.push('/export')}
            style={[styles.download, { backgroundColor: colors.emerald }]}
          >
            <DownloadIcon size={16} color={colors.onAccent} />
            <Text variant="tag" color="onAccent" style={styles.downloadText}>
              Download journal
            </Text>
          </Pressable>
        </View>
        <Text variant="screenTitle" style={styles.title} accessibilityRole="header">
          New entry
        </Text>
        {lovedOne ? (
          <Text variant="body" color="heading">
            For {lovedOne}
          </Text>
        ) : null}
        <Text variant="bodySmall" color="textMuted" style={styles.desc}>
          Write as much or as little as you like. You can keep journaling, or tap Home when you
          are ready.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.chips}>
          {ENTRY_TYPES.map((t) => (
            <Chip key={t} label={t} selected={t === type} onPress={() => onType(t)} />
          ))}
        </View>

        <TextInput
          value={text}
          onChangeText={onText}
          placeholder={ENTRY_PLACEHOLDERS[type]}
          placeholderTextColor={colors.textMuted}
          multiline
          accessibilityLabel="Write your entry"
          style={[styles.input, { color: colors.textPrimary, borderColor: colors.line }]}
        />

        {sendError ? (
          <Text variant="bodySmall" color="crisis" accessibilityRole="alert">
            {sendError}
          </Text>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={listening ? 'Listening' : 'Speak your entry'}
            onPress={onMic}
            style={[
              styles.mic,
              { backgroundColor: listening ? colors.emerald : colors.forest },
            ]}
          >
            <MicIcon size={22} color={colors.onAccent} />
          </Pressable>
          <View style={styles.grow} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save entry"
            disabled={!canSend}
            onPress={onSend}
            style={[
              styles.save,
              { backgroundColor: colors.heading },
              !canSend && { opacity: 0.4 },
            ]}
          >
            <SendIcon size={18} color={colors.onAccent} />
            <Text variant="cardTitle" color="onAccent">
              {busy ? 'Saving…' : 'Save'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <CrisisBanner compact />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    overflow: 'hidden',
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 },
  backChevron: { transform: [{ rotate: '180deg' }] },
  download: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  downloadText: { textTransform: 'none' },
  title: { marginBottom: 2 },
  desc: { marginTop: spacing.sm, maxWidth: 340 },
  body: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
    paddingBottom: 96,
    gap: spacing.lg,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  input: {
    minHeight: 240,
    borderWidth: 1,
    borderRadius: radii.card,
    padding: spacing.lg,
    fontSize: 17,
    lineHeight: 25,
    textAlignVertical: 'top',
  },
  actions: { flexDirection: 'row', alignItems: 'center' },
  grow: { flex: 1 },
  mic: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  save: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    minHeight: 48,
    borderRadius: 24,
  },
});
