import { Moon, Sun } from 'lucide-react';

import { useAppStore } from '@/app/store';

export function ThemeToggle() {
  const theme = useAppStore((s) => s.theme);
  const toggle = useAppStore((s) => s.toggleTheme);
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
      title={isDark ? 'Açık tema' : 'Koyu tema'}
      className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-fg-muted hover:text-fg"
    >
      {isDark ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
}
