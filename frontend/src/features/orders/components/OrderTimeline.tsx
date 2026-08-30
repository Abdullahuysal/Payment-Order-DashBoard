import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';

import { formatDateTime, STATUS_TONE_BADGE } from '../lib';
import type { BadgeTone } from '../lib';
import type { TimelineEvent } from '../types';

const DOT_TONE: Record<BadgeTone, string> = {
  up: 'bg-status-up',
  degraded: 'bg-status-degraded',
  down: 'bg-status-down',
  logs: 'bg-accent-logs',
  neutral: 'bg-border-strong',
};

export function OrderTimeline({ timeline }: { timeline: readonly TimelineEvent[] }) {
  const { t } = useTranslation('orders');
  if (timeline.length === 0) {
    return <p className="text-xs text-fg-subtle">{t('timeline.empty')}</p>;
  }

  return (
    <ol className="space-y-0">
      {timeline.map((event, index) => {
        const tone = STATUS_TONE_BADGE[event.tone ?? 'neutral'];
        const last = index === timeline.length - 1;
        return (
          <li key={`${event.at}-${event.label}`} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', DOT_TONE[tone])} />
              {!last && <span className="w-px flex-1 bg-border" />}
            </div>
            <div className="min-w-0 flex-1 pb-3">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-xs font-medium text-fg">{event.label}</span>
                <span className="text-[11px] text-fg-subtle">{event.source}</span>
              </div>
              <div className="tnum text-[11px] text-fg-subtle">{formatDateTime(event.at)}</div>
              {event.detail && (
                <div className="mt-0.5 text-[11px] text-fg-muted">{event.detail}</div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
