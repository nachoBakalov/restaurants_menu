import { useT } from '../../i18n/useT';

export function LanguageSwitcher() {
  const { lang, setLang, t } = useT();

  return (
    <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <span>{t('lang.label')}</span>
      <select
        aria-label={t('lang.label')}
        className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
        value={lang}
        onChange={(event) => setLang(event.target.value as 'bg' | 'en')}
      >
        <option value="bg">{t('lang.bg')}</option>
        <option value="en">{t('lang.en')}</option>
      </select>
    </label>
  );
}
