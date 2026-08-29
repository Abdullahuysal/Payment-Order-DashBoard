import { useEffect, useState } from 'react';
import { Check, Pencil, RotateCcw, Trash2 } from 'lucide-react';

import { Badge, Card, CardBody, CardHeader, StatusDot } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatLatency, formatRelative } from '@/lib/format';
import type { Status } from '@/types';

import { builtinAlivePath, isBuiltinPathOverridden } from '../checks';
import { useHealthConfigStore } from '../store';
import { HEALTH_GROUP_LABEL, type HealthRow } from '../types';

const STATUS_TONE: Record<Status, 'up' | 'degraded' | 'down' | 'neutral'> = {
  up: 'up',
  degraded: 'degraded',
  down: 'down',
  unknown: 'neutral',
};

export interface ServiceCardProps {
  row: HealthRow;
  isRefreshing: boolean;
}

export function ServiceCard({ row, isRefreshing }: ServiceCardProps) {
  const { check, health } = row;
  const isCustom = check.source === 'custom';

  const overrides = useHealthConfigStore((s) => s.overrides);
  const setOverride = useHealthConfigStore((s) => s.setOverride);
  const clearOverride = useHealthConfigStore((s) => s.clearOverride);
  const updateCustomCheck = useHealthConfigStore((s) => s.updateCustomCheck);
  const removeCustomCheck = useHealthConfigStore((s) => s.removeCustomCheck);

  const status: Status = health?.status ?? 'unknown';
  const headerCount = check.headers ? Object.keys(check.headers).length : 0;

  const editLabel = isCustom ? 'URL' : 'Alive path';
  const editValue = isCustom ? check.url : builtinAlivePath(check.id, overrides);
  const canReset = !isCustom && isBuiltinPathOverridden(check.id, overrides);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(editValue);

  useEffect(() => {
    if (!editing) setDraft(editValue);
  }, [editValue, editing]);

  function commit() {
    const next = draft.trim();
    setEditing(false);
    if (!next || next === editValue) return;
    if (isCustom) {
      updateCustomCheck(check.id, { url: next });
    } else {
      setOverride(check.id, next.startsWith('/') ? next : `/${next}`);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <StatusDot status={status} pulse={isRefreshing} />
            <span className="truncate text-sm font-semibold text-fg">{check.name}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge tone={isCustom ? 'logs' : 'neutral'}>{HEALTH_GROUP_LABEL[check.group]}</Badge>
            {check.method !== 'GET' && <Badge mono>{check.method}</Badge>}
            <Badge tone={STATUS_TONE[status]} mono>
              {health?.httpStatus ?? '—'}
            </Badge>
            {headerCount > 0 && (
              <span className="text-[11px] text-fg-subtle">{headerCount} header</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="tnum text-right text-xs text-fg-muted">
            {formatLatency(health?.latencyMs)}
          </span>
          {isCustom && (
            <button
              onClick={() => removeCustomCheck(check.id)}
              className="text-fg-subtle hover:text-status-down"
              title="Kaldır"
              aria-label={`${check.name} kaldır`}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </CardHeader>

      <CardBody className="space-y-2.5">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wide text-fg-subtle">{editLabel}</span>
            <div className="flex items-center gap-1">
              {canReset && !editing && (
                <button
                  onClick={() => clearOverride(check.id)}
                  className="flex items-center gap-1 text-[11px] text-fg-subtle hover:text-fg-muted"
                  title="Varsayılana döndür"
                >
                  <RotateCcw size={11} />
                  sıfırla
                </button>
              )}
              <button
                onClick={() => (editing ? commit() : setEditing(true))}
                className="flex items-center gap-1 text-[11px] text-fg-subtle hover:text-fg-muted"
              >
                {editing ? <Check size={11} /> : <Pencil size={11} />}
                {editing ? 'kaydet' : 'düzenle'}
              </button>
            </div>
          </div>

          {editing ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') setEditing(false);
              }}
              spellCheck={false}
              className="tnum w-full rounded border border-border-strong bg-bg px-2 py-1 text-xs text-fg focus:outline-none"
            />
          ) : (
            <p
              className="tnum truncate rounded border border-border bg-bg px-2 py-1 text-xs text-fg-muted"
              title={editValue}
            >
              {editValue}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-fg-subtle">
          <span className="tnum truncate" title={health?.probeUrl ?? check.url}>
            {(health?.probeUrl ?? check.url).replace(/^https?:\/\//, '')}
          </span>
          <span className="shrink-0">{formatRelative(health?.checkedAt)}</span>
        </div>

        {health?.detail && (
          <p
            className={cn(
              'text-xs',
              status === 'down' ? 'text-status-down' : 'text-status-degraded',
            )}
          >
            {health.detail}
          </p>
        )}
      </CardBody>
    </Card>
  );
}
