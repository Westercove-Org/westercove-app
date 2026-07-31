import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { darkTheme, lightTheme, type Theme } from './tokens';
import { useThemeStore, type ThemeMode } from './themeStore';

export type { ThemeMode };

interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function WestercoveThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  const value = useMemo<ThemeContextValue>(() => {
    const resolved = mode === 'system' ? (systemScheme ?? 'light') : mode;
    return {
      theme: resolved === 'dark' ? darkTheme : lightTheme,
      mode,
      setMode,
    };
  }, [mode, setMode, systemScheme]);

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
