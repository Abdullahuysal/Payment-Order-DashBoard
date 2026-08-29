import { Search, User } from 'lucide-react';

import { useAppStore } from '@/app/store';

import { Breadcrumbs } from './Breadcrumbs';
import { EnvSwitcher } from './EnvSwitcher';
import { ThemeToggle } from './ThemeToggle';

export function Topbar() {
  const setCommandOpen = useAppStore((s) => s.setCommandOpen);

  return (
    <header className="flex h-[var(--spacing-topbar)] shrink-0 items-center gap-4 border-b border-border bg-bg px-4">
      <Breadcrumbs />

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          className="flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-fg-subtle hover:text-fg-muted"
        >
          <Search size={13} />
          <span>Ara</span>
          <kbd className="tnum rounded border border-border px-1 text-[10px] text-fg-subtle">
            ⌘K
          </kbd>
        </button>

        <EnvSwitcher />

        <ThemeToggle />

        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-surface text-fg-muted hover:text-fg"
          aria-label="Kullanıcı"
        >
          <User size={14} />
        </button>
      </div>
    </header>
  );
}
