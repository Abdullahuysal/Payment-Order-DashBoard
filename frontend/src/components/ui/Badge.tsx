import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'up' | 'degraded' | 'down' | 'logs';

const TONES: Record<Tone, string> = {
  neutral: 'border-border text-fg-muted',
  up: 'border-status-up/30 text-status-up',
  degraded: 'border-status-degraded/30 text-status-degraded',
  down: 'border-status-down/30 text-status-down',
  logs: 'border-accent-logs/30 text-accent-logs',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  mono?: boolean;
}

export function Badge({ className, tone = 'neutral', mono = false, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium leading-none',
        TONES[tone],
        mono && 'tnum',
        className,
      )}
      {...props}
    />
  );
}
