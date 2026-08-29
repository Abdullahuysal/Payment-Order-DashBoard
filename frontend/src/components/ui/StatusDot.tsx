import { cn } from '@/lib/cn';
import type { Status } from '@/types';

const TONE: Record<Status, string> = {
  up: 'bg-status-up',
  degraded: 'bg-status-degraded',
  down: 'bg-status-down',
  unknown: 'bg-status-unknown',
};

const LABEL: Record<Status, string> = {
  up: 'Ayakta',
  degraded: 'Sorunlu',
  down: 'Kapalı',
  unknown: 'Bilinmiyor',
};

export interface StatusDotProps {
  status: Status;
  pulse?: boolean;
  withLabel?: boolean;
  className?: string;
}

export function StatusDot({ status, pulse = false, withLabel = false, className }: StatusDotProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="relative inline-flex h-2.5 w-2.5">
        {pulse && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full animate-ping rounded-full opacity-60',
              TONE[status],
            )}
          />
        )}
        <span className={cn('relative inline-flex h-2.5 w-2.5 rounded-full', TONE[status])} />
      </span>
      {withLabel && <span className="text-xs text-fg-muted">{LABEL[status]}</span>}
    </span>
  );
}

export { LABEL as STATUS_LABELS };
