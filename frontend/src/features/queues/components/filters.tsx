import { type ReactNode } from 'react';
import { Check, Search, X } from 'lucide-react';

import { cn } from '@/lib/cn';

export function SearchField({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <div className="relative flex-1 sm:max-w-xs">
      <Search
        size={13}
        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-subtle"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        spellCheck={false}
        className="tnum h-7 w-full rounded-md border border-border bg-bg pl-7 pr-7 text-xs text-fg placeholder:text-fg-subtle focus:border-border-strong focus:outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Aramayı temizle"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-fg-subtle hover:text-fg"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

export function FilterToggle({
  active,
  onToggle,
  children,
}: {
  active: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={onToggle}
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors',
        active
          ? 'border-border-strong bg-surface-2 text-fg'
          : 'border-border text-fg-muted hover:border-border-strong hover:text-fg',
      )}
    >
      <span
        className={cn(
          'flex h-3 w-3 items-center justify-center rounded-[3px] border',
          active ? 'border-fg bg-fg text-bg' : 'border-border-strong',
        )}
      >
        {active && <Check size={9} strokeWidth={3} />}
      </span>
      {children}
    </button>
  );
}
