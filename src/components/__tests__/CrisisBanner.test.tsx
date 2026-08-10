import { Linking } from 'react-native';

import { CrisisBanner } from '@/components/CrisisBanner';
import { copy } from '@/constants/copy';
import { fireEvent, renderWithProviders } from '@/test-utils';

describe('CrisisBanner', () => {
  it('shows the collapsed crisis line by default', async () => {
    const { getByText } = await renderWithProviders(<CrisisBanner />);
    expect(getByText(copy.crisis.bannerLine)).toBeTruthy();
  });

  it('expands to one-tap 988 / 741741 actions and wires tel:/sms: links', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const { getByLabelText, queryByLabelText, findByLabelText } =
      await renderWithProviders(<CrisisBanner />);

    // Collapsed: expanded actions are not shown yet.
    expect(queryByLabelText(/^Call 988\./)).toBeNull();

    // RNTL 14 dispatches through act(); un-awaited presses leak into the next test.
    await fireEvent.press(getByLabelText(/tap to expand/i));

    await fireEvent.press(await findByLabelText(/^Call 988\./));
    expect(openURL).toHaveBeenCalledWith('tel:988');

    await fireEvent.press(getByLabelText(/^Text HOME to 741741\./));
    expect(openURL).toHaveBeenCalledWith(expect.stringContaining('sms:741741'));

    openURL.mockRestore();
  });

  it('compact: numbers are tappable directly, with no expand step', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const { getByLabelText, queryByLabelText, findByLabelText } = await renderWithProviders(
      <CrisisBanner compact />,
    );

    expect(queryByLabelText(/tap to expand/i)).toBeNull();

    fireEvent.press(await findByLabelText(/^Call or text 988\./));
    expect(openURL).toHaveBeenCalledWith('tel:988');

    fireEvent.press(getByLabelText(/^Text HOME to 741741\./));
    expect(openURL).toHaveBeenCalledWith(expect.stringContaining('sms:741741'));

    openURL.mockRestore();
  });

  it('has no permanent dismiss control (never dismissible)', async () => {
    const { queryByLabelText } = await renderWithProviders(<CrisisBanner />);
    expect(queryByLabelText(/dismiss|close/i)).toBeNull();
  });
});
