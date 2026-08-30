const relTime = new Intl.RelativeTimeFormat('tr', { numeric: 'auto' });

const groupedNumber = new Intl.NumberFormat('tr');
const compactNumber = new Intl.NumberFormat('tr', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function formatCount(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return groupedNumber.format(value);
}

export function formatCompact(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return compactNumber.format(value);
}

export function formatRate(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  if (value === 0) return '0';
  return `${value.toFixed(value < 10 ? 1 : 0)}/sn`;
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
    if (Math.abs(value) < size) return relTime.format(value, unit);
    value = Math.round(value / size);
  }
  return relTime.format(value, 'week');
}
