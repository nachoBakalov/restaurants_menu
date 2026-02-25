import { createContext, useContext, useMemo } from 'react';
import type { PropsWithChildren } from 'react';
import { getTheme } from './theme';
import type { PublicTheme, ThemeKey } from './theme';

type ThemeContextValue = {
  theme: PublicTheme;
  themeKey: ThemeKey;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

type ThemeProviderProps = PropsWithChildren<{
  themeKey?: ThemeKey;
}>;

export function ThemeProvider({ children, themeKey = 'standard' }: ThemeProviderProps) {
  const value = useMemo(
    () => ({
      theme: getTheme(themeKey),
      themeKey,
    }),
    [themeKey],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function usePublicTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('usePublicTheme must be used within ThemeProvider');
  }
  return context;
}
