import { cn } from '@/lib/cn';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<SegmentedOption<T>>;
  size?: 'sm' | 'md';
  ariaLabel: string;
  className?: string;
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = 'md',
  ariaLabel,
  className,
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center rounded-md border border-border bg-bg p-0.5',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={opt.disabled ?? false}
            onClick={() => onChange(opt.value)}
            className={cn(
              'rounded font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40',
              size === 'sm' ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1 text-xs',
              active
                ? 'bg-surface-2 text-fg'
                : 'text-fg-subtle hover:text-fg-muted disabled:hover:text-fg-subtle',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
