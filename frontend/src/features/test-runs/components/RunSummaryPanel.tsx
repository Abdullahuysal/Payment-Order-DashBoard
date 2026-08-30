import { cn } from '@/lib/cn';
import { formatCount } from '@/lib/format';

import { formatDurationMs, STEP_STATUS_TONE } from '../lib';
import type { RepeatConfig, RunIteration, RunResultSummary } from '../types';
import { CopyButton, EmptyHint, SectionHeading } from './kit';

interface RunSummaryPanelProps {
  repeat: RepeatConfig;
  iterations?: RunIteration[] | undefined;
  summary?: RunResultSummary | undefined;
}

export function RunSummaryPanel({ repeat, iterations, summary }: RunSummaryPanelProps) {
  const orderNos = summary?.orderNos ?? [];

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Planlanan" value={`${repeat.count} × ${repeat.concurrency}`} />
        <Stat label="Başarılı" value={formatCount(summary?.passed)} tone="up" />
        <Stat
          label="Başarısız"
          value={formatCount(summary?.failed)}
          tone={summary && summary.failed > 0 ? 'down' : undefined}
        />
        <Stat
          label="Süre min / medyan / maks"
          value={
            summary
              ? `${formatDurationMs(summary.durationMs.min)} · ${formatDurationMs(summary.durationMs.median)} · ${formatDurationMs(summary.durationMs.max)}`
              : '—'
          }
        />
      </dl>

      {iterations && iterations.length > 0 && (
        <div className="space-y-2">
          <SectionHeading>İterasyonlar</SectionHeading>
          <div className="flex flex-wrap gap-1.5">
            {iterations.map((iteration) => (
              <span
                key={iteration.index}
                title={iteration.error ?? iteration.orderNo ?? ''}
                className={cn(
                  'tnum inline-flex h-6 min-w-8 items-center justify-center rounded border px-1 text-[11px]',
                  toneClass(iteration),
                )}
              >
                {iteration.index}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <SectionHeading>Üretilen sipariş no</SectionHeading>
          {orderNos.length > 0 && (
            <CopyButton value={orderNos.join('\n')} idleLabel="hepsini kopyala" />
          )}
        </div>
        {orderNos.length === 0 ? (
          <EmptyHint>Henüz sipariş no üretilmedi.</EmptyHint>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {orderNos.map((orderNo) => (
              <li key={orderNo} className="flex items-center justify-between gap-2 px-3 py-1.5">
                <span className="tnum text-xs text-fg-muted">{orderNo}</span>
                <CopyButton value={orderNo} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function toneClass(iteration: RunIteration): string {
  const tone =
    iteration.status === 'passed' || iteration.status === 'failed'
      ? STEP_STATUS_TONE[iteration.status]
      : 'neutral';
  if (tone === 'up') return 'border-status-up/40 bg-status-up/10 text-status-up';
  if (tone === 'down') return 'border-status-down/40 bg-status-down/10 text-status-down';
  return 'border-border bg-surface text-fg-subtle';
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'up' | 'down' | undefined;
}) {
  return (
    <div className="rounded-md border border-border bg-bg px-2.5 py-2">
      <dt className="text-[11px] text-fg-subtle">{label}</dt>
      <dd
        className={cn(
          'tnum mt-0.5 text-sm font-semibold text-fg',
          tone === 'up' && 'text-status-up',
          tone === 'down' && 'text-status-down',
        )}
      >
        {value}
      </dd>
    </div>
  );
}
