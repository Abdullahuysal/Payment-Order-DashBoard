import { CopyButton } from '@/components/ui';

import type { Identifier } from '../types';

export function IdentifiersBar({ identifiers }: { identifiers: readonly Identifier[] }) {
  if (identifiers.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {identifiers.map((id) => (
        <span
          key={id.key}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-[11px]"
        >
          <span className="text-fg-subtle">{id.label}</span>
          <span className="tnum text-fg">{id.value}</span>
          {id.copyable && <CopyButton value={id.value} className="h-5 border-0 px-0.5" />}
        </span>
      ))}
    </div>
  );
}
