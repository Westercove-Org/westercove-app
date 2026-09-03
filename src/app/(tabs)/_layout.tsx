import { Tabs } from 'expo-router';

import { WestercoveTabBar } from '@/components/WestercoveTabBar';
import { useCadenceSession } from '@/features/cadence/useCadence';
import { useLegalGate } from '@/features/legal/useLegalGate';
import { useTheme } from '@/theme';

/**
 * The five-tab shell: Home, Journal, Discover, Profile, Support — with the
 * persistent crisis banner rendered directly beneath the tab bar (in the
 * custom tab bar). Support activates the fifth tab position (handoff §2).
 */
export default function TabsLayout() {
  const { colors } = useTheme();
  // Reconcile 4-Doors cadence state + report the session open on entering the
  // shell. No-op unless USE_FOUR_DOORS is on with a backend profile.
  useCadenceSession();
  // Present the legal disclaimer once per session if the server says the
  // current version still needs acknowledgement (R-36). Non-blocking.
  useLegalGate();
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
