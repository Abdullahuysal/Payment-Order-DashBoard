import { type ReactNode } from 'react';
import { AlertTriangle, Ban, Inbox, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import { HttpError } from '@/services/http';

function Shell({ children }: { children: ReactNode }) {
  return <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">{children}</div>;
}

export function PanelError({
  error,
  onRetry,
  isRetrying,
}: {
  error: unknown;
  onRetry?: () => void;
  isRetrying?: boolean;
}) {
  const status = error instanceof HttpError ? error.status : undefined;
  const message = error instanceof Error ? error.message : 'Bilinmeyen hata';

  const hint =
    status === 503
      ? 'Bu ortam için broker yapılandırılmamış.'
      : status === 502
        ? 'Broker yapılandırılmış ama şu an erişilemiyor.'
        : null;

  return (
    <div role="alert" className="border-t border-border">
      <Shell>
        <AlertTriangle size={18} className="text-status-down" />
        <p className="text-sm font-medium text-fg">Veri alınamadı</p>
        <p className="max-w-sm text-xs text-fg-muted">
          {hint ?? message}
          {status ? <span className="tnum text-fg-subtle"> · HTTP {status}</span> : null}
        </p>
        {onRetry && (
          <Button size="sm" onClick={onRetry} disabled={isRetrying} className="mt-1">
            <RefreshCw size={12} className={cn(isRetrying && 'motion-safe:animate-spin')} />
            Tekrar dene
          </Button>
        )}
      </Shell>
    </div>
  );
}

export function PanelUnavailable({
  phase,
  brokerLabel,
}: {
  phase: 'unconfigured' | 'unreachable';
  brokerLabel: string;
}) {
  return (
    <div className="border-t border-border">
      <Shell>
        <Ban size={18} className="text-fg-subtle" />
        <p className="text-sm font-medium text-fg">
          {phase === 'unconfigured'
            ? `${brokerLabel} bu ortamda yapılandırılmadı`
            : `${brokerLabel} erişilemiyor`}
        </p>
        <p className="max-w-sm text-xs text-fg-muted">
          {phase === 'unconfigured'
            ? 'Broker bağlantısı tanımlanınca kuyruklar burada listelenir.'
            : 'Broker yapılandırılmış ancak sağlık kontrolü başarısız. Bağlantı düzelince otomatik dolar.'}
        </p>
      </Shell>
    </div>
  );
}

export function PanelEmpty({ message }: { message: string }) {
  return (
    <div className="border-t border-border">
      <Shell>
        <Inbox size={18} className="text-fg-subtle" />
        <p className="text-sm text-fg-muted">{message}</p>
      </Shell>
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols }: { rows?: number; cols: number }) {
  return (
    <div className="border-t border-border">
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex items-center gap-4 border-b border-border px-4 py-2.5 last:border-b-0"
        >
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className={cn(
                'h-3 animate-pulse rounded bg-surface-2 motion-reduce:animate-none',
                c === 0 ? 'w-40' : 'flex-1',
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
