import { Linking } from 'react-native';

import { CrisisInterface } from '@/features/safety/CrisisInterface';
import { fireEvent, renderWithProviders } from '@/test-utils';

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), canGoBack: () => true, replace: jest.fn() }),
}));

describe('CrisisInterface (Level 4)', () => {
  it('offers one-tap 988 and 741741 actions', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const { getByLabelText } = await renderWithProviders(<CrisisInterface />);

    fireEvent.press(getByLabelText('Call 988'));
    expect(openURL).toHaveBeenCalledWith('tel:988');

    fireEvent.press(getByLabelText('Text 988'));
    expect(openURL).toHaveBeenCalledWith('sms:988');

    fireEvent.press(getByLabelText('Text HOME to 741741'));
    expect(openURL).toHaveBeenCalledWith(expect.stringContaining('sms:741741'));

    openURL.mockRestore();
  });

  it('has no dismiss control (interrupts flow, cannot be closed)', async () => {
    const { queryByLabelText } = await renderWithProviders(<CrisisInterface />);
    // No hard dismiss/skip: the interface interrupts flow. The only way out is
    // the in-screen soft exit (its presence is covered by the web-export check).
    expect(queryByLabelText('Close')).toBeNull();
    expect(queryByLabelText('Dismiss')).toBeNull();
    expect(queryByLabelText(/^skip$/i)).toBeNull();
  });
});
