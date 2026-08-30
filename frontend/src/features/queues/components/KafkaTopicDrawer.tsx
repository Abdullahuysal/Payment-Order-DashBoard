import { useState } from 'react';
import { Eye, Info, RefreshCw } from 'lucide-react';

import { Badge, Button, Drawer } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatCount, formatRelative } from '@/lib/format';

import { useKafkaMessages, useKafkaTopic } from '../hooks/useQueues';
import type { KafkaMessagePreview } from '../types';
import { CodeBlock, KeyValueList, Section, Stat, StatGrid } from './kit';
import { TableFrame, Td, Th, Tr } from './table';

const PREVIEW_COUNT = 10;

export function KafkaTopicDrawer({ name, onClose }: { name: string; onClose: () => void }) {
  const [previewOn, setPreviewOn] = useState(false);
  const [partition, setPartition] = useState<number | ''>('');

  const detail = useKafkaTopic(name, true);
  const messages = useKafkaMessages(
    name,
    { count: PREVIEW_COUNT, ...(partition === '' ? {} : { partition }) },
    previewOn,
  );

  const d = detail.data;
  const totalMessages =
    d?.messageCount ?? d?.partitions.reduce((sum, p) => sum + (p.messageCount ?? 0), 0) ?? 0;

  return (
    <Drawer
      open
      onClose={onClose}
      width="lg"
      title={<span className="tnum">{name}</span>}
      subtitle={d ? `${d.partitions.length} partition` : 'topic detayı'}
      actions={
        <Button
          size="sm"
          variant="ghost"
          onClick={() => void detail.refetch()}
          disabled={detail.isFetching}
          aria-label="Yenile"
        >
          <RefreshCw size={12} className={cn(detail.isFetching && 'motion-safe:animate-spin')} />
        </Button>
      }
    >
      <div className="space-y-5">
        {detail.isLoading ? (
          <p className="text-xs text-fg-subtle">Topic detayı yükleniyor…</p>
        ) : detail.isError ? (
          <p role="alert" className="text-xs text-status-down">
            Detay alınamadı: {detail.error instanceof Error ? detail.error.message : 'hata'}
          </p>
        ) : d ? (
          <>
            <Section title="Özet">
              <StatGrid>
                <Stat label="Partition" value={formatCount(d.partitions.length)} />
                <Stat label="Mesaj" value={formatCount(totalMessages)} />
                {d.isInternal && <Stat label="Tür" value="dahili" />}
              </StatGrid>
            </Section>

            <Section title="Partition'lar">
              <div className="rounded-md border border-border">
                <TableFrame>
                  <thead>
                    <tr>
                      <Th numeric>#</Th>
                      <Th numeric>Low</Th>
                      <Th numeric>High</Th>
                      <Th numeric>Mesaj</Th>
                      <Th numeric>Lider</Th>
                      <Th>ISR</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...d.partitions]
                      .sort((a, b) => a.partition - b.partition)
                      .map((p) => {
                        const replicaCount = p.replicas?.length ?? p.isr.length;
                        const underReplicated = p.isr.length < replicaCount;
                        return (
                          <Tr key={p.partition}>
                            <Td numeric>{p.partition}</Td>
                            <Td numeric>{formatCount(p.lowWatermark)}</Td>
                            <Td numeric>{formatCount(p.highWatermark)}</Td>
                            <Td numeric>{formatCount(p.messageCount)}</Td>
                            <Td numeric>{p.leader != null ? p.leader : '—'}</Td>
                            <Td>
                              <span
                                className={cn(
                                  'tnum',
                                  underReplicated ? 'text-status-down' : 'text-fg-muted',
                                )}
                              >
                                {p.isr.length}/{replicaCount}
                              </span>
                            </Td>
                          </Tr>
                        );
                      })}
                  </tbody>
                </TableFrame>
              </div>
            </Section>
          </>
        ) : null}

        <Section title="Mesaj önizleme">
          <div className="flex items-start gap-1.5 rounded-md border border-border bg-surface-2/40 px-2.5 py-2 text-[11px] text-fg-muted">
            <Info size={12} className="mt-0.5 shrink-0" />
            <span>
              Kuyruğun <strong>sonundan</strong> okunur, offset <strong>commit edilmez</strong> —
              tüketici grubunun konumu etkilenmez.
            </span>
          </div>

          <div className="mt-2 flex items-center gap-2">
            {d && d.partitions.length > 1 && (
              <label className="flex items-center gap-1.5 text-[11px] text-fg-subtle">
                partition
                <select
                  value={partition}
                  onChange={(e) =>
                    setPartition(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="tnum rounded border border-border bg-bg px-1.5 py-0.5 text-xs text-fg focus:outline-none"
                >
                  <option value="">hepsi</option>
                  {[...d.partitions]
                    .sort((a, b) => a.partition - b.partition)
                    .map((p) => (
                      <option key={p.partition} value={p.partition}>
                        {p.partition}
                      </option>
                    ))}
                </select>
              </label>
            )}
            {!previewOn ? (
              <Button size="sm" onClick={() => setPreviewOn(true)}>
                <Eye size={12} />
                Son {PREVIEW_COUNT} mesajı getir
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void messages.refetch()}
                disabled={messages.isFetching}
              >
                <RefreshCw
                  size={12}
                  className={cn(messages.isFetching && 'motion-safe:animate-spin')}
                />
                Yeniden getir
              </Button>
            )}
          </div>

          {previewOn &&
            (messages.isLoading ? (
              <p className="mt-2 text-xs text-fg-subtle">Mesajlar getiriliyor…</p>
            ) : messages.isError ? (
              <p role="alert" className="mt-2 text-xs text-status-down">
                Önizleme alınamadı:{' '}
                {messages.error instanceof Error ? messages.error.message : 'hata'}
              </p>
            ) : (messages.data?.length ?? 0) === 0 ? (
              <p className="mt-2 text-xs text-fg-muted">Bu aralıkta mesaj yok.</p>
            ) : (
              <ol className="mt-2 space-y-2.5">
                {messages.data?.map((msg, i) => (
                  <MessageCard key={`${msg.partition}-${msg.offset}-${i}`} msg={msg} />
                ))}
              </ol>
            ))}
        </Section>
      </div>
    </Drawer>
  );
}

function MessageCard({ msg }: { msg: KafkaMessagePreview }) {
  return (
    <li className="rounded-md border border-border">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-2.5 py-1.5 text-[11px]">
        <Badge className="tnum">p{msg.partition}</Badge>
        <Badge className="tnum">offset {msg.offset}</Badge>
        {msg.key != null && (
          <span className="tnum truncate text-fg-subtle" title={msg.key}>
            key: {msg.key || '(null)'}
          </span>
        )}
        {msg.timestamp && (
          <span className="tnum ml-auto text-fg-subtle">{formatRelative(msg.timestamp)}</span>
        )}
      </div>
      <div className="space-y-2 px-2.5 py-2">
        <div>
          <p className="mb-1 text-[11px] text-fg-subtle">value</p>
          <CodeBlock text={msg.value} />
        </div>
        {msg.headers && Object.keys(msg.headers).length > 0 && (
          <details>
            <summary className="cursor-pointer text-[11px] text-fg-subtle hover:text-fg-muted">
              header'lar ({Object.keys(msg.headers).length})
            </summary>
            <div className="mt-1.5">
              <KeyValueList data={msg.headers} />
            </div>
          </details>
        )}
      </div>
    </li>
  );
}
