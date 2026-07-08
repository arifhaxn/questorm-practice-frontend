import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ThemeName } from './tokens';

/**
 * Blossom-Vermillion — theme provider.
 *
 * Applies the active theme by toggling `class="dark"` and `data-theme` on
 * <html>, which is what `tokens.css` keys off. Light-first: defaults to light,
 * or to the user's OS preference when `defaultTheme="system"`.
 *
 * Wrap your app once:
 *   <ThemeProvider defaultTheme="system">
 *     <App />
 *   </ThemeProvider>
 *
 * Then anywhere:
 *   const { theme, resolvedTheme, setTheme, toggle } = useTheme();
 */

type ThemePreference = ThemeName | 'system';

type ThemeContextValue = {
  /** The user's preference, including 'system'. */
  theme: ThemePreference;
  /** The concrete theme actually applied ('light' | 'dark'). */
  resolvedTheme: ThemeName;
  setTheme: (t: ThemePreference) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'bv-theme';

function getSystemTheme(): ThemeName {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(resolved: ThemeName) {
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.classList.toggle('light', resolved === 'light');
  root.setAttribute('data-theme', resolved);
}

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = STORAGE_KEY,
}: {
  children: ReactNode;
  defaultTheme?: ThemePreference;
  storageKey?: string;
}) {
  const [theme, setThemeState] = useState<ThemePreference>(() => {
    if (typeof window === 'undefined') return defaultTheme;
    return (window.localStorage.getItem(storageKey) as ThemePreference) ?? defaultTheme;
  });

  const resolvedTheme: ThemeName = theme === 'system' ? getSystemTheme() : theme;

  // Apply on mount + whenever the resolved theme changes.
  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  // Track OS changes while in 'system' mode.
  useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme(getSystemTheme());
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  const setTheme = (t: ThemePreference) => {
    if (typeof window !== 'undefined') window.localStorage.setItem(storageKey, t);
    setThemeState(t);
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggle: () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'),
    }),
    [theme, resolvedTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>');
  return ctx;
}
