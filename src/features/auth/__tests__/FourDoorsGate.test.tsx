jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

import { FourDoorsGate } from '@/features/auth/FourDoorsGate';
import { renderWithProviders } from '@/test-utils';

describe('FourDoorsGate', () => {
  it('renders the first gate question (name)', async () => {
    const { getByText } = await renderWithProviders(<FourDoorsGate />);
    expect(getByText('What should your grief companion call you?')).toBeTruthy();
  });
});
