import { Linking } from 'react-native';

import { ServerResources } from '@/features/safety/ServerResources';
import { fireEvent, renderWithProviders } from '@/test-utils';

const tier3Resources = {
  headline: 'Support is available right now',
  disclaimer: 'If you are in immediate danger, call 911.',
  items: [
    { id: 'lifeline', label: 'Call or text 988', href: 'tel:988', description: 'Suicide & Crisis Lifeline' },
    { id: 'text', label: 'Text HOME to 741741', href: 'sms:741741', description: 'Crisis Text Line' },
  ],
};

describe('ServerResources (tier_3 crisis resources)', () => {
  it('renders the backend headline and every resource item', async () => {
    const { getByText } = await renderWithProviders(<ServerResources resources={tier3Resources} />);

    expect(getByText('Support is available right now')).toBeTruthy();
    expect(getByText('Call or text 988')).toBeTruthy();
    expect(getByText('Text HOME to 741741')).toBeTruthy();
  });

  it('opens a resource href when its item is tapped', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const { getByLabelText } = await renderWithProviders(<ServerResources resources={tier3Resources} />);

    fireEvent.press(getByLabelText('Call or text 988. Suicide & Crisis Lifeline'));
    expect(openURL).toHaveBeenCalledWith('tel:988');

    openURL.mockRestore();
  });

  it('renders no resource content when there are no items', async () => {
    const { queryByText } = await renderWithProviders(
      <ServerResources resources={{ headline: 'ignored', disclaimer: 'ignored', items: [] }} />,
    );
    // Self-hides (returns null) when there are no items, so even the headline is absent.
    expect(queryByText('ignored')).toBeNull();
  });
});
