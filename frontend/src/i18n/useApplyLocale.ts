import { useEffect } from 'react';

import { useAppStore } from '@/app/store';

import i18n from './index';

export function useApplyLocale(): void {
  const language = useAppStore((s) => s.language);

  useEffect(() => {
    if (i18n.language !== language) void i18n.changeLanguage(language);
    document.documentElement.lang = language;
    document.title = i18n.t('common:app.title');
  }, [language]);
}
