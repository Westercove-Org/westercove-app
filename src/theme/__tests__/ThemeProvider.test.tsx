import { Text } from 'react-native';

import { fireEvent, renderWithProviders, waitFor } from '@/test-utils';
import { isThemeMode, useThemeMode } from '@/theme';
import { secureStorage } from '@/lib/secureStorage';

jest.mock('@/lib/secureStorage', () => ({
  secureStorage: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() },
}));

const mockStore = secureStorage as jest.Mocked<typeof secureStorage>;
const KEY = 'westercove.theme.mode';

/** Probe: shows the resolved mode and can switch it. */
function Probe() {
  const { mode, setMode } = useThemeMode();
  return (
    <>
      <Text accessibilityLabel="mode">{mode}</Text>
      <Text accessibilityLabel="pick-dark" onPress={() => setMode('dark')}>
        dark
      </Text>
    </>
  );
}

beforeEach(() => {
  mockStore.getItem.mockReset().mockResolvedValue(null);
  mockStore.setItem.mockReset().mockResolvedValue();
});

describe('isThemeMode', () => {
  it('accepts only the three modes', () => {
    expect(isThemeMode('light')).toBe(true);
    expect(isThemeMode('dark')).toBe(true);
    expect(isThemeMode('system')).toBe(true);
    expect(isThemeMode('purple')).toBe(false);
    expect(isThemeMode(null)).toBe(false);
  });
});

describe('theme persistence', () => {
  it('defaults to light when nothing is stored', async () => {
    const { getByLabelText } = await renderWithProviders(<Probe />);
    expect(getByLabelText('mode').props.children).toBe('light');
  });

  it('persists the chosen mode to device-local storage', async () => {
    const { getByLabelText } = await renderWithProviders(<Probe />);
    fireEvent.press(getByLabelText('pick-dark'));
    await waitFor(() => expect(getByLabelText('mode').props.children).toBe('dark'));
    expect(mockStore.setItem).toHaveBeenCalledWith(KEY, 'dark');
  });

  it('hydrates a stored choice on mount (survives relaunch)', async () => {
    mockStore.getItem.mockResolvedValue('dark');
    const { getByLabelText } = await renderWithProviders(<Probe />);
    await waitFor(() => expect(getByLabelText('mode').props.children).toBe('dark'));
    expect(mockStore.getItem).toHaveBeenCalledWith(KEY);
  });

  it('ignores a garbage stored value (stays light)', async () => {
    mockStore.getItem.mockResolvedValue('purple');
    const { getByLabelText } = await renderWithProviders(<Probe />);
    await waitFor(() => expect(mockStore.getItem).toHaveBeenCalled());
    expect(getByLabelText('mode').props.children).toBe('light');
  });
});
