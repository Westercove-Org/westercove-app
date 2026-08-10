import { useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MessageIcon, PhoneIcon } from '@/components/icons';
import { copy } from '@/constants/copy';
import { Text } from './ui/Text';

/** Amethyst-deep crisis pill (matches the reference), fixed across themes. */
const CRISIS_BG = '#190933';

function smsUrl(number: string, body?: string): string {
  if (!body) return `sms:${number}`;
  const sep = Platform.OS === 'ios' ? '&' : '?';
  return `sms:${number}${sep}body=${encodeURIComponent(body)}`;
}

function open(url: string) {
  Linking.openURL(url).catch(() => {
    /* If the platform can't handle tel:/sms:, fail quietly. */
  });
}

/**
 * The persistent crisis banner — a floating amethyst pill (matching the demo),
 * present on every primary screen and pre-auth. Never dismissible, never gated
 * by subscription. Collapsed shows one line; tapping expands to explicit
 * one-tap Call 988 / Text 988 / Text HOME 741741 actions.
 *
 * `atBottom` (default) applies the bottom safe-area inset — set false when the
 * pill sits above another bottom element (e.g. the tab bar).
 *
 * `compact` is the signed-in form (matching the demo): a slim one-line bar with
 * the two numbers directly tappable, no expand step. Pre-auth screens keep the
 * taller expandable pill, where the explicit action list matters more.
 */
export function CrisisBanner({
  atBottom = true,
  compact = false,
}: {
  atBottom?: boolean;
  compact?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(false);

  if (compact) {
    return (
      <View style={[styles.wrap, { paddingBottom: (atBottom ? insets.bottom : 0) + 4 }]}>
        <View style={[styles.compactBar, { backgroundColor: CRISIS_BG }]}>
          {/* The wrapper is not an accessibility element, so the two numbers stay
              individually reachable rather than being read as one flat string. */}
          <Text color="#FFFFFF" accessible={false} style={styles.compactText}>
            {copy.crisis.bannerLead}{' '}
            <Text
              color="#FFFFFF"
              accessible
              accessibilityRole="link"
              accessibilityLabel={`${copy.crisis.call988}. ${copy.crisis.call988Sub}.`}
              onPress={() => open('tel:988')}
              style={styles.compactAction}
            >
              {copy.crisis.call988}
            </Text>
            {' · '}
            <Text
              color="#FFFFFF"
              accessible
              accessibilityRole="link"
              accessibilityLabel={`${copy.crisis.textHome}. ${copy.crisis.textHomeSub}.`}
              onPress={() => open(smsUrl('741741', 'HOME'))}
              style={styles.compactAction}
            >
              {copy.crisis.textHome}
            </Text>
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { paddingBottom: (atBottom ? insets.bottom : 0) + 8 }]}>
      <View style={[styles.pill, { backgroundColor: CRISIS_BG }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            expanded
              ? 'Crisis resources, collapse'
              : 'In crisis? Crisis resources. Tap to expand call and text options.'
          }
          onPress={() => setExpanded((v) => !v)}
          style={styles.collapsedRow}
        >
          <Text color="#FFFFFF" style={styles.collapsedText}>
            {copy.crisis.bannerLine}
          </Text>
        </Pressable>

        {expanded ? (
          <View style={styles.actions}>
            <CrisisAction
              icon={<PhoneIcon size={20} color="#FFFFFF" />}
              label="Call 988"
              hint="Suicide and Crisis Lifeline"
              onPress={() => open('tel:988')}
            />
            <CrisisAction
              icon={<MessageIcon size={20} color="#FFFFFF" />}
              label="Text 988"
              hint="Suicide and Crisis Lifeline"
              onPress={() => open(smsUrl('988'))}
            />
            <CrisisAction
              icon={<MessageIcon size={20} color="#FFFFFF" />}
              label="Text HOME to 741741"
              hint="Crisis Text Line"
              onPress={() => open(smsUrl('741741', 'HOME'))}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

function CrisisAction({
  icon,
  label,
  hint,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${hint}.`}
      onPress={onPress}
      style={({ pressed }) => [styles.action, pressed && { opacity: 0.75 }]}
    >
      {icon}
      <Text color="#FFFFFF" style={styles.actionLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 4, alignItems: 'center' },
  pill: {
    width: '100%',
    maxWidth: 640,
    borderRadius: 14,
    overflow: 'hidden',
  },
  collapsedRow: {
    minHeight: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapsedText: {
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  compactBar: {
    width: '100%',
    maxWidth: 640,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  compactText: { fontSize: 12, lineHeight: 16, textAlign: 'center' },
  compactAction: { fontSize: 12, lineHeight: 16, fontWeight: '700' },
  actions: { paddingHorizontal: 12, paddingBottom: 8, gap: 2 },
  action: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
  },
  actionLabel: { fontWeight: '600', fontSize: 15 },
});
