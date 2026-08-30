import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/cn';
import { formatCount } from '@/lib/format';

export const PAGE_SIZES = [25, 50, 100] as const;

export function Pagination({
  page,
  totalPages,
  totalCount,
  pageSize,
  onPage,
  onPageSize,
  busy,
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
  busy?: boolean;
}) {
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-2.5 text-xs text-fg-muted">
      <div className="flex items-center gap-2">
        <span className="tnum">{formatCount(totalCount)} kayıt</span>
        <span className="text-fg-subtle">·</span>
        <label className="flex items-center gap-1.5">
          <span className="text-fg-subtle">sayfa başına</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSize(Number(e.target.value))}
            className="tnum rounded border border-border bg-bg px-1.5 py-0.5 text-xs text-fg focus:outline-none"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={cn('flex items-center gap-2', busy && 'opacity-60')}>
        <span className="tnum">
          {page} / {Math.max(totalPages, 1)}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPage(page - 1)}
            disabled={!canPrev || busy}
            aria-label="Önceki sayfa"
            className="rounded border border-border p-1 text-fg-muted hover:border-border-strong hover:text-fg disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            type="button"
            onClick={() => onPage(page + 1)}
            disabled={!canNext || busy}
            aria-label="Sonraki sayfa"
            className="rounded border border-border p-1 text-fg-muted hover:border-border-strong hover:text-fg disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
