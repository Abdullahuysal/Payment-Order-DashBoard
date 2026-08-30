import { useState } from 'react';
import { Eye, Info, RefreshCw } from 'lucide-react';

import { Badge, Button, Drawer } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatCount, formatRate, formatRelative } from '@/lib/format';

import { useRabbitMessages, useRabbitQueue } from '../hooks/useQueues';
import { rabbitStateTone, resolveDeaths } from '../lib';
import type { RabbitMessagePreview } from '../types';
import { CodeBlock, KeyValueList, Section, Stat, StatGrid } from './kit';

const PREVIEW_COUNT = 10;

export function RabbitQueueDrawer({
  vhost,
  name,
  onClose,
}: {
  vhost: string;
  name: string;
  onClose: () => void;
}) {
  const [previewOn, setPreviewOn] = useState(false);
  const detail = useRabbitQueue(vhost, name, true);
  const messages = useRabbitMessages(vhost, name, PREVIEW_COUNT, previewOn);

  const q = detail.data;

  return (
    <Drawer
      open
      onClose={onClose}
      width="lg"
      title={<span className="tnum">{name}</span>}
      subtitle={<span className="tnum">vhost {vhost}</span>}
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
          <p className="text-xs text-fg-subtle">Kuyruk detayı yükleniyor…</p>
        ) : detail.isError ? (
          <p role="alert" className="text-xs text-status-down">
            Detay alınamadı: {detail.error instanceof Error ? detail.error.message : 'hata'}
          </p>
        ) : q ? (
          <>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone={rabbitStateTone(q.state)}>{q.state}</Badge>
              {q.isDeadLetter && <Badge tone="down">DLQ</Badge>}
              {q.hasDeadLetterConfigured && <Badge>DLX bağlı</Badge>}
              {q.idleSince && (
                <span className="text-[11px] text-fg-subtle">
                  boşta {formatRelative(q.idleSince)}
                </span>
              )}
            </div>

            <Section title="Mesajlar">
              <StatGrid>
                <Stat label="Toplam" value={formatCount(q.messages)} />
                <Stat label="Hazır" value={formatCount(q.messagesReady)} />
                <Stat
                  label="Unacked"
                  value={formatCount(q.messagesUnacknowledged)}
                  tone={q.messagesUnacknowledged > 0 ? 'degraded' : undefined}
                />
              </StatGrid>
            </Section>

            <Section title="Akış">
              <StatGrid>
                <Stat
                  label="Tüketici"
                  value={formatCount(q.consumers)}
                  tone={q.consumers === 0 && q.messagesReady > 0 ? 'down' : undefined}
                />
                <Stat label="Publish/s" value={formatRate(q.publishRate)} />
                <Stat label="Deliver/s" value={formatRate(q.deliverRate)} />
                <Stat
                  label="Redeliver/s"
                  value={formatRate(q.redeliverRate)}
                  tone={q.redeliverRate > 0 ? 'degraded' : undefined}
                />
              </StatGrid>
            </Section>
          </>
        ) : null}

        <Section title="Mesaj önizleme">
          <div className="flex items-start gap-1.5 rounded-md border border-status-degraded/30 bg-status-degraded/5 px-2.5 py-2 text-[11px] text-status-degraded">
            <Info size={12} className="mt-0.5 shrink-0" />
            <span>
              Önizleme mesajları <strong>tüketmeden</strong> okur ama kuyruğa{' '}
              <strong>requeue</strong> eder; sıra başındaki mesajların pozisyonu değişebilir.
            </span>
          </div>

          {!previewOn ? (
            <Button size="sm" onClick={() => setPreviewOn(true)} className="mt-2">
              <Eye size={12} />
              Son {PREVIEW_COUNT} mesajı getir
            </Button>
          ) : messages.isLoading ? (
            <p className="mt-2 text-xs text-fg-subtle">Mesajlar getiriliyor…</p>
          ) : messages.isError ? (
            <p role="alert" className="mt-2 text-xs text-status-down">
              Önizleme alınamadı:{' '}
              {messages.error instanceof Error ? messages.error.message : 'hata'}
            </p>
          ) : (messages.data?.length ?? 0) === 0 ? (
            <p className="mt-2 text-xs text-fg-muted">Kuyrukta önizlenecek mesaj yok.</p>
          ) : (
            <ol className="mt-2 space-y-2.5">
              {messages.data?.map((msg, i) => (
                <MessageCard key={i} index={i} msg={msg} />
              ))}
            </ol>
          )}
        </Section>
      </div>
    </Drawer>
  );
}

function MessageCard({ index, msg }: { index: number; msg: RabbitMessagePreview }) {
  const deaths = resolveDeaths(msg);
  return (
    <li className="rounded-md border border-border">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-2.5 py-1.5 text-[11px]">
        <span className="tnum font-semibold text-fg-subtle">#{index + 1}</span>
        {msg.routingKey && <Badge className="tnum">rk: {msg.routingKey}</Badge>}
        {msg.exchange != null && <Badge className="tnum">ex: {msg.exchange || '(default)'}</Badge>}
        {msg.redelivered && <Badge tone="degraded">redelivered</Badge>}
        {msg.payloadBytes != null && (
          <span className="tnum ml-auto text-fg-subtle">{formatCount(msg.payloadBytes)} B</span>
        )}
      </div>

      <div className="space-y-2 px-2.5 py-2">
        {deaths.length > 0 && (
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-status-down">
              x-death
            </p>
            <ul className="space-y-1">
              {deaths.map((d, i) => (
                <li
                  key={i}
                  className="tnum rounded border border-status-down/30 bg-status-down/5 px-2 py-1 text-[11px] text-fg-muted"
                >
                  <span className="text-status-down">{d.reason ?? 'bilinmiyor'}</span>
                  {d.count != null && <> ×{d.count}</>}
                  {d.queue && <> · {d.queue}</>}
                  {d.time && <> · {formatRelative(d.time)}</>}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <p className="mb-1 text-[11px] text-fg-subtle">payload</p>
          <CodeBlock text={msg.payload} />
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
