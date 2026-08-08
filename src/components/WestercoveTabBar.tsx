import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CompassIcon,
  HeartIcon,
  HomeIcon,
  JournalIcon,
  LeafIcon,
  type IconProps,
} from '@/components/icons';
import { useTheme } from '@/theme';
import { CrisisBanner } from './CrisisBanner';
import { Text } from './ui/Text';

/**
 * Minimal structural type for the subset of the expo-router tab-bar props we
 * use — decoupled from expo-router internals. The real `BottomTabBarProps` is
 * structurally assignable to this.
 */
export interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: {
    emit(event: {
      type: 'tabPress';
      target: string;
      canPreventDefault: true;
    }): { defaultPrevented: boolean };
    navigate(name: string): void;
  };
}

type TabConfig = { label: string; Icon: (p: IconProps) => React.ReactNode };

/** Route-name → nav label + icon. No human-figure icons (brand rule). */
const TABS: Record<string, TabConfig> = {
  index: { label: 'Home', Icon: HomeIcon },
  journal: { label: 'Journal', Icon: JournalIcon },
  discover: { label: 'Discover', Icon: CompassIcon },
  profile: { label: 'Profile', Icon: LeafIcon },
  support: { label: 'Support', Icon: HeartIcon },
};

/**
 * The five-tab bottom bar with the persistent crisis banner directly beneath
 * it. Active tab uses forest with a bold label; inactive tabs use text-muted.
 * Each tab is a ≥44pt target exposing a screen-reader label and selected
 * state. No numeric badges anywhere (handoff §4.1).
 */
export function WestercoveTabBar({ state, navigation }: TabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View>
      {/* The crisis pill floats directly above the tab bar (demo layout). */}
      <CrisisBanner atBottom={false} />
      <View
        style={[
          styles.bar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.line,
            paddingBottom: insets.bottom + 8,
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const config = TABS[route.name];
          if (!config) return null;
          const focused = state.index === index;
          const tint = focused ? colors.forest : colors.textMuted;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={config.label}
              onPress={onPress}
              style={styles.tab}
            >
              <config.Icon size={24} color={tint} strokeWidth={2} />
              <Text
                variant="meta"
                color={tint}
                style={[styles.label, focused && styles.labelActive]}
              >
                {config.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: 8,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: { fontSize: 11 },
  labelActive: { fontWeight: '700' },
});
