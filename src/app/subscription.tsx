import { useEffect, useState } from 'react';
import { Linking, Platform, StyleSheet, TextInput } from 'react-native';

import { StackScreen } from '@/components/StackScreen';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { copy } from '@/constants/copy';
import { useSessionStore } from '@/features/auth/sessionStore';
import { isSponsoredAccount } from '@/features/auth/sponsored';
import { canManageBilling } from '@/features/billing/canManageBilling';
import { HttpError } from '@/lib/http';
import { services, type SubscriptionStatus } from '@/services';
import { useTheme } from '@/theme';
import { spacing } from '@/theme/tokens';

const LABELS: Record<string, string> = {
  trial_active: 'Free trial',
  active_monthly: 'Active — monthly',
  active_annual: 'Active — annual',
  paid_active: 'Active',
  grace: 'Payment overdue',
  license_active: 'Sponsored license',
  lapsed: 'Lapsed',
};

/** Subscription. Plain trial-end statement (date + price), no countdown, no
 * discount pressure, no guilt. Crisis resources work in every state. */
export default function SubscriptionScreen() {
  const { colors } = useTheme();
  const sessionEntitlement = useSessionStore((s) => s.session?.entitlement ?? 'trial_active');
  const entryPath = useSessionStore((s) => s.session?.entryPath);
  const sponsorOrganization = useSessionStore((s) => s.session?.sponsorOrganization);
  const setEntitlement = useSessionStore((s) => s.setEntitlement);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);

  // Load the authoritative status from the backend; keep the session entitlement
  // in sync so the rest of the app reflects it.
  useEffect(() => {
    let live = true;
    services.subscription
      .getStatus()
      .then((s) => {
        if (!live) return;
        setStatus(s);
        setEntitlement(s.entitlement);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [setEntitlement]);

  const entitlement = status?.entitlement ?? sessionEntitlement;

  // Sponsored/partner accounts must NEVER see a price, plan, card, or cancel
  // (spec R-60, a must-never-happen test). Sponsorship is structural, so key
  // off the entry path + license entitlement, not a transient billing state.
  const sponsored = isSponsoredAccount(entitlement, entryPath);

  // Who sees "Manage billing" (incl. grace/lapsed and pre-#124 members with no
  // stripeStatus) — see canManageBilling.
  const showManageBilling = canManageBilling(entitlement, !!status?.stripeStatus);

  const [code, setCode] = useState('');
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [portalBusy, setPortalBusy] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  // Open the Stripe hosted customer portal. No card UI in-app — the portal owns
  // update-card / cancel / invoices. On failure (no portal configured — it's
  // TEST-mode only for now — or unreachable) say so plainly; never leave a
  // half-working screen.
  const onManageBilling = async () => {
    if (portalBusy) return;
    setPortalBusy(true);
    setPortalError(null);
    try {
      const { url } = await services.subscription.createPortalSession();
      if (Platform.OS === 'web') {
        window.location.assign(url);
      } else {
        await Linking.openURL(url);
        setPortalBusy(false);
      }
    } catch {
      setPortalError(
        'Managing billing isn’t available right now. Please try again in a moment.',
      );
      setPortalBusy(false);
    }
  };

  const onRestore = async () => {
    setRestoreError(null);
    try {
      setEntitlement(await services.subscription.restore());
    } catch {
      setRestoreError("We couldn't restore your purchases just now. Try again in a moment.");
    }
  };

  const onRedeem = async () => {
    const trimmed = code.trim();
    if (!trimmed || redeeming) return;
    setRedeeming(true);
    setRedeemError(null);
    try {
      const { entitlement: granted, sponsorOrganization } =
        await services.subscription.redeemLicense(trimmed);
      setEntitlement(granted, sponsorOrganization);
      setCode('');
    } catch (err) {
      // 400 = invalid code (inline, gentle); anything else = a transient problem.
      setRedeemError(
        err instanceof HttpError && err.status === 400
          ? "That code doesn't look right. Check it and try again."
          : "We couldn't reach the license service. Try again in a moment.",
      );
    } finally {
      setRedeeming(false);
    }
  };

  if (sponsored) {
    return (
      <StackScreen title="Membership">
        <Card>
          <Text variant="meta" color="textMuted">
            Your membership
          </Text>
          <Text variant="cardTitle" style={{ marginTop: 4 }}>
            {status?.sponsor?.orgName ?? sponsorOrganization
              ? `Sponsored by ${status?.sponsor?.orgName ?? sponsorOrganization}`
              : 'Sponsored membership'}
          </Text>
          <Text variant="body" color="textMuted" style={{ marginTop: 8 }}>
            {status?.sponsor?.coverageEndsAt
              ? `Your access is covered through ${status.sponsor.coverageEndsAt}.`
              : 'Your access is covered by your organization.'}{' '}
            Everything you write stays yours.
          </Text>
        </Card>
      </StackScreen>
    );
  }

  return (
    <StackScreen title="Membership">
      <Card>
        <Text variant="meta" color="textMuted">
          Current plan
        </Text>
        <Text variant="cardTitle" style={{ marginTop: 4 }}>
          {LABELS[entitlement] ?? entitlement}
        </Text>
        {status?.tier ? (
          <Text variant="body" color="textMuted" style={{ marginTop: 2 }}>
            {status.tier === 'premium' ? 'Premium plan' : 'Standard plan'}
          </Text>
        ) : null}
        {/* R-4: Wesley's annual-saving framing, wherever the annual plan is
            presented. Same approved string as the plan selector — value stated,
            never a discount/countdown/urgency device. */}
        {entitlement === 'active_annual' ? (
          <Text variant="bodySmall" color="forest" style={{ marginTop: 2 }}>
            {copy.signUp.annualCaption}
          </Text>
        ) : null}
        {status?.trialDaysRemaining != null ? (
          <Text variant="body" color="textMuted" style={{ marginTop: 8 }}>
            You have {status.trialDaysRemaining}{' '}
            {status.trialDaysRemaining === 1 ? 'day' : 'days'} left in your free trial
            {status.stripeTrialEndsOn ? `, until ${status.stripeTrialEndsOn}` : ''}. When it
            ends{status.price ? ` it becomes ${status.price}` : ''}. Nothing is charged before then.
          </Text>
        ) : status?.trialEndsOn ? (
          <Text variant="body" color="textMuted" style={{ marginTop: 8 }}>
            Your trial ends on {status.trialEndsOn}. When it does, it is{' '}
            {status.price}. Nothing is charged without your say.
          </Text>
        ) : status ? (
          <Text variant="body" color="textMuted" style={{ marginTop: 8 }}>
            {status.price}. You can change or step away anytime.
          </Text>
        ) : null}
        {/* Stripe subscription status + what happens next: cancel-pending keeps
            access to the period end; past-due prompts a card fix; active shows the
            next renewal. Trialing is covered by the trial lines above. */}
        {status?.stripeStatus && status.stripeStatus !== 'trialing' ? (
          <Text variant="body" color="textMuted" style={{ marginTop: 8 }}>
            {status.cancelAtPeriodEnd
              ? `Your subscription is set to cancel${
                  status.renewsOn ? `, and you keep access until ${status.renewsOn}` : ''
                }.`
              : status.stripeStatus === 'past_due' || status.stripeStatus === 'unpaid'
                ? 'Your last payment didn’t go through. Update your payment method below to keep your access.'
                : status.stripeStatus === 'canceled'
                  ? `Your subscription is canceled${
                      status.renewsOn ? `, and access ends ${status.renewsOn}` : ''
                    }.`
                  : status.renewsOn
                    ? `Renews on ${status.renewsOn}.`
                    : ''}
          </Text>
        ) : null}
        {entitlement === 'lapsed' ? (
          <Text variant="body" color="textMuted" style={{ marginTop: 8 }}>
            Your access has paused. Restore your subscription below to bring back
            the paid features — everything you have written is still here.
          </Text>
        ) : null}
      </Card>

      {/* Paying users manage their own billing: update-card, cancel, and invoices
          all happen on Stripe's HOSTED portal — card data never touches the app.
          Shown to any paying user (incl. pre-#124 with no stored customer id, who
          get the graceful portal-unavailable path); hidden for org-code / license
          users, who have nothing to manage here. */}
      {showManageBilling ? (
        <Card>
          <Text variant="meta" color="textMuted">
            Billing
          </Text>
          <Text variant="body" color="textMuted" style={{ marginTop: 4 }}>
            Update your payment method, see your invoices, or cancel your
            subscription. Cancelling keeps your access until the end of the period
            you have paid for.
          </Text>
          {status?.cardLast4 ? (
            <Text variant="body" color="textMuted" style={{ marginTop: spacing.xs }}>
              The card on file ends in {status.cardLast4}.
            </Text>
          ) : null}
          {portalError ? (
            <Text variant="bodySmall" color="crisis" style={{ marginTop: spacing.xs }}>
              {portalError}
            </Text>
          ) : null}
          <Button
            label={portalBusy ? 'Opening…' : 'Manage billing'}
            variant="secondary"
            disabled={portalBusy}
            onPress={onManageBilling}
          />
        </Card>
      ) : null}

      <Button label="Restore purchases" variant="secondary" onPress={onRestore} />
      {restoreError ? (
        <Text variant="bodySmall" color="crisis" style={{ marginTop: spacing.xs }}>
          {restoreError}
        </Text>
      ) : null}

      <Card>
        <Text variant="meta" color="textMuted">
          Have a sponsor license?
        </Text>
        <TextInput
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="Enter your code"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="License code"
          style={[styles.input, { borderColor: colors.line, color: colors.textPrimary }]}
        />
        {redeemError ? (
          <Text variant="bodySmall" color="crisis" style={{ marginTop: spacing.xs }}>
            {redeemError}
          </Text>
        ) : null}
        <Button
          label={redeeming ? 'Redeeming…' : 'Redeem license'}
          variant="secondary"
          onPress={onRedeem}
        />
      </Card>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  input: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    minHeight: 44,
    fontSize: 15,
  },
});
