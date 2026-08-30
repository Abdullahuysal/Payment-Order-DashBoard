export const LOCALES = ['tr', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'tr';

export const LOCALE_STORAGE_KEY = 'boyner-ops-ui';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

function readPersistedLocale(): Locale | null {
  try {
    const raw = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    const stored =
      parsed && typeof parsed === 'object'
        ? (parsed as { state?: { language?: unknown } }).state?.language
        : undefined;
    return isLocale(stored) ? stored : null;
  } catch {
    return null;
  }
}

function readNavigatorLocale(): Locale {
  const nav = typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : '';
  if (nav.startsWith('en')) return 'en';
  return DEFAULT_LOCALE;
}

/** Persist store'daki tercih varsa onu, yoksa tarayıcı diline göre TR/EN döndürür. */
export function detectInitialLocale(): Locale {
  return readPersistedLocale() ?? readNavigatorLocale();
}
