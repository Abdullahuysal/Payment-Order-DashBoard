import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Moon, Server, Sun, type LucideIcon } from 'lucide-react';

import { useAppStore } from '@/app/store';
import { cn } from '@/lib/cn';
import { MODULES } from '@/lib/constants';
import { APP_ENVIRONMENTS, ENV_LABELS } from '@/services/config';

interface Command {
  id: string;
  label: string;
  group: 'Sayfalar' | 'Eylemler';
  icon: LucideIcon;
  keywords: string;
  hint?: string | undefined;
  run: () => void;
}

const norm = (s: string) => s.toLocaleLowerCase('tr');

export function CommandPalette() {
  const open = useAppStore((s) => s.commandOpen);
  const setOpen = useAppStore((s) => s.setCommandOpen);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const environment = useAppStore((s) => s.environment);
  const setEnvironment = useAppStore((s) => s.setEnvironment);
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const activeRef = useRef<HTMLButtonElement | null>(null);

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

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [open]);

  const close = () => setOpen(false);

  const commands = useMemo<Command[]>(() => {
    const go = (path: string) => {
      void navigate(path);
      setOpen(false);
    };

    const pages: Command[] = [
      {
        id: 'page-home',
        label: 'Genel Bakış',
        group: 'Sayfalar',
        icon: Home,
        keywords: 'home anasayfa overview başlangıç',
        run: () => go('/'),
      },
      ...MODULES.flatMap<Command>((mod) => [
        {
          id: `page-${mod.id}`,
          label: mod.label,
          group: 'Sayfalar',
          icon: mod.icon,
          keywords: `${mod.path} ${mod.description}`,
          run: () => go(`/${mod.path}`),
        },
        ...(mod.children ?? []).map<Command>((sub) => ({
          id: `page-${mod.id}-${sub.id}`,
          label: sub.label,
          group: 'Sayfalar',
          icon: mod.icon,
          keywords: `${mod.label} ${sub.path} ${sub.description}`,
          hint: mod.label,
          run: () => go(`/${mod.path}/${sub.path}`),
        })),
      ]),
    ];

    const actions: Command[] = [
      {
        id: 'action-theme',
        label: theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç',
        group: 'Eylemler',
        icon: theme === 'dark' ? Sun : Moon,
        keywords: 'tema theme dark light açık koyu görünüm',
        run: () => {
          toggleTheme();
          setOpen(false);
        },
      },
      ...APP_ENVIRONMENTS.map<Command>((env) => ({
        id: `action-env-${env}`,
        label: `Ortam: ${ENV_LABELS[env]}`,
        group: 'Eylemler',
        icon: Server,
        keywords: `ortam environment ${env}`,
        hint: env === environment ? 'aktif' : undefined,
        run: () => {
          setEnvironment(env);
          setOpen(false);
        },
      })),
    ];

    return [...pages, ...actions];
  }, [theme, environment, navigate, toggleTheme, setEnvironment, setOpen]);

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return commands;
    return commands.filter((c) => norm(`${c.label} ${c.keywords}`).includes(q));
  }, [commands, query]);

  const activeSafe = filtered.length ? Math.min(activeIndex, filtered.length - 1) : 0;

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeSafe, filtered.length]);

  if (!open) return null;

  function onInputKey(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      filtered[activeSafe]?.run();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[15vh]"
      onClick={close}
    >
      <div
        role="dialog"
        aria-label="Komut paleti"
        className="w-full max-w-lg overflow-hidden rounded-lg border border-border-strong bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={onInputKey}
          placeholder="Sayfa ara veya komut çalıştır…"
          className="w-full border-b border-border bg-transparent px-4 py-3 text-sm text-fg placeholder:text-fg-subtle focus:outline-none"
        />

        <ul className="max-h-80 overflow-y-auto p-1.5">
          {filtered.length === 0 && (
            <li className="px-2.5 py-6 text-center text-xs text-fg-subtle">Sonuç yok</li>
          )}
          {filtered.map((cmd, i) => {
            const Icon = cmd.icon;
            const isActive = i === activeSafe;
            const prevGroup = i > 0 ? filtered[i - 1]?.group : undefined;
            return (
              <li key={cmd.id}>
                {cmd.group !== prevGroup && (
                  <div className="px-2.5 pb-1 pt-2 text-[10px] uppercase tracking-wide text-fg-subtle">
                    {cmd.group}
                  </div>
                )}
                <button
                  ref={isActive ? activeRef : null}
                  onMouseMove={() => setActiveIndex(i)}
                  onClick={cmd.run}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors',
                    isActive ? 'bg-surface-2 text-fg' : 'text-fg-muted',
                  )}
                >
                  <Icon size={15} strokeWidth={1.75} className="shrink-0 text-fg-subtle" />
                  <span className="flex-1 truncate">{cmd.label}</span>
                  {cmd.hint && <span className="text-[11px] text-fg-subtle">{cmd.hint}</span>}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-3 border-t border-border px-4 py-2 text-[11px] text-fg-subtle">
          <span className="tnum">↑↓</span> gez
          <span className="tnum">↵</span> seç
          <span className="tnum">esc</span> kapat
        </div>
      </div>
    </div>
  );
}
