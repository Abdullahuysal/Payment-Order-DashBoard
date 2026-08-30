import { cn } from '@/lib/cn';
import { formatCount } from '@/lib/format';

import { CATEGORY_LABEL, type QueueCategory } from '../scope';
import type { ScopeSummary } from '../hooks/useScopedRabbitQueues';

const TONE_RING: Record<'all' | QueueCategory, string> = {
  all: 'data-[active=true]:border-border-strong data-[active=true]:bg-surface-2',
  error: 'data-[active=true]:border-status-down/50 data-[active=true]:bg-status-down/10',
  skip: 'data-[active=true]:border-status-degraded/50 data-[active=true]:bg-status-degraded/10',
  backlog: 'data-[active=true]:border-status-degraded/50 data-[active=true]:bg-status-degraded/10',
};

const VALUE_TONE: Record<QueueCategory, string> = {
  error: 'text-status-down',
  skip: 'text-status-degraded',
  backlog: 'text-status-degraded',
};

export function RabbitScopeSummary({
  summary,
  active,
  onSelect,
}: {
  summary: ScopeSummary;
  active: QueueCategory | null;
  onSelect: (category: QueueCategory | null) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Kapsam özeti — kategoriye göre süz"
      className="grid grid-cols-2 gap-2 px-4 pt-3 sm:grid-cols-4"
    >
      <Tile
        label="Kapsam"
        value={formatCount(summary.total)}
        hint="tüm kuyruklarım"
        activeKey="all"
        isActive={active === null}
        onClick={() => onSelect(null)}
      />
      <Tile
        label={CATEGORY_LABEL.error}
        value={formatCount(summary.error)}
        hint={`${formatCount(summary.errorMessages)} mesaj`}
        activeKey="error"
        valueClass={VALUE_TONE.error}
        isActive={active === 'error'}
        onClick={() => onSelect(active === 'error' ? null : 'error')}
      />
      <Tile
        label={CATEGORY_LABEL.skip}
        value={formatCount(summary.skip)}
        hint="atlanan / park"
        activeKey="skip"
        valueClass={VALUE_TONE.skip}
        isActive={active === 'skip'}
        onClick={() => onSelect(active === 'skip' ? null : 'skip')}
      />
      <Tile
        label={CATEGORY_LABEL.backlog}
        value={formatCount(summary.backlog)}
        hint={`${formatCount(summary.backlogMessages)} bekliyor`}
        activeKey="backlog"
        valueClass={VALUE_TONE.backlog}
        isActive={active === 'backlog'}
        onClick={() => onSelect(active === 'backlog' ? null : 'backlog')}
      />
    </div>
  );
}

function Tile({
  label,
  value,
  hint,
  activeKey,
  valueClass,
  isActive,
  onClick,
}: {
  label: string;
  value: string;
  hint: string;
  activeKey: 'all' | QueueCategory;
  valueClass?: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={isActive}
      data-active={isActive}
      onClick={onClick}
      className={cn(
        'flex flex-col rounded-md border border-border bg-bg px-2.5 py-2 text-left transition-colors',
        'hover:border-border-strong focus-visible:border-border-strong focus-visible:outline-none',
        TONE_RING[activeKey],
      )}
    >
      <span className="text-[11px] text-fg-subtle">{label}</span>
      <span className={cn('tnum mt-0.5 text-lg font-semibold leading-none text-fg', valueClass)}>
        {value}
      </span>
      <span className="tnum mt-1 text-[11px] text-fg-subtle">{hint}</span>
    </button>
  );
}
