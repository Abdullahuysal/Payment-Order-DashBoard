import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Badge, CopyButton } from '@/components/ui';
import { formatCount, formatRelative } from '@/lib/format';

import { rankExceptionGroups } from '../lib';
import type { ExceptionGroup } from '../types';

export function ExceptionGroupsPanel({ groups }: { groups: ExceptionGroup[] }) {
  const { t } = useTranslation('logs');
  const [open, setOpen] = useState<string | null>(null);
  const ranked = rankExceptionGroups(groups);

  if (ranked.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface px-3 py-8 text-center">
        <p className="text-xs text-fg-muted">{t('exceptions.empty')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface">
      <h3 className="border-b border-border px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
        {t('exceptions.title')}
      </h3>
      <ul className="divide-y divide-border">
        {ranked.map((group) => {
          const expanded = open === group.fingerprint;
          return (
            <li key={group.fingerprint}>
              <button
                type="button"
                onClick={() => setOpen(expanded ? null : group.fingerprint)}
                aria-expanded={expanded}
                className="flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-surface-2"
              >
                {expanded ? (
                  <ChevronDown size={14} className="mt-0.5 shrink-0 text-fg-subtle" />
                ) : (
                  <ChevronRight size={14} className="mt-0.5 shrink-0 text-fg-subtle" />
                )}
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="tnum truncate text-xs font-medium text-fg">
                      {group.exceptionType}
                    </span>
                    <Badge tone="down" mono>
                      {t('exceptions.count', { count: group.count })}
                    </Badge>
                  </span>
                  <span className="line-clamp-2 block text-[11px] text-fg-muted">
                    {group.message}
                  </span>
                  <span className="block text-[11px] text-fg-subtle">
                    {t('exceptions.seen', {
                      first: formatRelative(group.firstSeen),
                      last: formatRelative(group.lastSeen),
                    })}
                  </span>
                </span>
              </button>

              {expanded && (
                <div className="space-y-2 px-3 pb-3 pl-9">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-fg-subtle">
                    <span>
                      {t('exceptions.services')}:{' '}
                      <span className="tnum text-fg-muted">{group.services.join(', ') || '—'}</span>
                    </span>
                    <span className="tnum">{formatCount(group.count)}</span>
                    {group.sampleTraceId && (
                      <span className="inline-flex items-center gap-1">
                        {t('exceptions.sampleTrace')}:
                        <CopyButton value={group.sampleTraceId} label={group.sampleTraceId} />
                      </span>
                    )}
                  </div>
                  <pre className="tnum max-h-72 overflow-auto rounded-md border border-border bg-bg px-2.5 py-2 text-[11px] leading-relaxed text-fg-muted">
                    {group.sampleStackTrace && group.sampleStackTrace.length > 0
                      ? group.sampleStackTrace
                      : t('exceptions.noStack')}
                  </pre>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
