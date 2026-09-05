jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

import { FourDoorsGate } from '@/features/auth/FourDoorsGate';
import { renderWithProviders } from '@/test-utils';

describe('FourDoorsGate', () => {
  it('opens on the warm arrival: the door question, not a name prompt', async () => {
    const { getByText, queryByText } = await renderWithProviders(<FourDoorsGate />);
    // Door-first (Wesley's warm arrival).
    expect(getByText('What brings you to Westercove?')).toBeTruthy();
    expect(getByText('Someone I love died')).toBeTruthy();
    expect(getByText('You can change this later.')).toBeTruthy();
    // The name prompt is a later step, not the first screen.
    expect(queryByText('What should your grief companion call you?')).toBeNull();
  });
});
