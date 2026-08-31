import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

import { secureStorage } from '@/lib/secureStorage';
import { darkTheme, lightTheme, type Theme } from './tokens';

/** User-facing theme control: follow the OS, or force a mode (Settings §6.4). */
export type ThemeMode = 'system' | 'light' | 'dark';

/** Device-local (NOT per-profile, NOT synced) theme preference. */
const THEME_KEY = 'westercove.theme.mode';

export function isThemeMode(v: unknown): v is ThemeMode {
  return v === 'system' || v === 'light' || v === 'dark';
}

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
  const [mode, setModeState] = useState<ThemeMode>('light');

  // Hydrate the persisted choice once. Default stays light until a stored
  // 'dark'/'system' loads. ponytail: brief light->dark flash for dark-choosers on
  // native relaunch (async read); upgrade to a sync web localStorage init if QA
  // finds the flash noticeable (web is the deploy target, so most cases are sync-able).
  useEffect(() => {
    let alive = true;
    secureStorage.getItem(THEME_KEY).then((v) => {
      if (alive && isThemeMode(v)) setModeState(v);
    });
    return () => {
      alive = false;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    void secureStorage.setItem(THEME_KEY, next);
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const resolved =
      mode === 'system' ? (systemScheme ?? 'light') : mode;
    return {
      theme: resolved === 'dark' ? darkTheme : lightTheme,
      mode,
      setMode,
    };
  }, [mode, systemScheme, setMode]);

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
