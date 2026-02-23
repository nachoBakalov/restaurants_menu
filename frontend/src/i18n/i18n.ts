import { bg } from './translations/bg';
import { en } from './translations/en';

const LANG_STORAGE_KEY = 'rm_lang';
const LANG_CHANGE_EVENT = 'rm-lang-change';

export type Lang = 'bg' | 'en';
export type TranslationKey = keyof typeof bg;

type Dictionary = Record<TranslationKey, string>;

const dictionaries: Record<Lang, Partial<Dictionary>> = {
  bg,
  en,
};

function isLang(value: string | null): value is Lang {
  return value === 'bg' || value === 'en';
}

export function getLang(): Lang {
  const stored = localStorage.getItem(LANG_STORAGE_KEY);
  return isLang(stored) ? stored : 'bg';
}

export function setLang(lang: Lang): void {
  localStorage.setItem(LANG_STORAGE_KEY, lang);
  window.dispatchEvent(new CustomEvent<Lang>(LANG_CHANGE_EVENT, { detail: lang }));
}

export function t(key: TranslationKey): string {
  const lang = getLang();
  const selectedValue = dictionaries[lang][key];
  if (selectedValue) {
    return selectedValue;
  }

  const fallbackValue = dictionaries.bg[key];
  return fallbackValue ?? key;
}

export { LANG_CHANGE_EVENT };
