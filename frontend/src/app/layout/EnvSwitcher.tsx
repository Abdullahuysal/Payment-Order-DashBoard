import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { useTranslation } from 'react-i18next';

import { useAppStore } from '@/app/store';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import { APP_ENVIRONMENTS } from '@/services/config';
import type { AppEnvironment } from '@/types';

const ENV_ACCENT: Record<AppEnvironment, { dot: string; pill: string }> = {
  dev: { dot: 'bg-status-up', pill: 'bg-status-up/12 ring-status-up/30' },
  preprod: { dot: 'bg-status-degraded', pill: 'bg-status-degraded/12 ring-status-degraded/30' },
  production: { dot: 'bg-status-down', pill: 'bg-status-down/12 ring-status-down/30' },
};

export function EnvSwitcher() {
  const { t, i18n } = useTranslation('common');
  const env = useAppStore((s) => s.environment);
  const setEnv = useAppStore((s) => s.setEnvironment);

  const activeIndex = APP_ENVIRONMENTS.indexOf(env);
  const [focusIndex, setFocusIndex] = useState(activeIndex);
  const [pendingProd, setPendingProd] = useState(false);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const btnRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [indicator, setIndicator] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });

  useEffect(() => {
    setFocusIndex(activeIndex);
  }, [activeIndex]);

  useLayoutEffect(() => {
    const measure = () => {
      const el = btnRefs.current[activeIndex];
      if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (rootRef.current) ro.observe(rootRef.current);
    return () => ro.disconnect();
  }, [activeIndex, env, i18n.language]);

  useEffect(() => {
    if (!pendingProd) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setPendingProd(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setPendingProd(false);
    }
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [pendingProd]);

  const select = (target: AppEnvironment) => {
    if (target === env) return;
    if (target === 'production') {
      setPendingProd(true);
      return;
    }
    setPendingProd(false);
    setEnv(target);
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const last = APP_ENVIRONMENTS.length - 1;
    let next = focusIndex;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown')
      next = focusIndex >= last ? 0 : focusIndex + 1;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp')
      next = focusIndex <= 0 ? last : focusIndex - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const target = APP_ENVIRONMENTS[focusIndex];
      if (target) select(target);
      return;
    } else return;

    e.preventDefault();
    setFocusIndex(next);
    btnRefs.current[next]?.focus();
  };

  return (
    <div ref={rootRef} className="relative">
      <div
        role="radiogroup"
        aria-label={t('env.ariaLabel')}
        onKeyDown={onKeyDown}
        className="relative flex items-center rounded-md border border-border bg-surface p-0.5"
      >
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-y-0.5 rounded ring-1 ring-inset transition-[transform,width] duration-200 ease-out motion-reduce:transition-none',
            ENV_ACCENT[env].pill,
          )}
          style={{ transform: `translateX(${indicator.left}px)`, width: `${indicator.width}px` }}
        />
        {APP_ENVIRONMENTS.map((option, i) => {
          const active = option === env;
          return (
            <button
              key={option}
              ref={(node) => {
                btnRefs.current[i] = node;
              }}
              role="radio"
              aria-checked={active}
              tabIndex={i === focusIndex ? 0 : -1}
              onClick={() => select(option)}
              className={cn(
                'relative z-10 flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium tnum transition-colors',
                active ? 'text-fg' : 'text-fg-subtle hover:text-fg-muted',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'h-1.5 w-1.5 shrink-0 rounded-full transition-opacity',
                  ENV_ACCENT[option].dot,
                  active ? 'opacity-100' : 'opacity-40',
                )}
              />
              {t(`env.labels.${option}`)}
            </button>
          );
        })}
      </div>

      {pendingProd && (
        <div
          role="dialog"
          aria-label={t('env.prodConfirm.title')}
          className="absolute right-0 z-50 mt-1.5 w-64 rounded-xl border border-border-strong bg-surface p-3 shadow-2xl animate-[fade-in_120ms_ease-out]"
        >
          <p className="flex items-center gap-1.5 text-xs font-semibold text-status-down">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-status-down" />
            {t('env.prodConfirm.title')}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-fg-muted">
            {t('env.prodConfirm.body')}
          </p>
          <div className="mt-2.5 flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setPendingProd(false)}>
              {t('env.prodConfirm.cancel')}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEnv('production');
                setPendingProd(false);
              }}
            >
              {t('env.prodConfirm.confirm')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
