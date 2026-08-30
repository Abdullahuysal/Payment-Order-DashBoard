import { useState } from 'react';
import { Pencil, Play, Trash2 } from 'lucide-react';

import { Badge, Card, CardBody, CardHeader } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatRelative } from '@/lib/format';

import {
  useDeleteHealthCheck,
  useRunHealthCheck,
  useUpdateHealthCheck,
} from '../hooks/useHealthChecks';
import { toUpdateRequest } from '../mapping';
import {
  HEALTH_GROUP_LABEL,
  HEALTH_PROBE_LABEL,
  type HealthCheck,
  type HealthProbeResult,
  type HealthProbeStatus,
} from '../types';
import { CheckDialog } from './CheckDialog';

const DOT_CLASS: Record<HealthProbeStatus, string> = {
  up: 'bg-status-up',
  down: 'bg-status-down',
  error: 'bg-status-down',
  skipped: 'bg-status-unknown',
};

const TONE: Record<HealthProbeStatus, 'up' | 'down' | 'neutral'> = {
  up: 'up',
  down: 'down',
  error: 'down',
  skipped: 'neutral',
};

export interface ServiceCardProps {
  check: HealthCheck;
  probe?: HealthProbeResult | undefined;
}

export function ServiceCard({ check, probe }: ServiceCardProps) {
  const update = useUpdateHealthCheck();
  const remove = useDeleteHealthCheck();
  const run = useRunHealthCheck();
  const busy = update.isPending || remove.isPending;
  const running = run.isPending;

  const [editing, setEditing] = useState(false);

  const headerCount = check.headers ? Object.keys(check.headers).length : 0;
  const failure = update.error ?? remove.error ?? run.error;

  function toggleEnabled() {
    update.mutate({ id: check.id, input: toUpdateRequest(check, { isEnabled: !check.isEnabled }) });
  }

  return (
    <>
      <Card className={cn('flex h-64 flex-col', busy && 'opacity-60')}>
        <CardHeader className="h-[3.25rem] flex-none items-center py-0">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                'inline-block h-2.5 w-2.5 shrink-0 rounded-full',
                running && 'animate-pulse',
                probe ? DOT_CLASS[probe.status] : 'bg-status-unknown',
                !check.isEnabled && 'opacity-40',
              )}
              title={probe ? HEALTH_PROBE_LABEL[probe.status] : 'henüz test edilmedi'}
            />
            <span className="truncate text-sm font-semibold text-fg" title={check.name}>
              {check.name}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2.5 text-fg-subtle">
            <button
              onClick={() => run.mutate(check.id)}
              disabled={running || busy}
              className="hover:text-fg-muted disabled:opacity-40"
              title="Bu isteği şimdi gönder"
              aria-label={`${check.name} test et`}
            >
              <Play size={13} className={cn(running && 'animate-pulse')} />
            </button>
            <button
              onClick={() => setEditing(true)}
              disabled={busy}
              className="hover:text-fg-muted disabled:opacity-40"
              title="Düzenle"
              aria-label={`${check.name} düzenle`}
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => remove.mutate(check.id)}
              disabled={busy}
              className="hover:text-status-down disabled:opacity-40"
              title="Kaldır"
              aria-label={`${check.name} kaldır`}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </CardHeader>

        <CardBody className="flex min-h-0 flex-1 flex-col gap-2">
          <div className="flex h-5 flex-none items-center gap-1.5 overflow-hidden">
            <Badge>{HEALTH_GROUP_LABEL[check.group]}</Badge>
            <Badge mono>{check.method}</Badge>
            <Badge mono>beklenen {check.expectedStatus}</Badge>
            {check.source === 'builtin' && <Badge tone="logs">Yerleşik</Badge>}
          </div>

          <p
            className="tnum h-7 flex-none truncate rounded border border-border bg-bg px-2 py-1 text-xs leading-5 text-fg-muted"
            title={check.url}
          >
            {check.url}
          </p>

          <div className="h-[3.25rem] flex-none">
            <ProbeSummary probe={probe} />
          </div>

          <div className="mt-auto flex flex-none items-center justify-between gap-2 text-[11px] text-fg-subtle">
            <button
              onClick={toggleEnabled}
              disabled={busy}
              className="shrink-0 hover:text-fg-muted disabled:opacity-40"
              title={check.isEnabled ? 'Devre dışı bırak' : 'Etkinleştir'}
            >
              {check.isEnabled ? 'aktif' : 'pasif'}
            </button>
            <span className="shrink-0">{headerCount} header</span>
            <span className="truncate">güncellendi {formatRelative(check.updatedAt)}</span>
          </div>

          {failure instanceof Error && (
            <p
              className="line-clamp-1 flex-none text-[11px] text-status-down"
              title={failure.message}
            >
              {failure.message}
            </p>
          )}
        </CardBody>
      </Card>

      {editing && <CheckDialog check={check} onClose={() => setEditing(false)} />}
    </>
  );
}

function ProbeSummary({ probe }: { probe?: HealthProbeResult | undefined }) {
  if (!probe) {
    return (
      <p className="text-[11px] text-fg-subtle">Henüz test edilmedi — durum için testi çalıştır.</p>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 overflow-hidden">
        <Badge tone={TONE[probe.status]}>{HEALTH_PROBE_LABEL[probe.status]}</Badge>
        {probe.httpStatus !== undefined && (
          <Badge mono tone={TONE[probe.status]}>
            HTTP {probe.httpStatus}
          </Badge>
        )}
        <span className="tnum shrink-0 text-[11px] text-fg-subtle">{probe.durationMs} ms</span>
        <span className="truncate text-[11px] text-fg-subtle">
          {formatRelative(probe.checkedAt)}
        </span>
      </div>
      {probe.error && (
        <p className="line-clamp-2 text-[11px] leading-snug text-status-down" title={probe.error}>
          {probe.error}
        </p>
      )}
    </div>
  );
}
