import { BellOff } from 'lucide-react';

import { Badge, Card, CardBody, CardHeader, CardTitle } from '@/components/ui';
import { formatCount } from '@/lib/format';

import { useAlerts } from '../hooks/useQueues';
import { useQueueScope } from '../hooks/useScope';
import { SEVERITY_LABEL, SEVERITY_TONE, sortAlerts } from '../lib';
import { BROKER_LABEL } from '../types';

export function AlertsPanel() {
  const { data, isLoading, isError, error } = useAlerts();
  const scope = useQueueScope();
  const all = data ? sortAlerts(data) : [];
  const alerts = scope.active ? all.filter((a) => scope.match(a.resource)) : all;
  const hidden = all.length - alerts.length;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Uyarılar</CardTitle>
        {alerts.length > 0 && (
          <Badge mono tone={SEVERITY_TONE[alerts[0]!.severity]}>
            {formatCount(alerts.length)}
          </Badge>
        )}
      </CardHeader>

      <CardBody className="min-h-0 flex-1 p-0">
        {isLoading ? (
          <ul className="divide-y divide-border">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="h-12 animate-pulse bg-surface motion-reduce:animate-none" />
            ))}
          </ul>
        ) : isError ? (
          <p role="alert" className="px-4 py-6 text-center text-xs text-status-down">
            Uyarılar alınamadı: {error instanceof Error ? error.message : 'bilinmeyen hata'}
          </p>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <BellOff size={18} className="text-fg-subtle" />
            <p className="text-xs text-fg-muted">
              {hidden > 0
                ? `Kapsamındaki kaynaklarda uyarı yok (${hidden} kapsam dışı).`
                : 'Aktif uyarı yok.'}
            </p>
          </div>
        ) : (
          <ul className="max-h-72 divide-y divide-border overflow-y-auto">
            {hidden > 0 && (
              <li className="bg-surface-2/40 px-4 py-1.5 text-[11px] text-fg-subtle">
                {formatCount(hidden)} kapsam dışı uyarı gizlendi
              </li>
            )}
            {alerts.map((a, i) => (
              <li
                key={`${a.broker}-${a.resource}-${i}`}
                className="flex items-start gap-2.5 px-4 py-2.5"
              >
                <Badge tone={SEVERITY_TONE[a.severity]} className="mt-0.5 shrink-0">
                  {SEVERITY_LABEL[a.severity]}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-fg">{a.message}</p>
                  <p className="mt-0.5 truncate text-[11px] text-fg-subtle">
                    <span className="tnum">{BROKER_LABEL[a.broker]}</span> · {a.kind} ·{' '}
                    <span className="tnum">{a.resource}</span>
                    {a.value != null && (
                      <>
                        {' '}
                        · <span className="tnum text-fg-muted">{String(a.value)}</span>
                      </>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
