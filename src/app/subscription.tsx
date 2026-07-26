import { StackScreen } from '@/components/StackScreen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { useSessionStore } from '@/features/auth/sessionStore';
import { services } from '@/services';

const LABELS: Record<string, string> = {
  trial_active: 'Free trial',
  active_monthly: 'Active — monthly',
  active_annual: 'Active — annual',
  license_active: 'Sponsored license',
  lapsed: 'Lapsed',
};

/** Subscription. Plain trial-end statement (date + price), no countdown, no
 * discount pressure, no guilt. Crisis resources work in every state. */
export default function SubscriptionScreen() {
  const entitlement = useSessionStore((s) => s.session?.entitlement ?? 'trial_active');
  const setEntitlement = useSessionStore((s) => s.setEntitlement);
  const status = services.subscription.getStatus(entitlement);

  return (
    <StackScreen title="Subscription">
      <Card>
        <Text variant="meta" color="textMuted">
          Current plan
        </Text>
        <Text variant="cardTitle" style={{ marginTop: 4 }}>
          {LABELS[entitlement] ?? entitlement}
        </Text>
        {status.trialEndsOn ? (
          <Text variant="body" color="textMuted" style={{ marginTop: 8 }}>
            Your trial ends on {status.trialEndsOn}. When it does, it is{' '}
            {status.price}. Nothing is charged without your say.
          </Text>
        ) : (
          <Text variant="body" color="textMuted" style={{ marginTop: 8 }}>
            {status.price}. You can change or step away anytime.
          </Text>
        )}
      </Card>

      <Button
        label="Restore purchases"
        variant="secondary"
        onPress={async () => setEntitlement(await services.subscription.restore())}
      />
    </StackScreen>
  );
}
