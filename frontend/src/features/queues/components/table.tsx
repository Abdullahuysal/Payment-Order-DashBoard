import { type ReactNode, type ThHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

export function TableFrame({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[46rem] border-collapse text-xs">{children}</table>
    </div>
  );
}

export function Th({
  children,
  numeric,
  className,
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <th
      scope="col"
      className={cn(
        'sticky top-0 z-10 border-b border-border bg-surface px-3 py-2 font-medium text-fg-subtle',
        numeric ? 'text-right tnum' : 'text-left',
        className,
      )}
      {...rest}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  numeric,
  className,
}: {
  children: ReactNode;
  numeric?: boolean;
  className?: string;
}) {
  return (
    <td
      className={cn(
        'px-3 py-2 align-middle text-fg-muted',
        numeric && 'text-right tnum text-fg',
        className,
      )}
    >
      {children}
    </td>
  );
}

export function Tr({
  children,
  onClick,
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  if (!onClick) {
    return <tr className="border-b border-border last:border-b-0">{children}</tr>;
  }
  return (
    <tr
      tabIndex={0}
      role="button"
      aria-label={ariaLabel}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="cursor-pointer border-b border-border transition-colors last:border-b-0 hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none"
    >
      {children}
    </tr>
  );
}
