import { useEffect, useState } from 'react';
import { Check, Pencil, Trash2 } from 'lucide-react';

import { Badge, Card, CardBody, CardHeader } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatRelative } from '@/lib/format';

import { useDeleteHealthCheck, useUpdateHealthCheck } from '../hooks/useHealthChecks';
import { toUpdateRequest } from '../mapping';
import { HEALTH_GROUP_LABEL, type HealthCheck } from '../types';

export interface ServiceCardProps {
  check: HealthCheck;
}

export function ServiceCard({ check }: ServiceCardProps) {
  const update = useUpdateHealthCheck();
  const remove = useDeleteHealthCheck();
  const busy = update.isPending || remove.isPending;

  const headerCount = check.headers ? Object.keys(check.headers).length : 0;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(check.url);

  useEffect(() => {
    if (!editing) setDraft(check.url);
  }, [check.url, editing]);

  function commitUrl() {
    const next = draft.trim();
    setEditing(false);
    if (!next || next === check.url) return;
    update.mutate({ id: check.id, input: toUpdateRequest(check, { url: next }) });
  }

  function toggleEnabled() {
    update.mutate({ id: check.id, input: toUpdateRequest(check, { isEnabled: !check.isEnabled }) });
  }

  const mutationError = update.error ?? remove.error;

  return (
    <Card className={cn(busy && 'opacity-60')}>
      <CardHeader>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'inline-block h-2.5 w-2.5 shrink-0 rounded-full',
                check.isEnabled ? 'bg-status-up' : 'bg-status-unknown',
              )}
            />
            <span className="truncate text-sm font-semibold text-fg">{check.name}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge>{HEALTH_GROUP_LABEL[check.group]}</Badge>
            <Badge tone={check.source === 'custom' ? 'logs' : 'neutral'}>
              {check.source === 'custom' ? 'Özel' : 'Yerleşik'}
            </Badge>
            {check.method !== 'GET' && <Badge mono>{check.method}</Badge>}
            <Badge mono>beklenen {check.expectedStatus}</Badge>
            {headerCount > 0 && (
              <span className="text-[11px] text-fg-subtle">{headerCount} header</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={toggleEnabled}
            disabled={busy}
            className="text-[11px] text-fg-subtle hover:text-fg-muted disabled:opacity-40"
            title={check.isEnabled ? 'Devre dışı bırak' : 'Etkinleştir'}
          >
            {check.isEnabled ? 'aktif' : 'pasif'}
          </button>
          <button
            onClick={() => remove.mutate(check.id)}
            disabled={busy}
            className="text-fg-subtle hover:text-status-down disabled:opacity-40"
            title="Kaldır"
            aria-label={`${check.name} kaldır`}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </CardHeader>

      <CardBody className="space-y-2.5">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wide text-fg-subtle">URL</span>
            <button
              onClick={() => (editing ? commitUrl() : setEditing(true))}
              disabled={busy}
              className="flex items-center gap-1 text-[11px] text-fg-subtle hover:text-fg-muted disabled:opacity-40"
            >
              {editing ? <Check size={11} /> : <Pencil size={11} />}
              {editing ? 'kaydet' : 'düzenle'}
            </button>
          </div>

          {editing ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitUrl}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitUrl();
                if (e.key === 'Escape') setEditing(false);
              }}
              spellCheck={false}
              className="tnum w-full rounded border border-border-strong bg-bg px-2 py-1 text-xs text-fg focus:outline-none"
            />
          ) : (
            <p
              className="tnum truncate rounded border border-border bg-bg px-2 py-1 text-xs text-fg-muted"
              title={check.url}
            >
              {check.url}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-fg-subtle">
          <span className="tnum truncate">{check.method}</span>
          <span className="shrink-0">güncellendi {formatRelative(check.updatedAt)}</span>
        </div>

        {mutationError instanceof Error && (
          <p className="text-xs text-status-down">{mutationError.message}</p>
        )}
      </CardBody>
    </Card>
  );
}
