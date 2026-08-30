import {
  Braces,
  ChevronDown,
  CircleCheck,
  Database,
  FileCode2,
  Globe,
  RefreshCcw,
  Timer,
  type LucideIcon,
} from 'lucide-react';

import { Badge } from '@/components/ui';
import { cn } from '@/lib/cn';

import {
  formatDurationMs,
  STEP_KIND_LABEL,
  STEP_STATUS_LABEL,
  STEP_STATUS_TONE,
  toTimelineItems,
} from '../lib';
import type { RunStep, RunStepStatus, StepDef, StepKind } from '../types';
import { JsonView } from './JsonView';

const STEP_ICON: Record<StepKind, LucideIcon> = {
  httpRequest: Globe,
  soapRequest: FileCode2,
  poll: RefreshCcw,
  dbQuery: Database,
  extract: Braces,
  assert: CircleCheck,
  delay: Timer,
};

const RING: Record<RunStepStatus, string> = {
  pending: 'border-border bg-surface text-fg-subtle',
  running: 'border-accent-logs/40 bg-accent-logs/10 text-accent-logs',
  passed: 'border-status-up/40 bg-status-up/10 text-status-up',
  failed: 'border-status-down/40 bg-status-down/10 text-status-down',
  skipped: 'border-border bg-surface text-fg-subtle opacity-60',
};

export function StepTimeline({ steps }: { steps: ReadonlyArray<StepDef | RunStep> }) {
  const items = toTimelineItems(steps);
  if (items.length === 0) return <p className="text-xs text-fg-subtle">Adım tanımı yok.</p>;

  return (
    <ol>
      {items.map((item, index) => {
        const Icon = STEP_ICON[item.kind];
        const last = index === items.length - 1;

        const header = (
          <div className="flex min-w-0 flex-1 items-center gap-2 py-1.5">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-fg">{item.title}</span>
              <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-fg-subtle">
                <span>{STEP_KIND_LABEL[item.kind]}</span>
                {item.durationMs != null && (
                  <span className="tnum">· {formatDurationMs(item.durationMs)}</span>
                )}
                {item.attempts != null && <span className="tnum">· {item.attempts} deneme</span>}
              </span>
            </span>
            <Badge tone={STEP_STATUS_TONE[item.status]}>{STEP_STATUS_LABEL[item.status]}</Badge>
          </div>
        );

        return (
          <li key={item.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                  RING[item.status],
                  item.status === 'running' && 'motion-safe:animate-pulse',
                )}
              >
                <Icon size={15} strokeWidth={1.75} />
              </span>
              {!last && <span className="w-px flex-1 bg-border" />}
            </div>

            <div className="min-w-0 flex-1 pb-3">
              {item.hasDetail ? (
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
                    {header}
                    <ChevronDown
                      size={14}
                      className="shrink-0 text-fg-subtle transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <div className="space-y-2 pb-1 pt-1">
                    {item.error != null && item.error !== '' && (
                      <div className="rounded-md border border-status-down/30 bg-status-down/5 px-2.5 py-2 text-[11px] text-status-down">
                        {item.error}
                      </div>
                    )}
                    <JsonView label="istek" value={item.request} />
                    <JsonView label="yanıt" value={item.response} />
                  </div>
                </details>
              ) : (
                header
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
