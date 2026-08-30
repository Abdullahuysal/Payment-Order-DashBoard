import { useTranslation } from 'react-i18next';

import { useAppStore } from '@/app/store';
import { Segmented } from '@/components/ui';
import { LOCALES, type Locale } from '@/i18n/config';

export function LocaleToggle() {
  const { t } = useTranslation('common');
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);

  return (
    <Segmented<Locale>
      ariaLabel={t('locale.ariaLabel')}
      size="sm"
      value={language}
      onChange={setLanguage}
      options={LOCALES.map((code) => ({ value: code, label: t(`locale.short.${code}`) }))}
    />
  );
}
