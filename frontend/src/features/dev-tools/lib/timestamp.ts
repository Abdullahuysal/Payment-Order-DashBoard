import type { DevToolTransform, OptionState } from '../types';
import { padColumns, readStr, requireInput, splitLines } from './_shared';

function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function localString(date: Date, tz: string): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: tz,
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(date);
}

function relative(date: Date): string {
  const diffMs = date.getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat('tr', { numeric: 'auto' });
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31536000000],
    ['day', 86400000],
    ['hour', 3600000],
    ['minute', 60000],
    ['second', 1000],
  ];
  for (const [unit, ms] of units) {
    if (Math.abs(diffMs) >= ms || unit === 'second') {
      return rtf.format(Math.round(diffMs / ms), unit);
    }
  }
  return rtf.format(0, 'second');
}

function resolveEpochMs(digits: string, unit: string): number {
  const value = Number(digits);
  if (unit === 's') return value * 1000;
  if (unit === 'ms') return value;
  return digits.replace('-', '').length >= 13 ? value : value * 1000;
}

export function convertTimestamp(input: string, options: OptionState): DevToolTransform {
  requireInput(input, 'çevrilecek zaman damgası');
  const unit = readStr(options, 'unit', 'auto');
  const requestedTz = readStr(options, 'tz', 'Europe/Istanbul');
  const tzValid = isValidTimeZone(requestedTz);
  const tz = tzValid ? requestedTz : 'UTC';

  const rows: string[][] = [];
  let resolved = 0;

  for (const line of splitLines(input)) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;

    if (/^-?\d+$/.test(trimmed)) {
      const ms = resolveEpochMs(trimmed, unit);
      const date = new Date(ms);
      if (Number.isNaN(date.getTime())) {
        rows.push([trimmed, 'çözülemedi']);
        continue;
      }
      resolved += 1;
      rows.push([
        trimmed,
        `utc=${date.toISOString()}  yerel=${localString(date, tz)}  görece=${relative(date)}`,
      ]);
      continue;
    }

    const ms = Date.parse(trimmed);
    if (Number.isNaN(ms)) {
      rows.push([trimmed, 'çözülemedi']);
      continue;
    }
    resolved += 1;
    rows.push([trimmed, `epoch_s=${Math.floor(ms / 1000)}  epoch_ms=${ms}`]);
  }

  if (resolved === 0) throw new Error('Hiçbir satır zaman damgası olarak çözülemedi.');

  const notes: string[] = [];
  if (!tzValid) notes.push(`Geçersiz saat dilimi "${requestedTz}" — UTC kullanıldı.`);

  return {
    output: padColumns(rows).join('\n'),
    notes,
    stats: [
      { label: 'Satır', value: String(rows.length) },
      { label: 'tz', value: tz },
    ],
  };
}
