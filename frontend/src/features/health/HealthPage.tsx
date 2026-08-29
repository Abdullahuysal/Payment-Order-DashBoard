import { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';

import { Badge, Button } from '@/components/ui';
import { cn } from '@/lib/cn';

import { AddCheckDialog } from './components/AddCheckDialog';
import { ServiceCard } from './components/ServiceCard';
import { useHealthChecks } from './hooks/useHealthChecks';

export default function HealthPage() {
  const [addOpen, setAddOpen] = useState(false);
  const { rows, summary, isLoading, isFetching, isError, error, refetchIntervalMs, refetch } =
    useHealthChecks();

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-fg">Servis Sağlığı</h1>
          <p className="mt-0.5 text-xs text-fg-muted">
            Alive endpoint’e istek atılır; beklenen status → ayakta. Her{' '}
            <span className="tnum">{Math.round(refetchIntervalMs / 1000)}</span> sn’de bir
            yenilenir.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <Count tone="up" label="ayakta" value={summary.up} />
            <Count tone="degraded" label="sorunlu" value={summary.degraded} />
            <Count tone="down" label="kapalı" value={summary.down} />
          </div>
          <Button size="sm" onClick={refetch} disabled={isFetching}>
            <RefreshCw size={13} className={cn(isFetching && 'animate-spin')} />
            Yenile
          </Button>
          <Button size="sm" variant="primary" onClick={() => setAddOpen(true)}>
            <Plus size={13} />
            Servis ekle
          </Button>
        </div>
      </header>

      {isError && (
        <div className="rounded-lg border border-status-down/30 bg-surface px-4 py-3 text-xs text-status-down">
          Sağlık verisi alınamadı: {error?.message}
        </div>
      )}

      {isLoading ? (
        <SkeletonGrid />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <ServiceCard key={row.check.id} row={row} isRefreshing={isFetching} />
          ))}
        </div>
      )}

      <p className="text-[11px] text-fg-subtle">
        Faz 0 — sonuçlar tipli mock. Eklediğin servisler tarayıcıda saklanır; gerçek probe sonraki
        fazda ops backend’de koşar (<span className="tnum">features/health/api/health.api.ts</span>
        ).
      </p>

      <AddCheckDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

function Count({
  tone,
  label,
  value,
}: {
  tone: 'up' | 'degraded' | 'down';
  label: string;
  value: number;
}) {
  return (
    <Badge tone={tone} mono className="gap-1">
      {value}
      <span className="text-fg-subtle">{label}</span>
    </Badge>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-40 animate-pulse rounded-lg border border-border bg-surface" />
      ))}
    </div>
  );
}
