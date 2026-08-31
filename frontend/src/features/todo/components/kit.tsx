import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

export const controlClass =
  'h-9 w-full rounded-md border border-border bg-bg px-2.5 text-sm text-fg ' +
  'placeholder:text-fg-subtle focus-visible:border-border-strong focus-visible:outline-none ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

export function FieldShell({
  id,
  label,
  required,
  help,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean | undefined;
  help?: string | undefined;
  error?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="flex items-center gap-1 text-xs font-medium text-fg-muted">
        {label}
        {required && <span className="text-status-down">*</span>}
      </label>
      {children}
      {help && !error && <p className="text-[11px] leading-relaxed text-fg-subtle">{help}</p>}
      {error && (
        <p role="alert" className="text-[11px] text-status-down">
          {error}
        </p>
      )}
    </div>
  );
}

export function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">{children}</h3>
  );
}

export function EmptyHint({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-xs text-fg-muted">
      {children}
    </p>
  );
}

export function ErrorHint({
  error,
  onRetry,
  retryLabel,
}: {
  error: unknown;
  onRetry?: (() => void) | undefined;
  retryLabel?: string | undefined;
}) {
  const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
  return (
    <div
      role="alert"
      className="rounded-lg border border-status-down/30 bg-surface px-4 py-3 text-xs text-status-down"
    >
      {message}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="ml-2 underline underline-offset-2 hover:no-underline"
        >
          {retryLabel ?? 'tekrar dene'}
        </button>
      )}
    </div>
  );
}

export function LoadingLines({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-11 animate-pulse rounded-md border border-border bg-surface motion-reduce:animate-none"
        />
      ))}
    </div>
  );
}
