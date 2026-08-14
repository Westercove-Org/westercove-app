import { Tabs } from 'expo-router';

import { WestercoveTabBar } from '@/components/WestercoveTabBar';
import { useTheme } from '@/theme';

/**
 * The five-tab shell: Home, Journal, Discover, Profile, Support — with the
 * persistent crisis banner rendered directly beneath the tab bar (in the
 * custom tab bar). Support activates the fifth tab position (handoff §2).
 */
export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      tabBar={(props) => <WestercoveTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        // Tabs cross-fade rather than snap, matching the screen transitions.
        animation: 'fade',
        transitionSpec: { animation: 'timing', config: { duration: 350 } },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="journal" options={{ title: 'Journal' }} />
      <Tabs.Screen name="discover" options={{ title: 'Discover' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="support" options={{ title: 'Support' }} />
    </Tabs>
  );
}
