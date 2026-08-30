import { useState } from 'react';

import { Badge } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatCount } from '@/lib/format';

import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useKafkaConsumerGroups } from '../hooks/useQueues';
import { consumerStateTone, groupHasProblem, lagTone } from '../lib';
import type { KafkaConsumerGroup } from '../types';
import { FilterToggle, SearchField } from './filters';
import { KafkaGroupDrawer } from './KafkaGroupDrawer';
import { PanelEmpty, PanelError, TableSkeleton } from './panels';
import { TableFrame, Td, Th, Tr } from './table';

const TONE_TEXT = {
  neutral: 'text-fg',
  up: 'text-status-up',
  degraded: 'text-status-degraded',
  down: 'text-status-down',
} as const;

export function KafkaGroupsTable() {
  const [search, setSearch] = useState('');
  const groupContains = useDebouncedValue(search.trim(), 300);
  const [onlyLagging, setOnlyLagging] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const params = {
    ...(groupContains ? { groupContains } : {}),
    ...(onlyLagging ? { onlyLagging: true } : {}),
  };

  const { data, isLoading, isFetching, isError, error, refetch } = useKafkaConsumerGroups(
    params,
    true,
  );
  const rows = data ?? [];

  return (
    <div className="rounded-lg border border-border bg-surface">
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <SearchField
          value={search}
          onChange={setSearch}
          label="Grup adında ara"
          placeholder="grup adı içerir…"
        />
        <FilterToggle active={onlyLagging} onToggle={() => setOnlyLagging((v) => !v)}>
          Sadece lag'li
        </FilterToggle>
      </div>

      {isError ? (
        <PanelError error={error} onRetry={() => void refetch()} isRetrying={isFetching} />
      ) : isLoading ? (
        <TableSkeleton cols={5} />
      ) : rows.length === 0 ? (
        <PanelEmpty message="Filtreye uyan tüketici grubu yok." />
      ) : (
        <div className={cn(isFetching && 'opacity-60 transition-opacity')}>
          <TableFrame>
            <thead>
              <tr>
                <Th>Grup</Th>
                <Th>Durum</Th>
                <Th numeric>Üye</Th>
                <Th numeric>Toplam lag</Th>
                <Th numeric>Topic</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((g) => (
                <GroupRow key={g.groupId} g={g} onOpen={() => setSelected(g.groupId)} />
              ))}
            </tbody>
          </TableFrame>
        </div>
      )}

      {selected && <KafkaGroupDrawer groupId={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function GroupRow({ g, onOpen }: { g: KafkaConsumerGroup; onOpen: () => void }) {
  const problem = groupHasProblem(g);
  return (
    <Tr onClick={onOpen} ariaLabel={`${g.groupId} grubunun detayını aç`}>
      <Td>
        <div className="flex items-center gap-2">
          {problem && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-status-degraded" />}
          <span className="tnum truncate font-medium text-fg" title={g.groupId}>
            {g.groupId}
          </span>
          {g.isSimple && <Badge className="shrink-0">simple</Badge>}
        </div>
      </Td>
      <Td>
        <Badge tone={consumerStateTone(g.state)}>{g.state}</Badge>
      </Td>
      <Td numeric>
        <span className={cn(g.members === 0 && 'text-status-down')}>{formatCount(g.members)}</span>
      </Td>
      <Td numeric>
        <span className={TONE_TEXT[lagTone(g.totalLag)]}>{formatCount(g.totalLag)}</span>
      </Td>
      <Td numeric>{formatCount(g.topics.length)}</Td>
    </Tr>
  );
}
