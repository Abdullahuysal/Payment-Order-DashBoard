import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Languages, Server, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { THEMES, useAppStore } from '@/app/store';
import { cn } from '@/lib/cn';
import { MODULES } from '@/lib/constants';
import { LOCALES } from '@/i18n/config';
import { APP_ENVIRONMENTS } from '@/services/config';

import { THEME_META } from './themeMeta';

type CommandGroup = 'pages' | 'actions';

interface Command {
  id: string;
  label: string;
  group: CommandGroup;
  icon: LucideIcon;
  keywords: string;
  hint?: string | undefined;
  run: () => void;
}

export function CommandPalette() {
  const { t, i18n } = useTranslation(['common', 'nav']);
  const open = useAppStore((s) => s.commandOpen);
  const setOpen = useAppStore((s) => s.setCommandOpen);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const environment = useAppStore((s) => s.environment);
  const setEnvironment = useAppStore((s) => s.setEnvironment);
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
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
        label: t('common:sidebar.overview'),
        group: 'pages',
        icon: Home,
        keywords: t('common:commandPalette.homeKeywords'),
        run: () => go('/'),
      },
      ...MODULES.flatMap<Command>((mod) => [
        {
          id: `page-${mod.id}`,
          label: t(`nav:modules.${mod.id}.label`),
          group: 'pages',
          icon: mod.icon,
          keywords: `${mod.path} ${t(`nav:modules.${mod.id}.description`)}`,
          run: () => go(`/${mod.path}`),
        },
        ...(mod.children ?? []).map<Command>((sub) => ({
          id: `page-${mod.id}-${sub.id}`,
          label: t(`nav:subpages.${sub.id}.label`),
          group: 'pages',
          icon: mod.icon,
          keywords: `${t(`nav:modules.${mod.id}.label`)} ${sub.path} ${t(`nav:subpages.${sub.id}.description`)}`,
          hint: t(`nav:modules.${mod.id}.label`),
          run: () => go(`/${mod.path}/${sub.path}`),
        })),
      ]),
    ];

    const actions: Command[] = [
      ...THEMES.filter((name) => name !== theme).map<Command>((name) => ({
        id: `action-theme-${name}`,
        label: t('common:commandPalette.themeItem', { name: t(`common:theme.names.${name}`) }),
        group: 'actions',
        icon: THEME_META[name].icon,
        keywords: `${t('common:commandPalette.themeKeywords')} ${name} ${t(`common:theme.names.${name}`)}`,
        run: () => {
          setTheme(name);
          setOpen(false);
        },
      })),
      ...APP_ENVIRONMENTS.map<Command>((env) => ({
        id: `action-env-${env}`,
        label: t('common:commandPalette.envItem', { name: t(`common:env.labels.${env}`) }),
        group: 'actions',
        icon: Server,
        keywords: `${t('common:commandPalette.envKeywords')} ${env}`,
        hint: env === environment ? t('common:commandPalette.active') : undefined,
        run: () => {
          setEnvironment(env);
          setOpen(false);
        },
      })),
      ...LOCALES.filter((code) => code !== language).map<Command>((code) => ({
        id: `action-locale-${code}`,
        label: t('common:commandPalette.localeItem', { name: t(`common:locale.names.${code}`) }),
        group: 'actions',
        icon: Languages,
        keywords: `${t('common:commandPalette.localeKeywords')} ${code}`,
        run: () => {
          setLanguage(code);
          setOpen(false);
        },
      })),
    ];

    return [...pages, ...actions];
  }, [t, theme, environment, language, navigate, setTheme, setEnvironment, setLanguage, setOpen]);

  const filtered = useMemo(() => {
    const lang = i18n.language;
    const norm = (s: string) => s.toLocaleLowerCase(lang);
    const q = norm(query.trim());
    if (!q) return commands;
    return commands.filter((c) => norm(`${c.label} ${c.keywords}`).includes(q));
  }, [commands, query, i18n.language]);

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
        aria-label={t('common:commandPalette.dialogAria')}
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
          placeholder={t('common:commandPalette.placeholder')}
          className="w-full border-b border-border bg-transparent px-4 py-3 text-sm text-fg placeholder:text-fg-subtle focus:outline-none"
        />

        <ul className="max-h-80 overflow-y-auto p-1.5">
          {filtered.length === 0 && (
            <li className="px-2.5 py-6 text-center text-xs text-fg-subtle">
              {t('common:commandPalette.empty')}
            </li>
          )}
          {filtered.map((cmd, i) => {
            const Icon = cmd.icon;
            const isActive = i === activeSafe;
            const prevGroup = i > 0 ? filtered[i - 1]?.group : undefined;
            return (
              <li key={cmd.id}>
                {cmd.group !== prevGroup && (
                  <div className="px-2.5 pb-1 pt-2 text-[10px] uppercase tracking-wide text-fg-subtle">
                    {t(`common:commandPalette.groups.${cmd.group}`)}
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
          <span className="tnum">↑↓</span> {t('common:commandPalette.hints.navigate')}
          <span className="tnum">↵</span> {t('common:commandPalette.hints.select')}
          <span className="tnum">esc</span> {t('common:commandPalette.hints.close')}
        </div>
      </div>
    </div>
  );
}
