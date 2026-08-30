import { Skull, TriangleAlert } from 'lucide-react';

import { Badge, Card, CardBody, CardHeader, CardTitle } from '@/components/ui';
import { formatCount, formatRelative } from '@/lib/format';

import { useDeadLetters } from '../hooks/useQueues';
import { useQueueScope } from '../hooks/useScope';
import { BROKER_LABEL } from '../types';

export function DeadLetterPanel() {
  const { data, isLoading, isError, error } = useDeadLetters();
  const scope = useQueueScope();

  const items = data
    ? scope.active
      ? data.items.filter((it) => scope.match(it.name))
      : data.items
    : [];
  const scopedTotal = items.reduce((sum, it) => sum + it.messageCount, 0);
  const headline = scope.active ? scopedTotal : (data?.totalDeadLettered ?? 0);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Dead-letter özeti</CardTitle>
        {data && (
          <Badge mono tone={headline > 0 ? 'down' : 'up'}>
            {formatCount(headline)}
          </Badge>
        )}
      </CardHeader>

      <CardBody className="min-h-0 flex-1 p-0">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded bg-surface-2 motion-reduce:animate-none"
              />
            ))}
          </div>
        ) : isError ? (
          <p role="alert" className="px-4 py-6 text-center text-xs text-status-down">
            Özet alınamadı: {error instanceof Error ? error.message : 'bilinmeyen hata'}
          </p>
        ) : (
          <>
            {data && data.warnings.length > 0 && (
              <ul className="space-y-1 border-b border-border bg-surface-2/40 px-4 py-2">
                {data.warnings.map((w, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[11px] text-status-degraded">
                    <TriangleAlert size={12} className="mt-0.5 shrink-0" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            )}

            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <Skull size={18} className="text-fg-subtle" />
                <p className="text-xs text-fg-muted">
                  {scope.active && (data?.items.length ?? 0) > 0
                    ? 'Kapsamındaki kuyruklarda dead-letter yok.'
                    : 'Dead-letter kaydı yok.'}
                </p>
              </div>
            ) : (
              <ul className="max-h-72 divide-y divide-border overflow-y-auto">
                {items.map((it, i) => (
                  <li key={`${it.broker}-${it.name}-${i}`} className="px-4 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="tnum truncate text-xs text-fg" title={it.name}>
                        {it.name}
                      </span>
                      <span className="tnum shrink-0 text-xs font-semibold text-status-down">
                        {formatCount(it.messageCount)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-fg-subtle">
                      <span className="tnum">{BROKER_LABEL[it.broker]}</span> · {it.kind}
                      {it.lastReason && <> · {it.lastReason}</>}
                      {it.sampledAt && <> · {formatRelative(it.sampledAt)}</>}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}
