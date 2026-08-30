import { Check } from 'lucide-react';

import { Segmented } from '@/components/ui';
import { cn } from '@/lib/cn';

import type { OptionField } from '../registry';
import type { OptionValue } from '../types';

interface OptionRowProps {
  field: OptionField;
  value: OptionValue | undefined;
  onChange: (key: string, value: OptionValue) => void;
}

export function OptionRow({ field, value, onChange }: OptionRowProps) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-20 shrink-0 text-[11px] uppercase tracking-wide text-fg-subtle">
        {field.label}
      </span>
      <Control field={field} value={value} onChange={onChange} />
    </div>
  );
}

function Control({ field, value, onChange }: OptionRowProps) {
  if (field.kind === 'toggle') {
    const checked = value === true;
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(field.key, !checked)}
        className={cn(
          'inline-flex h-6 items-center gap-1.5 rounded border px-2 text-[11px] transition-colors',
          checked
            ? 'border-border-strong bg-surface-2 text-fg'
            : 'border-border text-fg-subtle hover:text-fg-muted',
        )}
      >
        <span
          className={cn(
            'flex h-3 w-3 items-center justify-center rounded-sm border',
            checked ? 'border-transparent bg-primary text-primary-fg' : 'border-border-strong',
          )}
        >
          {checked && <Check size={9} strokeWidth={3} />}
        </span>
        {checked ? 'açık' : 'kapalı'}
      </button>
    );
  }

  if (field.kind === 'select') {
    const current = typeof value === 'string' ? value : (field.choices[0]?.value ?? '');
    return (
      <Segmented
        size="sm"
        ariaLabel={field.label}
        value={current}
        onChange={(next) => onChange(field.key, next)}
        options={field.choices.map((choice) => ({ value: choice.value, label: choice.label }))}
      />
    );
  }

  return (
    <input
      type="text"
      value={typeof value === 'string' ? value : ''}
      placeholder={field.placeholder}
      onChange={(event) => onChange(field.key, event.target.value)}
      className="h-7 w-40 rounded border border-border bg-bg px-2 text-xs text-fg placeholder:text-fg-subtle focus:border-border-strong focus:outline-none"
    />
  );
}
