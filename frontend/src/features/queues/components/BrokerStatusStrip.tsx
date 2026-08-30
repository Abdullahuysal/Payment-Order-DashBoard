import { CheckCircle2, CircleSlash, XCircle } from 'lucide-react';

import { cn } from '@/lib/cn';
import { formatRelative } from '@/lib/format';

import { BROKER_PHASE_LABEL, BROKER_PHASE_TONE, brokerPhase, type BrokerPhase } from '../lib';
import { BROKER_LABEL, type BrokerKind, type BrokerStatus } from '../types';

const PHASE_ICON: Record<BrokerPhase, typeof CheckCircle2> = {
  ok: CheckCircle2,
  unconfigured: CircleSlash,
  unreachable: XCircle,
};

const TONE_TEXT: Record<'neutral' | 'up' | 'degraded' | 'down', string> = {
  neutral: 'text-fg-subtle',
  up: 'text-status-up',
  degraded: 'text-status-degraded',
  down: 'text-status-down',
};

export function BrokerStatusStrip({
  brokers,
  isLoading,
  updatedAt,
}: {
  brokers: BrokerStatus[] | undefined;
  isLoading: boolean;
  updatedAt: number | undefined;
}) {
  const order: BrokerKind[] = ['rabbitmq', 'kafka'];
  const byBroker = new Map((brokers ?? []).map((b) => [b.broker, b]));

  return (
    <section aria-label="Broker durumu" className="grid gap-3 sm:grid-cols-2">
      {order.map((broker) => {
        const status = byBroker.get(broker);
        const phase = brokerPhase(status);
        const tone = BROKER_PHASE_TONE[phase];
        const Icon = PHASE_ICON[phase];

        return (
          <div key={broker} className="rounded-lg border border-border bg-surface px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-fg">{BROKER_LABEL[broker]}</span>
                  {status?.version && (
                    <span className="tnum text-[11px] text-fg-subtle">v{status.version}</span>
                  )}
                </div>
                <p className="mt-1 truncate text-xs text-fg-muted">
                  {isLoading && !status
                    ? 'Durum alınıyor…'
                    : (status?.error ?? status?.detail ?? phaseHint(phase))}
                </p>
              </div>
              <span
                className={cn('flex items-center gap-1.5 text-xs font-medium', TONE_TEXT[tone])}
              >
                <Icon size={14} />
                {BROKER_PHASE_LABEL[phase]}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-3 text-[11px] text-fg-subtle">
              <Flag label="configured" on={Boolean(status?.configured)} />
              <Flag label="reachable" on={Boolean(status?.reachable)} />
              {updatedAt && (
                <span className="ml-auto tnum">
                  güncellendi {formatRelative(new Date(updatedAt))}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function Flag({ label, on }: { label: string; on: boolean }) {
  return (
    <span className="flex items-center gap-1">
      <span className={cn('h-1.5 w-1.5 rounded-full', on ? 'bg-status-up' : 'bg-status-unknown')} />
      <span className="tnum">{label}</span>
    </span>
  );
}

function phaseHint(phase: BrokerPhase): string {
  if (phase === 'unconfigured') return 'Bu ortam için bağlantı tanımlı değil.';
  if (phase === 'unreachable') return 'Bağlantı tanımlı ama sağlık kontrolü başarısız.';
  return 'Bağlantı sağlıklı.';
}
