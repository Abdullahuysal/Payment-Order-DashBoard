import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppStore } from '@/app/store';
import { MODULES } from '@/lib/constants';

export function CommandPalette() {
  const open = useAppStore((s) => s.commandOpen);
  const setOpen = useAppStore((s) => s.setCommandOpen);
  const navigate = useNavigate();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(!useAppStore.getState().commandOpen);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[15vh]"
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-label="Komut paleti"
        className="w-full max-w-lg overflow-hidden rounded-lg border border-border-strong bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          disabled
          placeholder="Komut paleti — sonraki fazda (şimdilik yalnızca gezinme)"
          className="w-full border-b border-border bg-transparent px-4 py-3 text-sm text-fg placeholder:text-fg-subtle focus:outline-none"
        />
        <ul className="max-h-72 overflow-y-auto p-1.5">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <li key={mod.id}>
                <button
                  onClick={() => {
                    void navigate(`/${mod.path}`);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-fg-muted hover:bg-surface-2 hover:text-fg"
                >
                  <Icon size={15} strokeWidth={1.75} className="text-fg-subtle" />
                  {mod.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
