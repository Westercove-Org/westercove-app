import { useState } from 'react';

import { StackScreen } from '@/components/StackScreen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { useSessionStore } from '@/features/auth/sessionStore';
import { services } from '@/services';

/** Account. Deletion is full, with a 30-day reversible grace period and no dark
 * patterns in the flow. */
export default function AccountScreen() {
  const email = useSessionStore((s) => s.session?.user.email);
  const [deletesOn, setDeletesOn] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const onDelete = async () => {
    const { deletesOn } = await services.subscription.scheduleDeletion();
    setDeletesOn(deletesOn);
    setConfirming(false);
  };

  return (
    <StackScreen title="Account">
      <Card>
        <Text variant="meta" color="textMuted">
          Signed in as
        </Text>
        <Text variant="cardTitle" style={{ marginTop: 4 }}>
          {email ?? 'you@westercove.app'}
        </Text>
      </Card>

      {deletesOn ? (
        <Card>
          <Text variant="body">
            Your account is scheduled for deletion on {deletesOn}. You can undo
            this anytime before then.
          </Text>
          <Button
            label="Keep my account"
            variant="secondary"
            onPress={async () => {
              await services.subscription.cancelDeletion();
              setDeletesOn(null);
            }}
          />
        </Card>
      ) : confirming ? (
        <Card>
          <Text variant="body" color="textMuted">
            Deletion removes your account and everything in it after a 30-day
            grace period. You can undo it anytime within those 30 days.
          </Text>
          <Button label="Delete my account" onPress={onDelete} />
          <Button label="Never mind" variant="secondary" onPress={() => setConfirming(false)} />
        </Card>
      ) : (
        <Button label="Delete account" variant="secondary" onPress={() => setConfirming(true)} />
      )}
    </StackScreen>
  );
}
