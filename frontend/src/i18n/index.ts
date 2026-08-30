import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import { DEFAULT_LOCALE, detectInitialLocale } from './config';
import { defaultNS, resources } from './resources';
import './types';

void i18next.use(initReactI18next).init({
  resources,
  lng: detectInitialLocale(),
  fallbackLng: DEFAULT_LOCALE,
  defaultNS,
  ns: Object.keys(resources.tr),
  interpolation: { escapeValue: false },
  returnNull: false,
  react: { useSuspense: false },
});

export default i18next;
