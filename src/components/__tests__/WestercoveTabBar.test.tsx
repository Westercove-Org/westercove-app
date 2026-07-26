import { WestercoveTabBar, type TabBarProps } from '@/components/WestercoveTabBar';
import { fireEvent, renderWithProviders } from '@/test-utils';

function mockProps(overrides?: Partial<TabBarProps>): TabBarProps {
  return {
    state: {
      index: 0,
      routes: [
        { key: 'index', name: 'index' },
        { key: 'journal', name: 'journal' },
        { key: 'discover', name: 'discover' },
        { key: 'profile', name: 'profile' },
        { key: 'support', name: 'support' },
      ],
    },
    navigation: {
      emit: jest.fn(() => ({ defaultPrevented: false })),
      navigate: jest.fn(),
    },
    ...overrides,
  };
}

describe('WestercoveTabBar', () => {
  it('renders all five tabs in order with the crisis banner beneath', async () => {
    const { getByLabelText, getByText } = await renderWithProviders(
      <WestercoveTabBar {...mockProps()} />,
    );
    for (const label of ['Home', 'Journal', 'Discover', 'Profile', 'Support']) {
      expect(getByLabelText(label)).toBeTruthy();
    }
    // Persistent crisis banner is part of the tab region.
    expect(getByText(/In crisis\? Call or text 988/)).toBeTruthy();
  });

  it('navigates to a tab on press', async () => {
    const props = mockProps();
    const { getByLabelText } = await renderWithProviders(
      <WestercoveTabBar {...props} />,
    );
    fireEvent.press(getByLabelText('Support'));
    expect(props.navigation.navigate).toHaveBeenCalledWith('support');
  });
});
