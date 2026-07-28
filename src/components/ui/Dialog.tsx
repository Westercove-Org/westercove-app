import { Modal, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';
import { Button } from './Button';
import { Card } from './Card';
import { Text } from './Text';

export interface DialogProps {
  visible: boolean;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * A centered, dimmed modal with a message and two choices. Built from RN Modal
 * plus the shared Card/Button/Text primitives and theme tokens.
 */
export function Dialog({
  visible,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: DialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Card style={styles.card}>
          <Text variant="cardTitle" accessibilityRole="header">
            {message}
          </Text>
          <View style={styles.actions}>
            <Button label={confirmLabel} onPress={onConfirm} />
            <Button label={cancelLabel} variant="secondary" onPress={onCancel} />
          </View>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20,30,18,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screen,
  },
  card: { width: '100%', maxWidth: 400, gap: spacing.lg },
  actions: { gap: spacing.sm },
});
