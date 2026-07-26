import { ScrollView, View, type ScrollViewProps } from 'react-native';

import { useTheme } from '@/theme';
import { MAX_CONTENT_WIDTH } from '@/theme/tokens';
import { HeroHeader, type HeroHeaderProps } from './HeroHeader';

export interface ScreenProps extends Pick<ScrollViewProps, 'contentContainerStyle'> {
  header: HeroHeaderProps;
  children: React.ReactNode;
}

/**
 * Standard tab screen: the landscape hero at the top, then a themed scroll
 * body. Content is width-capped and centered so it doesn't stretch
 * edge-to-edge on large screens / web.
 */
export function Screen({ header, children, contentContainerStyle }: ScreenProps) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[{ paddingBottom: 32 }, contentContainerStyle]}
      >
        <View style={{ width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' }}>
          <HeroHeader {...header} />
          {children}
        </View>
      </ScrollView>
    </View>
  );
}
