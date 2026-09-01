import type { ReactNode } from 'react';
import { AlertTriangle, Ban, Inbox, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import { HttpError } from '@/services/http';

import { errorMessage, isNotConfigured } from '../lib';

function Shell({ children }: { children: ReactNode }) {
  return <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">{children}</div>;
}

export function LogPanelError({
  error,
  onRetry,
  isRetrying,
}: {
  error: unknown;
  onRetry?: (() => void) | undefined;
  isRetrying?: boolean | undefined;
}) {
  const { t } = useTranslation('logs');
  const status = error instanceof HttpError ? error.status : undefined;
  const body = isNotConfigured(error)
    ? t('states.notConfigured')
    : t('states.error', { message: errorMessage(error) });

  return (
    <div role="alert" className="rounded-lg border border-border bg-surface">
      <Shell>
        {isNotConfigured(error) ? (
          <Ban size={18} className="text-fg-subtle" />
        ) : (
          <AlertTriangle size={18} className="text-status-down" />
        )}
        <p className="max-w-sm text-xs text-fg-muted">
          {body}
          {status ? <span className="tnum text-fg-subtle"> · HTTP {status}</span> : null}
        </p>
        {onRetry && !isNotConfigured(error) && (
          <Button size="sm" onClick={onRetry} disabled={isRetrying} className="mt-1">
            <RefreshCw size={12} className={cn(isRetrying && 'motion-safe:animate-spin')} />
            {t('states.retry')}
          </Button>
        )}
      </Shell>
    </div>
  );
}

export function LogPanelEmpty({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface">
      <Shell>
        <Inbox size={18} className="text-fg-subtle" />
        <p className="text-xs text-fg-muted">{message}</p>
      </Shell>
    </div>
  );
}

export function LogSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="rounded-lg border border-border bg-surface">
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex items-center gap-4 border-b border-border px-4 py-2.5 last:border-b-0"
        >
          <div className="h-3 w-32 animate-pulse rounded bg-surface-2 motion-reduce:animate-none" />
          <div className="h-3 flex-1 animate-pulse rounded bg-surface-2 motion-reduce:animate-none" />
        </div>
      ))}
    </div>
  );
}
