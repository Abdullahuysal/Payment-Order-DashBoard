import { RefreshCw } from 'lucide-react';

import { Badge, Button, Drawer } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatCount } from '@/lib/format';

import { useKafkaConsumerGroup } from '../hooks/useQueues';
import { consumerStateTone, lagTone } from '../lib';
import type { KafkaGroupPartition } from '../types';
import { Section, Stat, StatGrid } from './kit';
import { TableFrame, Td, Th, Tr } from './table';

const TONE_TEXT = {
  neutral: 'text-fg',
  up: 'text-status-up',
  degraded: 'text-status-degraded',
  down: 'text-status-down',
} as const;

export function KafkaGroupDrawer({ groupId, onClose }: { groupId: string; onClose: () => void }) {
  const {
    data: g,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useKafkaConsumerGroup(groupId, true);

  const byTopic = new Map<string, KafkaGroupPartition[]>();
  for (const p of g?.partitions ?? []) {
    const list = byTopic.get(p.topic) ?? [];
    list.push(p);
    byTopic.set(p.topic, list);
  }

  return (
    <Drawer
      open
      onClose={onClose}
      width="lg"
      title={<span className="tnum">{groupId}</span>}
      subtitle="tüketici grubu detayı"
      actions={
        <Button
          size="sm"
          variant="ghost"
          onClick={() => void refetch()}
          disabled={isFetching}
          aria-label="Yenile"
        >
          <RefreshCw size={12} className={cn(isFetching && 'motion-safe:animate-spin')} />
        </Button>
      }
    >
      {isLoading ? (
        <p className="text-xs text-fg-subtle">Grup detayı yükleniyor…</p>
      ) : isError ? (
        <p role="alert" className="text-xs text-status-down">
          Detay alınamadı: {error instanceof Error ? error.message : 'hata'}
        </p>
      ) : g ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={consumerStateTone(g.state)}>{g.state}</Badge>
            {g.isSimple && <Badge>simple</Badge>}
          </div>

          <Section title="Özet">
            <StatGrid>
              <Stat
                label="Üye"
                value={formatCount(g.members.length)}
                tone={g.members.length === 0 ? 'down' : undefined}
              />
              <Stat label="Toplam lag" value={formatCount(g.totalLag)} tone={lagTone(g.totalLag)} />
              <Stat label="Topic" value={formatCount(byTopic.size)} />
            </StatGrid>
          </Section>

          <Section title="Partition lag'leri">
            {g.partitions.length === 0 ? (
              <p className="text-xs text-fg-subtle">Atanmış partition yok.</p>
            ) : (
              <div className="space-y-3">
                {[...byTopic.entries()].map(([topic, parts]) => (
                  <div key={topic} className="rounded-md border border-border">
                    <div className="border-b border-border px-2.5 py-1.5">
                      <span className="tnum text-[11px] font-medium text-fg" title={topic}>
                        {topic}
                      </span>
                    </div>
                    <TableFrame>
                      <thead>
                        <tr>
                          <Th numeric>#</Th>
                          <Th numeric>Committed</Th>
                          <Th numeric>High</Th>
                          <Th numeric>Lag</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...parts]
                          .sort((a, b) => a.partition - b.partition)
                          .map((p) => (
                            <Tr key={p.partition}>
                              <Td numeric>{p.partition}</Td>
                              <Td numeric>{formatCount(p.committedOffset)}</Td>
                              <Td numeric>{formatCount(p.highWatermark)}</Td>
                              <Td numeric>
                                <span className={TONE_TEXT[lagTone(p.lag)]}>
                                  {formatCount(p.lag)}
                                </span>
                              </Td>
                            </Tr>
                          ))}
                      </tbody>
                    </TableFrame>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title={`Üyeler (${g.members.length})`}>
            {g.members.length === 0 ? (
              <p className="text-xs text-fg-subtle">Aktif üye yok.</p>
            ) : (
              <ul className="space-y-1.5">
                {g.members.map((m) => (
                  <li
                    key={m.memberId}
                    className="rounded-md border border-border px-2.5 py-1.5 text-[11px]"
                  >
                    <div className="tnum truncate text-fg" title={m.memberId}>
                      {m.clientId ?? m.memberId}
                    </div>
                    <div className="tnum mt-0.5 text-fg-subtle">
                      {m.host && <span>{m.host}</span>}
                      {m.assignments?.length ? <span> · {m.assignments.length} atama</span> : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      ) : null}
    </Drawer>
  );
}
