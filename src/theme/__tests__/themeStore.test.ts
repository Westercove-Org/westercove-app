jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

import { useThemeStore } from '@/theme/themeStore';

describe('themeStore', () => {
  beforeEach(() => useThemeStore.setState({ mode: 'system' }));

  it('defaults to following the system', () => {
    expect(useThemeStore.getState().mode).toBe('system');
  });

  it('setMode switches between light and dark', () => {
    useThemeStore.getState().setMode('light');
    expect(useThemeStore.getState().mode).toBe('light');
    useThemeStore.getState().setMode('dark');
    expect(useThemeStore.getState().mode).toBe('dark');
    useThemeStore.getState().setMode('system');
    expect(useThemeStore.getState().mode).toBe('system');
  });
});
