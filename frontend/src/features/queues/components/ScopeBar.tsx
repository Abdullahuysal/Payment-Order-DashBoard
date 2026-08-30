import { useState } from 'react';
import { SlidersHorizontal, Target } from 'lucide-react';

import { useAppStore } from '@/app/store';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';

import { isTooBroad } from '../scope';
import { FilterToggle } from './filters';
import { ScopeDialog } from './ScopeDialog';

const MAX_VISIBLE = 6;

export function ScopeBar() {
  const enabled = useAppStore((s) => s.queueScopeEnabled);
  const patterns = useAppStore((s) => s.queueScopePatterns);
  const setEnabled = useAppStore((s) => s.setQueueScopeEnabled);
  const [dialogOpen, setDialogOpen] = useState(false);

  const hasPatterns = patterns.length > 0;
  const visible = patterns.slice(0, MAX_VISIBLE);
  const overflow = patterns.length - visible.length;

  return (
    <section
      aria-label="Alan kapsamı"
      className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5"
    >
      <span className="flex items-center gap-1.5 text-xs font-medium text-fg">
        <Target size={13} className="text-fg-subtle" />
        Alan kapsamı
      </span>

      <FilterToggle
        active={enabled && hasPatterns}
        onToggle={() => {
          if (!hasPatterns) setDialogOpen(true);
          else setEnabled(!enabled);
        }}
      >
        Sadece domainim
      </FilterToggle>

      {hasPatterns ? (
        <div className="flex flex-wrap items-center gap-1">
          {visible.map((p, i) => (
            <span
              key={`${p}-${i}`}
              className={cn(
                'tnum inline-flex items-center rounded border px-1.5 py-0.5 text-[11px]',
                isTooBroad(p)
                  ? 'border-status-degraded/40 text-status-degraded'
                  : 'border-border text-fg-muted',
                !enabled && 'opacity-50',
              )}
            >
              {p}
            </span>
          ))}
          {overflow > 0 && (
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="rounded px-1 py-0.5 text-[11px] text-fg-subtle hover:text-fg-muted"
            >
              +{overflow}
            </button>
          )}
        </div>
      ) : (
        <span className="text-[11px] text-fg-subtle">
          Tüm kuyruklar gösteriliyor — kendi kuyruklarını süz.
        </span>
      )}

      <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setDialogOpen(true)}>
        <SlidersHorizontal size={12} />
        {hasPatterns ? 'Düzenle' : 'Kapsam tanımla'}
      </Button>

      {dialogOpen && <ScopeDialog onClose={() => setDialogOpen(false)} />}
    </section>
  );
}
