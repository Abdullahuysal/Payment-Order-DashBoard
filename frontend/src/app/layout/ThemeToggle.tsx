import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { THEMES, useAppStore, type ThemeName } from '@/app/store';
import { cn } from '@/lib/cn';

import { THEME_META, type ThemeGroup } from './themeMeta';

const GROUP_ORDER: ThemeGroup[] = ['dark', 'light'];

export function ThemeToggle() {
  const { t } = useTranslation('common');
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const active = THEME_META[theme];
  const ActiveIcon = active.icon;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('theme.ariaLabel')}
        className={cn(
          'flex h-7 items-center gap-1.5 rounded-md border border-border bg-surface px-2 text-xs transition-colors',
          open ? 'border-border-strong text-fg' : 'text-fg-muted hover:text-fg',
        )}
      >
        <ActiveIcon size={14} className="shrink-0" />
        <span className="hidden sm:inline">{t(`theme.names.${theme}`)}</span>
        <ChevronDown
          size={12}
          className={cn('shrink-0 text-fg-subtle transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={t('theme.ariaLabel')}
          className="absolute right-0 z-50 mt-1.5 w-72 rounded-xl border border-border-strong bg-surface p-2 shadow-2xl animate-[fade-in_120ms_ease-out]"
        >
          {GROUP_ORDER.map((group) => (
            <div key={group} className="mb-1 last:mb-0">
              <div className="px-1 pb-1.5 pt-1 text-[10px] font-medium uppercase tracking-wide text-fg-subtle">
                {t(`theme.groups.${group}`)}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {THEMES.filter((name) => THEME_META[name].group === group).map((name) => (
                  <ThemeCard
                    key={name}
                    name={name}
                    active={name === theme}
                    onSelect={() => {
                      setTheme(name);
                      setOpen(false);
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ThemeCardProps {
  name: ThemeName;
  active: boolean;
  onSelect: () => void;
}

function ThemeCard({ name, active, onSelect }: ThemeCardProps) {
  const { t } = useTranslation('common');
  const meta = THEME_META[name];
  const Icon = meta.icon;
  const { bg, surface, fg, accent, border } = meta.swatch;

  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={active}
      onClick={onSelect}
      className={cn(
        'flex flex-col gap-1.5 rounded-lg border p-2 text-left transition-colors',
        active
          ? 'border-border-strong bg-surface-2'
          : 'border-border hover:border-border-strong hover:bg-surface-2',
      )}
    >
      <span
        aria-hidden
        className="flex h-9 items-center gap-1 rounded-md border p-1"
        style={{ backgroundColor: bg, borderColor: border }}
      >
        <span className="h-full flex-1 rounded-[3px]" style={{ backgroundColor: surface }} />
        <span className="h-full w-1.5 rounded-[2px]" style={{ backgroundColor: fg }} />
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
      </span>

      <span className="flex items-center gap-1.5">
        <Icon size={13} strokeWidth={1.75} className="shrink-0 text-fg-subtle" />
        <span className="truncate text-xs font-medium text-fg">{t(`theme.names.${name}`)}</span>
        {active && <Check size={13} className="ml-auto shrink-0 text-fg-muted" />}
      </span>
      <span className="text-[10px] leading-tight text-fg-subtle">{t(`theme.hints.${name}`)}</span>
    </button>
  );
}
