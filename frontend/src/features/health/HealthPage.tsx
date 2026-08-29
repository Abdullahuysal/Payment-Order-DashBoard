import { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';

import { useAppStore } from '@/app/store';
import { Badge, Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import { ENV_LABELS } from '@/services/config';

import { AddCheckDialog } from './components/AddCheckDialog';
import { ServiceCard } from './components/ServiceCard';
import { useHealthChecks } from './hooks/useHealthChecks';

export default function HealthPage() {
  const [addOpen, setAddOpen] = useState(false);
  const env = useAppStore((s) => s.environment);
  const { checks, summary, isLoading, isFetching, isError, error, refetch } = useHealthChecks();

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-fg">Servis Sağlığı</h1>
          <p className="mt-0.5 text-xs text-fg-muted">
            <span className="text-fg">{ENV_LABELS[env]}</span> ortamındaki alive tanımları. Ortam
            Topbar’dan seçilir; ops API’ye <span className="tnum">X-Environment</span> başlığıyla
            gönderilir.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {summary.total > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <Count label="toplam" value={summary.total} />
              <Count label="aktif" value={summary.enabled} tone="up" />
              <Count label="pasif" value={summary.disabled} />
            </div>
          )}
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
          Servis listesi alınamadı: {error?.message}
        </div>
      )}

      {isLoading ? (
        <SkeletonGrid />
      ) : checks.length === 0 && !isError ? (
        <EmptyState env={ENV_LABELS[env]} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {checks.map((check) => (
            <ServiceCard key={check.id} check={check} />
          ))}
        </div>
      )}

      {addOpen && <AddCheckDialog onClose={() => setAddOpen(false)} />}
    </div>
  );
}

function Count({ label, value, tone }: { label: string; value: number; tone?: 'up' }) {
  return (
    <Badge tone={tone === 'up' ? 'up' : 'neutral'} mono className="gap-1">
      {value}
      <span className="text-fg-subtle">{label}</span>
    </Badge>
  );
}

function EmptyState({ env }: { env: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-10 text-center">
      <p className="text-sm font-medium text-fg">{env} ortamında kayıtlı servis yok</p>
      <p className="mx-auto mt-1 max-w-md text-xs text-fg-muted">
        “Servis ekle” ile curl yapıştırıp ekleyebilir ya da doğrudan ops API’ye{' '}
        <span className="tnum">POST</span> atabilirsin (<span className="tnum">X-Environment</span>{' '}
        başlığıyla).
      </p>
    </div>
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
