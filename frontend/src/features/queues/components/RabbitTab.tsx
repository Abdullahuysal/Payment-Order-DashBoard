import { useEffect, useState } from 'react';
import { TriangleAlert } from 'lucide-react';

import { Badge, Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatCount, formatRate } from '@/lib/format';

import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useRabbitQueues } from '../hooks/useQueues';
import { useQueueScope } from '../hooks/useScope';
import { useScopedRabbitQueues } from '../hooks/useScopedRabbitQueues';
import { rabbitHasProblem, rabbitStateTone, type BrokerPhase } from '../lib';
import { CATEGORY_LABEL, type QueueCategory } from '../scope';
import type { RabbitQueue } from '../types';
import { FilterToggle, SearchField } from './filters';
import { PanelEmpty, PanelError, PanelUnavailable, TableSkeleton } from './panels';
import { Pagination } from './Pagination';
import { RabbitQueueDrawer } from './RabbitQueueDrawer';
import { RabbitScopeSummary } from './RabbitScopeSummary';
import { TableFrame, Td, Th, Tr } from './table';

const COLS = 8;

export function RabbitTab({ phase }: { phase: BrokerPhase }) {
  const scope = useQueueScope();

  const [search, setSearch] = useState('');
  const nameContains = useDebouncedValue(search.trim(), 300);
  const [onlyProblems, setOnlyProblems] = useState(false);
  const [deadLetterOnly, setDeadLetterOnly] = useState(false);
  const [category, setCategory] = useState<QueueCategory | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<{ vhost: string; name: string } | null>(null);

  useEffect(() => {
    setPage(1);
  }, [nameContains, onlyProblems, deadLetterOnly, pageSize, category, scope.active]);

  const brokerReady = phase === 'ok';

  const unscopedParams = {
    ...(nameContains ? { nameContains } : {}),
    ...(onlyProblems ? { onlyProblems: true } : {}),
    ...(deadLetterOnly ? { deadLetterOnly: true } : {}),
    page,
    pageSize,
  };
  const unscoped = useRabbitQueues(unscopedParams, brokerReady && !scope.active);
  const scoped = useScopedRabbitQueues({
    scope,
    enabled: brokerReady,
    serverFilters: { onlyProblems, deadLetterOnly },
    search: nameContains,
    category,
    page,
    pageSize,
  });

  const view = scope.active
    ? {
        rows: scoped.rows,
        page: scoped.page,
        pageSize: scoped.pageSize,
        totalCount: scoped.totalCount,
        totalPages: scoped.totalPages,
        isLoading: scoped.isLoading,
        isFetching: scoped.isFetching,
        isError: scoped.isError,
        error: scoped.error,
        refetch: scoped.refetch,
      }
    : {
        rows: unscoped.data?.items ?? [],
        page: unscoped.data?.page ?? page,
        pageSize: unscoped.data?.pageSize ?? pageSize,
        totalCount: unscoped.data?.totalCount ?? 0,
        totalPages: unscoped.data?.totalPages ?? 1,
        isLoading: unscoped.isLoading,
        isFetching: unscoped.isFetching,
        isError: unscoped.isError,
        error: unscoped.error,
        refetch: () => void unscoped.refetch(),
      };

  const emptyMessage =
    scope.active && category
      ? `Kapsamda “${CATEGORY_LABEL[category]}” kuyruğu yok.`
      : scope.active
        ? 'Kapsam kalıplarına uyan kuyruk yok — kalıpları düzenleyin.'
        : 'Filtreye uyan kuyruk yok.';

  return (
    <div className="rounded-lg border border-border bg-surface">
      {brokerReady && scope.active && (
        <RabbitScopeSummary summary={scoped.summary} active={category} onSelect={setCategory} />
      )}

      {brokerReady && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          <SearchField
            value={search}
            onChange={setSearch}
            label="Kuyruk adında ara"
            placeholder="kuyruk adı içerir…"
          />
          <FilterToggle active={onlyProblems} onToggle={() => setOnlyProblems((v) => !v)}>
            Sadece sorunlu
          </FilterToggle>
          <FilterToggle active={deadLetterOnly} onToggle={() => setDeadLetterOnly((v) => !v)}>
            Sadece DLQ
          </FilterToggle>
        </div>
      )}

      {brokerReady && scope.active && scoped.capped && (
        <p className="flex items-start gap-1.5 border-t border-border bg-status-degraded/5 px-4 py-2 text-[11px] text-status-degraded">
          <TriangleAlert size={12} className="mt-0.5 shrink-0" />
          Kapsam çok geniş: her kalıp için ilk 200 kuyruk tarandı, bazıları listede olmayabilir. Tam
          kapsam için sunucu tarafı filtre gerekir.
        </p>
      )}

      {!brokerReady ? (
        <PanelUnavailable phase={phase} brokerLabel="RabbitMQ" />
      ) : view.isError ? (
        <PanelError error={view.error} onRetry={view.refetch} isRetrying={view.isFetching} />
      ) : view.isLoading ? (
        <TableSkeleton cols={COLS} />
      ) : view.rows.length === 0 ? (
        <div className="border-t border-border">
          <PanelEmpty message={emptyMessage} />
          {scope.active && category && (
            <div className="pb-4 text-center">
              <Button size="sm" variant="ghost" onClick={() => setCategory(null)}>
                Kategori süzgecini kaldır
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className={cn(view.isFetching && 'opacity-60 transition-opacity')}>
          <TableFrame>
            <thead>
              <tr>
                <Th>Kuyruk</Th>
                <Th>Durum</Th>
                <Th numeric>Toplam</Th>
                <Th numeric>Hazır</Th>
                <Th numeric>Unacked</Th>
                <Th numeric>Tüketici</Th>
                <Th numeric>Publish/s</Th>
                <Th numeric>Deliver/s</Th>
              </tr>
            </thead>
            <tbody>
              {view.rows.map((q) => (
                <QueueRow
                  key={`${q.virtualHost}::${q.name}`}
                  q={q}
                  cats={
                    scope.active ? scoped.categoryOf.get(`${q.virtualHost}::${q.name}`) : undefined
                  }
                  onOpen={() => setSelected({ vhost: q.virtualHost, name: q.name })}
                />
              ))}
            </tbody>
          </TableFrame>
          <Pagination
            page={view.page}
            totalPages={view.totalPages}
            totalCount={view.totalCount}
            pageSize={view.pageSize}
            onPage={setPage}
            onPageSize={setPageSize}
            busy={view.isFetching}
          />
        </div>
      )}

      {selected && (
        <RabbitQueueDrawer
          vhost={selected.vhost}
          name={selected.name}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function QueueRow({
  q,
  cats,
  onOpen,
}: {
  q: RabbitQueue;
  cats?: Set<QueueCategory> | undefined;
  onOpen: () => void;
}) {
  const problem = rabbitHasProblem(q);
  return (
    <Tr onClick={onOpen} ariaLabel={`${q.name} kuyruğunun detayını aç`}>
      <Td>
        <div className="flex items-center gap-2">
          {problem && (
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-status-degraded"
              title="Dikkat gerektirir"
            />
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="tnum truncate font-medium text-fg" title={q.name}>
                {q.name}
              </span>
              {q.isDeadLetter && (
                <Badge tone="down" className="shrink-0">
                  DLQ
                </Badge>
              )}
              {!q.isDeadLetter && q.hasDeadLetterConfigured && (
                <Badge className="shrink-0">DLX</Badge>
              )}
              {cats?.has('backlog') && (
                <Badge tone="degraded" className="shrink-0">
                  birikme
                </Badge>
              )}
              {cats?.has('skip') && (
                <Badge tone="degraded" className="shrink-0">
                  skip
                </Badge>
              )}
            </div>
            <span className="tnum text-[11px] text-fg-subtle">{q.virtualHost}</span>
          </div>
        </div>
      </Td>
      <Td>
        <Badge tone={rabbitStateTone(q.state)}>{q.state}</Badge>
      </Td>
      <Td numeric>{formatCount(q.messages)}</Td>
      <Td numeric>{formatCount(q.messagesReady)}</Td>
      <Td numeric>
        <span className={cn(q.messagesUnacknowledged > 0 && 'text-status-degraded')}>
          {formatCount(q.messagesUnacknowledged)}
        </span>
      </Td>
      <Td numeric>
        <span className={cn(q.consumers === 0 && q.messagesReady > 0 && 'text-status-down')}>
          {formatCount(q.consumers)}
        </span>
      </Td>
      <Td numeric>{formatRate(q.publishRate)}</Td>
      <Td numeric>{formatRate(q.deliverRate)}</Td>
    </Tr>
  );
}
