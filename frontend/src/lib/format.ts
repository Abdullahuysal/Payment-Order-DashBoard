import i18n from '@/i18n';

function activeLocale(): string {
  return i18n.language || 'tr';
}

function cached<T>(store: Map<string, T>, make: (locale: string) => T): T {
  const locale = activeLocale();
  let value = store.get(locale);
  if (!value) {
    value = make(locale);
    store.set(locale, value);
  }
  return value;
}

const relTimeByLocale = new Map<string, Intl.RelativeTimeFormat>();
const groupedByLocale = new Map<string, Intl.NumberFormat>();
const compactByLocale = new Map<string, Intl.NumberFormat>();
const dateTimeByLocale = new Map<string, Intl.DateTimeFormat>();

function relTime(): Intl.RelativeTimeFormat {
  return cached(
    relTimeByLocale,
    (locale) => new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }),
  );
}

function groupedNumber(): Intl.NumberFormat {
  return cached(groupedByLocale, (locale) => new Intl.NumberFormat(locale));
}

function compactNumber(): Intl.NumberFormat {
  return cached(
    compactByLocale,
    (locale) => new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }),
  );
}

function dateTime(): Intl.DateTimeFormat {
  return cached(
    dateTimeByLocale,
    (locale) => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }),
  );
}

export function formatCount(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return groupedNumber().format(value);
}

export function formatCompact(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return compactNumber().format(value);
}

export function formatRate(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  if (value === 0) return '0';
  return `${value.toFixed(value < 10 ? 1 : 0)}${i18n.t('common:units.perSecond')}`;
}

export function formatDateTime(input: string | Date | null | undefined): string {
  if (!input) return '—';
  const date = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return '—';
  return dateTime().format(date);
}

export function formatRelative(input: string | Date | null | undefined): string {
  if (!input) return '—';
  const then = typeof input === 'string' ? new Date(input) : input;
  const diffMs = then.getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);

  const table: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['second', 60],
    ['minute', 60],
    ['hour', 24],
    ['day', 7],
  ];

  let value = diffSec;
  for (const [unit, size] of table) {
    if (Math.abs(value) < size) return relTime().format(value, unit);
    value = Math.round(value / size);
  }
  return relTime().format(value, 'week');
}
