import { useCallback, useEffect, useState } from 'react';
import { LANG_CHANGE_EVENT, getLang, setLang as setLangStorage, t as translate } from './i18n';
import type { Lang, TranslationKey } from './i18n';

export function useT() {
  const [lang, setLangState] = useState<Lang>(() => getLang());

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'rm_lang') {
        setLangState(getLang());
      }
    };

    const handleLangChange = (event: Event) => {
      const customEvent = event as CustomEvent<Lang>;
      setLangState(customEvent.detail ?? getLang());
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(LANG_CHANGE_EVENT, handleLangChange);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(LANG_CHANGE_EVENT, handleLangChange);
    };
  }, []);

  const setLang = useCallback((nextLang: Lang) => {
    setLangStorage(nextLang);
    setLangState(nextLang);
  }, []);

  const t = useCallback((key: TranslationKey) => translate(key), []);

  return { t, lang, setLang };
}
