import { clampRepeat } from '../lib';
import type { BulkLimits, RepeatConfig } from '../types';
import { controlClass, FieldShell } from './kit';

interface BulkControlsProps {
  limits: BulkLimits;
  value: RepeatConfig | null;
  onChange: (next: RepeatConfig | null) => void;
  disabled?: boolean | undefined;
}

export function BulkControls({ limits, value, onChange, disabled }: BulkControlsProps) {
  const enabled = value != null;

  const toggle = () => {
    onChange(enabled ? null : clampRepeat({ count: 2, concurrency: 1 }, limits));
  };

  const update = (patch: Partial<RepeatConfig>) => {
    if (!value) return;
    onChange(clampRepeat({ ...value, ...patch }, limits));
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface p-3">
      <label className="flex cursor-pointer items-center gap-2 text-sm text-fg">
        <input
          type="checkbox"
          checked={enabled}
          disabled={disabled ?? false}
          onChange={toggle}
          className="h-4 w-4 rounded border-border-strong bg-bg"
        />
        Toplu çalıştır
      </label>

      {enabled && value && (
        <div className="grid grid-cols-2 gap-3">
          <FieldShell id="bulk-count" label="Koşum adedi">
            <input
              id="bulk-count"
              type="number"
              min={1}
              max={limits.maxCount}
              disabled={disabled ?? false}
              value={value.count}
              onChange={(event) => update({ count: Number(event.target.value) })}
              className={controlClass}
            />
          </FieldShell>
          <FieldShell id="bulk-concurrency" label="Eşzamanlılık">
            <input
              id="bulk-concurrency"
              type="number"
              min={1}
              max={Math.min(limits.maxConcurrency, value.count)}
              disabled={disabled ?? false}
              value={value.concurrency}
              onChange={(event) => update({ concurrency: Number(event.target.value) })}
              className={controlClass}
            />
          </FieldShell>
        </div>
      )}

      <p className="text-[11px] text-fg-subtle">
        Sunucu sınırı: en çok <span className="tnum">{limits.maxCount}</span> koşum,{' '}
        <span className="tnum">{limits.maxConcurrency}</span> eşzamanlı.
      </p>
    </div>
  );
}
