import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

export function PanelHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">{children}</h2>
  );
}

export function InlineHint({
  children,
  className,
}: {
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <p
      className={cn(
        'rounded-lg border border-dashed border-border px-4 py-6 text-center text-xs text-fg-muted',
        className,
      )}
    >
      {children}
    </p>
  );
}
