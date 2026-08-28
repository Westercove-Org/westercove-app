import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import type { SafetyResources } from '@/services/chat';
import { useSafetyStore } from './safetyStore';

function open(href: string) {
  Linking.openURL(href).catch(() => {
    /* If the platform can't handle the scheme (tel:/sms:/https:), fail quietly. */
  });
}

/**
 * Renders the backend-built crisis-resource card (headline, disclaimer, and the
 * list of professional resources) so a user at an elevated/high/critical tier
 * sees the actual resources the server assessed for them — not only static copy.
 *
 * Reads the current crisis context from the safety store by default; pass
 * `resources` to render a specific card (e.g. in tests). Renders nothing when
 * there are no resources, so callers can drop it in unconditionally.
 */
export function ServerResources({
  resources,
  padded = true,
}: {
  resources?: SafetyResources;
  /** Adds the screen horizontal padding (for hosts whose container doesn't
   * already pad, e.g. the entry ScrollView). Off for the crisis routes, which
   * pad their own container. */
  padded?: boolean;
}) {
  const { colors } = useTheme();
  const stored = useSafetyStore((s) => s.resources);
  const data = resources ?? stored;
  if (!data || data.items.length === 0) return null;

  return (
    <View style={padded ? styles.wrap : styles.wrapFlush}>
      <Card reflective>
        {data.headline ? (
          <Text variant="cardTitle" color="amethystText">
            {data.headline}
          </Text>
        ) : null}
        {data.disclaimer ? (
          <Text variant="bodySmall" color="textMuted" style={styles.disclaimer}>
            {data.disclaimer}
          </Text>
        ) : null}
        <View style={styles.items}>
          {data.items.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="link"
              accessibilityLabel={item.description ? `${item.label}. ${item.description}` : item.label}
              onPress={() => open(item.href)}
              style={styles.item}
            >
              <Text variant="bodySmall" color={colors.emerald} style={styles.itemLabel}>
                {item.label}
              </Text>
              {item.description ? (
                <Text variant="bodySmall" color="textMuted">
                  {item.description}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.screen, paddingTop: spacing.cardGap },
  wrapFlush: { paddingTop: spacing.cardGap },
  disclaimer: { marginTop: spacing.xs },
  items: { marginTop: spacing.md, gap: spacing.md },
  item: { minHeight: 44, gap: spacing.xs },
  itemLabel: { fontWeight: '600' },
});
