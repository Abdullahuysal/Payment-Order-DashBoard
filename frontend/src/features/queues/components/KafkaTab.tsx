import { useState } from 'react';
import { Info } from 'lucide-react';

import { Segmented } from '@/components/ui';

import { useQueueScope } from '../hooks/useScope';
import { type BrokerPhase } from '../lib';
import { KafkaGroupsTable } from './KafkaGroupsTable';
import { KafkaTopicsTable } from './KafkaTopicsTable';
import { PanelUnavailable } from './panels';

type View = 'topics' | 'groups';

export function KafkaTab({ phase }: { phase: BrokerPhase }) {
  const [view, setView] = useState<View>('topics');
  const scope = useQueueScope();

  return (
    <div className="space-y-3">
      <Segmented<View>
        ariaLabel="Kafka görünümü"
        size="sm"
        value={view}
        onChange={setView}
        options={[
          { value: 'topics', label: "Topic'ler" },
          { value: 'groups', label: 'Tüketici grupları' },
        ]}
      />

      {scope.active && (
        <p className="flex items-start gap-1.5 rounded-md border border-border bg-surface-2/40 px-2.5 py-2 text-[11px] text-fg-muted">
          <Info size={12} className="mt-0.5 shrink-0" />
          Alan kapsamı şu an yalnızca RabbitMQ kuyruklarına, uyarılara ve dead-letter özetine
          uygulanıyor.
        </p>
      )}

      {phase !== 'ok' ? (
        <div className="rounded-lg border border-border bg-surface">
          <PanelUnavailable phase={phase} brokerLabel="Kafka" />
        </div>
      ) : view === 'topics' ? (
        <KafkaTopicsTable />
      ) : (
        <KafkaGroupsTable />
      )}
    </div>
  );
}
