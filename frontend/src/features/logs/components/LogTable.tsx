import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';

import { LEVEL_TONE } from '../lib';
import type { LogEntry } from '../types';

export function LogTable({
  entries,
  selectedId,
  onSelect,
}: {
  entries: LogEntry[];
  selectedId?: string | undefined;
  onSelect: (entry: LogEntry) => void;
}) {
  const { t } = useTranslation('logs');

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full min-w-[52rem] border-collapse text-xs">
        <thead>
          <tr>
            {[
              t('table.time'),
              t('table.level'),
              t('table.service'),
              t('table.message'),
              t('table.traceId'),
            ].map((h) => (
              <th
                key={h}
                scope="col"
                className="sticky top-0 z-10 border-b border-border bg-surface px-3 py-2 text-left font-medium text-fg-subtle"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry.id}
              tabIndex={0}
              role="button"
              aria-label={t('table.rowAria', {
                time: formatDateTime(entry.timestamp),
                message: entry.message,
              })}
              onClick={() => onSelect(entry)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(entry);
                }
              }}
              className={cn(
                'cursor-pointer border-b border-border transition-colors last:border-b-0 hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none',
                selectedId === entry.id && 'bg-surface-2',
              )}
            >
              <td className="tnum whitespace-nowrap px-3 py-2 align-top text-fg-muted">
                {formatDateTime(entry.timestamp)}
              </td>
              <td className="px-3 py-2 align-top">
                <Badge tone={LEVEL_TONE[entry.level]} mono>
                  {t(`levels.${entry.level}`)}
                </Badge>
              </td>
              <td className="tnum whitespace-nowrap px-3 py-2 align-top text-fg-muted">
                {entry.service}
              </td>
              <td className="max-w-xl px-3 py-2 align-top text-fg">
                <span className="line-clamp-2">{entry.message}</span>
              </td>
              <td className="tnum whitespace-nowrap px-3 py-2 align-top text-fg-subtle">
                {entry.traceId ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
