export type ThemeKey = 'standard' | 'minimal' | 'burger' | 'fancy';

export type PublicTheme = {
  key: ThemeKey;
  pageClassName: string;
  heroClassName: string;
  cardClassName: string;
  spacingClassName: string;
};

const standardTheme: PublicTheme = {
  key: 'standard',
  pageClassName: 'bg-background text-foreground',
  heroClassName: 'rounded-2xl border bg-card shadow-sm p-12',
  cardClassName: 'rounded-xl border bg-card/90 shadow-sm',
  spacingClassName: 'space-y-6',
};

export function getTheme(themeKey: ThemeKey): PublicTheme {
  switch (themeKey) {
    case 'standard':
    case 'minimal':
    case 'burger':
    case 'fancy':
    default:
      return standardTheme;
  }
}
