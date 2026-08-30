import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatCompact, formatCount } from '@/lib/format';

import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useKafkaTopics } from '../hooks/useQueues';
import type { KafkaTopic } from '../types';
import { FilterToggle, SearchField } from './filters';
import { KafkaTopicDrawer } from './KafkaTopicDrawer';
import { PanelEmpty, PanelError, TableSkeleton } from './panels';
import { Pagination } from './Pagination';
import { TableFrame, Td, Th, Tr } from './table';

const COLS = 5;

export function KafkaTopicsTable() {
  const [search, setSearch] = useState('');
  const nameContains = useDebouncedValue(search.trim(), 300);
  const [includeInternal, setIncludeInternal] = useState(false);
  const [onlyProblems, setOnlyProblems] = useState(false);
  const [deadLetterOnly, setDeadLetterOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [nameContains, includeInternal, onlyProblems, deadLetterOnly, pageSize]);

  const params = {
    ...(nameContains ? { nameContains } : {}),
    ...(includeInternal ? { includeInternal: true } : {}),
    ...(onlyProblems ? { onlyProblems: true } : {}),
    ...(deadLetterOnly ? { deadLetterOnly: true } : {}),
    page,
    pageSize,
  };

  const { data, isLoading, isFetching, isError, error, refetch } = useKafkaTopics(params, true);
  const rows = data?.items ?? [];

  return (
    <div className="rounded-lg border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <SearchField
          value={search}
          onChange={setSearch}
          label="Topic adında ara"
          placeholder="topic adı içerir…"
        />
        <FilterToggle active={onlyProblems} onToggle={() => setOnlyProblems((v) => !v)}>
          Sadece sorunlu
        </FilterToggle>
        <FilterToggle active={deadLetterOnly} onToggle={() => setDeadLetterOnly((v) => !v)}>
          Sadece DLQ
        </FilterToggle>
        <FilterToggle active={includeInternal} onToggle={() => setIncludeInternal((v) => !v)}>
          Dahili topic'ler
        </FilterToggle>
      </div>

      {isError ? (
        <PanelError error={error} onRetry={() => void refetch()} isRetrying={isFetching} />
      ) : isLoading ? (
        <TableSkeleton cols={COLS} />
      ) : rows.length === 0 ? (
        <PanelEmpty message="Filtreye uyan topic yok." />
      ) : (
        <div className={cn(isFetching && 'opacity-60 transition-opacity')}>
          <TableFrame>
            <thead>
              <tr>
                <Th>Topic</Th>
                <Th numeric>Partition</Th>
                <Th numeric>Replica</Th>
                <Th numeric>~Mesaj</Th>
                <Th>Etiket</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <TopicRow key={t.name} t={t} onOpen={() => setSelected(t.name)} />
              ))}
            </tbody>
          </TableFrame>
          {data && (
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              totalCount={data.totalCount}
              pageSize={data.pageSize}
              onPage={setPage}
              onPageSize={setPageSize}
              busy={isFetching}
            />
          )}
        </div>
      )}

      {selected && <KafkaTopicDrawer name={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function TopicRow({ t, onOpen }: { t: KafkaTopic; onOpen: () => void }) {
  return (
    <Tr onClick={onOpen} ariaLabel={`${t.name} topic'inin detayını aç`}>
      <Td>
        <span className="tnum truncate font-medium text-fg" title={t.name}>
          {t.name}
        </span>
      </Td>
      <Td numeric>{formatCount(t.partitions)}</Td>
      <Td numeric>{t.replicationFactor != null ? formatCount(t.replicationFactor) : '—'}</Td>
      <Td numeric>
        {t.approxMessageCount < 0 ? (
          <span className="text-fg-subtle" title="Kesin sayı için satıra tıklayıp detayı açın">
            detayda
          </span>
        ) : (
          formatCompact(t.approxMessageCount)
        )}
      </Td>
      <Td>
        <div className="flex flex-wrap gap-1">
          {t.isDeadLetter && <Badge tone="down">DLQ</Badge>}
          {t.isInternal && <Badge>dahili</Badge>}
          {t.hasProblems && <Badge tone="degraded">sorun</Badge>}
        </div>
      </Td>
    </Tr>
  );
}
