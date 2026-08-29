const relTime = new Intl.RelativeTimeFormat('tr', { numeric: 'auto' });

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

export function formatLatency(ms: number | null | undefined): string {
  if (ms == null) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

export function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}
