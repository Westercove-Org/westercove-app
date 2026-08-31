import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

import { darkTheme, lightTheme, type Theme } from './tokens';

/** User-facing theme control: follow the OS, or force a mode (Settings §6.4). */
export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function WestercoveThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  // Default to light for everyone — including dark-OS devices (fe-default-light-theme).
  // A user who explicitly picks 'system' or 'dark' via setMode still wins.
  const [mode, setMode] = useState<ThemeMode>('light');

  const value = useMemo<ThemeContextValue>(() => {
    const resolved =
      mode === 'system' ? (systemScheme ?? 'light') : mode;
    return {
      theme: resolved === 'dark' ? darkTheme : lightTheme,
      mode,
      setMode,
    };
  }, [mode, systemScheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within WestercoveThemeProvider');
  return ctx.theme;
}

export function useThemeMode(): {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
} {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeMode must be used within WestercoveThemeProvider');
  }
  return { mode: ctx.mode, setMode: ctx.setMode };
}
