import { Search } from 'lucide-react';

import { useAppStore } from '@/app/store';

import { Breadcrumbs } from './Breadcrumbs';
import { EnvSwitcher } from './EnvSwitcher';
import { ThemeToggle } from './ThemeToggle';

export function Topbar() {
  const setCommandOpen = useAppStore((s) => s.setCommandOpen);

  return (
    <header className="grid h-[var(--spacing-topbar)] shrink-0 grid-cols-[1fr_minmax(0,32rem)_1fr] items-center gap-4 border-b border-border bg-bg px-4">
      <div className="min-w-0">
        <Breadcrumbs />
      </div>

      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="flex h-9 w-full items-center gap-2.5 rounded-lg border border-border bg-surface px-3 text-sm text-fg-subtle transition-colors hover:border-border-strong hover:text-fg-muted"
      >
        <Search size={15} className="shrink-0" />
        <span className="flex-1 truncate text-left">Ara veya komut çalıştır…</span>
        <kbd className="tnum shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] text-fg-subtle">
          ⌘K
        </kbd>
      </button>

      <div className="flex items-center justify-end gap-2">
        <EnvSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
