import { useState, type ReactNode } from 'react';
import { Ban, Check, Copy } from 'lucide-react';

import { Card, CardBody } from '@/components/ui';
import { cn } from '@/lib/cn';

export const controlClass =
  'h-9 w-full rounded-md border border-border bg-bg px-2.5 text-sm text-fg ' +
  'placeholder:text-fg-subtle focus-visible:border-border-strong focus-visible:outline-none ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

export function CopyButton({
  value,
  label,
  idleLabel = 'kopyala',
}: {
  value: string;
  label?: string | undefined;
  idleLabel?: string;
}) {
  const [done, setDone] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      window.setTimeout(() => setDone(false), 1200);
    } catch {
      setDone(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="inline-flex h-6 shrink-0 items-center gap-1 rounded border border-border px-1.5 text-[11px] text-fg-subtle transition-colors hover:text-fg"
    >
      {done ? <Check size={11} className="text-status-up" /> : <Copy size={11} />}
      {label ?? (done ? 'kopyalandı' : idleLabel)}
    </button>
  );
}

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
}: {
  error: unknown;
  onRetry?: (() => void) | undefined;
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
          tekrar dene
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

export function ProdDisabledNotice() {
  return (
    <Card className="mx-auto mt-4 max-w-xl">
      <CardBody className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-surface-2 text-fg-muted">
          <Ban size={20} strokeWidth={1.75} />
        </span>
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-fg">Test koşumları prod’da devre dışı</h2>
          <p className="mx-auto max-w-sm text-xs leading-relaxed text-fg-muted">
            Bu modül yalnızca <span className="tnum">dev</span> ve{' '}
            <span className="tnum">preprod</span> ortamlarında çalışır. Devam etmek için Topbar’dan
            ortamı değiştir.
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
