import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MessageIcon, PhoneIcon } from '@/components/icons';
import { Text } from '@/components/ui/Text';
import { copy } from '@/constants/copy';
import { callLine, textLine } from '@/lib/crisisLinks';

/** Emerald crisis token, fixed across themes. White-on-emerald is AAA (≈7.5:1). */
const EMERALD = '#0E5F18';

/**
 * Level 4 (Critical Risk): a full-screen crisis interface that interrupts flow,
 * with one-tap Call 988 / Text 988 / Text HOME 741741 at AAA contrast. There is
 * no dismissible X; the only way out is the soft exit, which returns to a
 * low-stimulation surface with the banner still visible (handoff §4.3).
 */
export function CrisisInterface() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const softExit = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <View style={styles.header}>
        <Text variant="display" color="#FFFFFF" accessibilityRole="header">
          {copy.safety.crisisTitle}
        </Text>
        <Text variant="body" color="#FFFFFF" style={styles.body}>
          {copy.safety.crisisBody}
        </Text>
      </View>

      <View style={styles.actions}>
        <CrisisButton
          icon={<PhoneIcon size={22} color={EMERALD} />}
          label="Call 988"
          onPress={() => callLine('988')}
        />
        <CrisisButton
          icon={<MessageIcon size={22} color={EMERALD} />}
          label="Text 988"
          onPress={() => textLine('988')}
        />
        <CrisisButton
          icon={<MessageIcon size={22} color={EMERALD} />}
          label="Text HOME to 741741"
          onPress={() => textLine('741741', 'HOME')}
        />
      </View>

      <Pressable
        testID="crisis-soft-exit"
        accessibilityRole="button"
        accessibilityLabel="Return to a quiet screen"
        onPress={softExit}
        style={styles.softExit}
      >
        <Text variant="body" color="rgba(255,255,255,0.85)">
          {copy.safety.softExit}
        </Text>
      </Pressable>
    </View>
  );
}

function CrisisButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && { opacity: 0.9 }]}
    >
      {icon}
      <Text variant="cardTitle" color={EMERALD} style={styles.buttonLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: EMERALD,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  header: { gap: 12 },
  body: { opacity: 0.95 },
  actions: { gap: 14 },
  button: {
    minHeight: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  // Above the standard type scale on purpose: crisis actions get extra
  // legibility emphasis (design system §9, AAA crisis interface).
  buttonLabel: { fontSize: 17, fontWeight: '700' },
  softExit: { alignItems: 'center', minHeight: 44, justifyContent: 'center' },
});
