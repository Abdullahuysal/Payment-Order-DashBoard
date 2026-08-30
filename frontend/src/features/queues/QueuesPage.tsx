import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';

import { useAppStore } from '@/app/store';
import { Button, Segmented } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatRelative } from '@/lib/format';
import { ENV_LABELS } from '@/services/config';

import { AlertsPanel } from './components/AlertsPanel';
import { BrokerStatusStrip } from './components/BrokerStatusStrip';
import { DeadLetterPanel } from './components/DeadLetterPanel';
import { KafkaTab } from './components/KafkaTab';
import { RabbitTab } from './components/RabbitTab';
import { ScopeBar } from './components/ScopeBar';
import { queueKeys, RefreshContext, useBrokers } from './hooks/useQueues';
import { brokerPhase } from './lib';
import { BROKER_LABEL, type BrokerKind } from './types';

type Tab = BrokerKind;
type RefreshChoice = 'off' | '10' | '30';

const REFRESH_MS: Record<RefreshChoice, number | false> = {
  off: false,
  '10': 10_000,
  '30': 30_000,
};

export default function QueuesPage() {
  const [choice, setChoice] = useState<RefreshChoice>('off');

  return (
    <RefreshContext.Provider value={REFRESH_MS[choice]}>
      <QueuesView choice={choice} onChoice={setChoice} />
    </RefreshContext.Provider>
  );
}

function QueuesView({
  choice,
  onChoice,
}: {
  choice: RefreshChoice;
  onChoice: (c: RefreshChoice) => void;
}) {
  const env = useAppStore((s) => s.environment);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('rabbitmq');

  const brokers = useBrokers();
  const byBroker = new Map((brokers.data ?? []).map((b) => [b.broker, b]));
  const rabbitPhase = brokerPhase(byBroker.get('rabbitmq'));
  const kafkaPhase = brokerPhase(byBroker.get('kafka'));

  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 5_000);
    return () => clearInterval(id);
  }, []);

  const refreshAll = () => void queryClient.invalidateQueries({ queryKey: queueKeys.all });

  const anyFetching = brokers.isFetching;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-fg">Mesaj Kuyrukları &amp; DLQ</h1>
          <p className="mt-0.5 text-xs text-fg-muted">
            <span className="text-fg">{ENV_LABELS[env]}</span> ortamındaki RabbitMQ ve Kafka izleme
            — <span className="text-fg-subtle">salt-okunur</span>. Ops API’ye{' '}
            <span className="tnum">X-Environment</span> başlığıyla gidilir.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span role="status" aria-live="polite" className="text-[11px] text-fg-subtle">
            {brokers.dataUpdatedAt
              ? `güncellendi ${formatRelative(new Date(brokers.dataUpdatedAt))}`
              : 'yükleniyor…'}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-fg-subtle">otomatik</span>
            <Segmented<RefreshChoice>
              ariaLabel="Otomatik yenileme aralığı"
              size="sm"
              value={choice}
              onChange={onChoice}
              options={[
                { value: 'off', label: 'Kapalı' },
                { value: '10', label: '10 sn' },
                { value: '30', label: '30 sn' },
              ]}
            />
          </div>
          <Button size="sm" onClick={refreshAll} disabled={anyFetching}>
            <RefreshCw size={13} className={cn(anyFetching && 'motion-safe:animate-spin')} />
            Yenile
          </Button>
        </div>
      </header>

      <BrokerStatusStrip
        brokers={brokers.data}
        isLoading={brokers.isLoading}
        updatedAt={brokers.dataUpdatedAt || undefined}
      />

      <ScopeBar />

      <div className="grid gap-3 lg:grid-cols-2">
        <AlertsPanel />
        <DeadLetterPanel />
      </div>

      <div className="space-y-3">
        <Segmented<Tab>
          ariaLabel="Broker sekmesi"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'rabbitmq', label: BROKER_LABEL.rabbitmq },
            { value: 'kafka', label: BROKER_LABEL.kafka },
          ]}
        />

        {tab === 'rabbitmq' ? <RabbitTab phase={rabbitPhase} /> : <KafkaTab phase={kafkaPhase} />}
      </div>
    </div>
  );
}
