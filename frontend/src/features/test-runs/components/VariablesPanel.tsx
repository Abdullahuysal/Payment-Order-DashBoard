import { ArrowRightToLine } from 'lucide-react';

import { inlineValue } from '../lib';
import { CopyButton, EmptyHint } from './kit';

interface VariablesPanelProps {
  variables: Record<string, unknown>;
  onUseInNext?: ((key: string, value: unknown) => void) | undefined;
}

export function VariablesPanel({ variables, onUseInNext }: VariablesPanelProps) {
  const entries = Object.entries(variables);
  if (entries.length === 0) {
    return <EmptyHint>Koşum ilerledikçe üretilen değişkenler burada birikir.</EmptyHint>;
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {entries.map(([key, value]) => {
        const text = inlineValue(value);
        return (
          <li key={key} className="flex items-center gap-2 px-3 py-2">
            <span className="tnum w-36 shrink-0 truncate text-[11px] text-fg-subtle" title={key}>
              {key}
            </span>
            <span className="tnum min-w-0 flex-1 truncate text-xs text-fg-muted" title={text}>
              {text}
            </span>
            <CopyButton value={text} />
            {onUseInNext && (
              <button
                type="button"
                onClick={() => onUseInNext(key, value)}
                className="inline-flex h-6 shrink-0 items-center gap-1 rounded border border-border px-1.5 text-[11px] text-fg-subtle transition-colors hover:text-fg"
              >
                <ArrowRightToLine size={11} />
                sonraki senaryo
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
