import { bg } from './translations/bg';
import { en } from './translations/en';

type Dictionary = Record<keyof typeof bg, string>;
type TranslationKey = keyof Dictionary;

const dictionaries: Record<'bg' | 'en', Dictionary> = {
  bg,
  en,
};

let currentLocale: 'bg' | 'en' = 'bg';

export function setLocale(locale: 'bg' | 'en') {
  currentLocale = locale;
}

export function t(key: TranslationKey): string {
  return dictionaries[currentLocale][key] ?? key;
}
