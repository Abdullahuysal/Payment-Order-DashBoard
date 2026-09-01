import { useTranslation } from 'react-i18next';

import { formatCount, formatDateTime } from '@/lib/format';

import { barHeightPercent, histogramPeak } from '../lib';
import type { HistogramBucket } from '../types';

export function TimelineHistogram({ buckets }: { buckets: HistogramBucket[] | undefined }) {
  const { t } = useTranslation('logs');
  const data = buckets ?? [];
  const peak = histogramPeak(data);

  return (
    <section className="space-y-1.5 rounded-lg border border-border bg-surface px-3 py-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
          {t('histogram.title')}
        </h3>
        {peak > 0 && <span className="tnum text-[11px] text-fg-subtle">{formatCount(peak)}</span>}
      </div>

      {data.length === 0 || peak === 0 ? (
        <p className="py-6 text-center text-[11px] text-fg-subtle">{t('histogram.empty')}</p>
      ) : (
        <div className="flex h-24 items-end gap-0.5">
          {data.map((bucket) => (
            <div
              key={bucket.startTime}
              title={t('histogram.bucketTitle', {
                time: formatDateTime(bucket.startTime),
                count: bucket.count,
              })}
              className="flex-1 rounded-sm bg-accent-logs/70 transition-colors hover:bg-accent-logs"
              style={{ height: `${barHeightPercent(bucket.count, peak)}%` }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
