import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

import { cn } from '@/lib/cn';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  width?: 'md' | 'lg';
}

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  actions,
  children,
  width = 'md',
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const labelId = useId();

  useEffect(() => {
    if (!open) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      restoreFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
      <div
        className="absolute inset-0 bg-black/50 motion-safe:animate-[fade-in_120ms_ease-out]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        tabIndex={-1}
        className={cn(
          'relative flex h-full w-full flex-col border-l border-border-strong bg-surface shadow-2xl outline-none',
          'motion-safe:animate-[slide-in-right_160ms_ease-out]',
          width === 'lg' ? 'max-w-2xl' : 'max-w-lg',
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h2 id={labelId} className="truncate text-sm font-semibold text-fg">
              {title}
            </h2>
            {subtitle != null && (
              <div className="mt-0.5 truncate text-xs text-fg-muted">{subtitle}</div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {actions}
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-fg-subtle hover:bg-surface-2 hover:text-fg"
              aria-label="Paneli kapat"
            >
              <X size={15} />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
      </div>
    </div>
  );
}
