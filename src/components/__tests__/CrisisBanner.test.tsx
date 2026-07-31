import { useRouter } from 'expo-router';

import { CrisisBanner } from '@/components/CrisisBanner';
import { copy } from '@/constants/copy';
import { fireEvent, renderWithProviders } from '@/test-utils';

jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  useRouter: jest.fn(),
}));

describe('CrisisBanner', () => {
  const push = jest.fn();

  beforeEach(() => {
    push.mockClear();
    (useRouter as jest.Mock).mockReturnValue({ push });
  });

  it('shows the crisis line by default', async () => {
    const { getByText } = await renderWithProviders(<CrisisBanner />);
    expect(getByText(copy.crisis.bannerLine)).toBeTruthy();
  });

  it('navigates to the full-screen crisis interface when tapped', async () => {
    const { getByText } = await renderWithProviders(<CrisisBanner />);
    fireEvent.press(getByText(copy.crisis.bannerLine));
    expect(push).toHaveBeenCalledWith('/crisis');
  });

  it('has no permanent dismiss control (never dismissible)', async () => {
    const { queryByLabelText } = await renderWithProviders(<CrisisBanner />);
    expect(queryByLabelText(/dismiss|close/i)).toBeNull();
  });
});
