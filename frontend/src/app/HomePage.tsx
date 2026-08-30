import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useAppStore } from '@/app/store';
import { Badge } from '@/components/ui';
import { MODULES } from '@/lib/constants';

export default function HomePage() {
  const { t } = useTranslation(['nav', 'common']);
  const env = useAppStore((s) => s.environment);

  return (
    <div className="mx-auto max-w-4xl py-6">
      <p className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
        {t('nav:home.eyebrow')}
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-fg">{t('nav:home.title')}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fg-muted">{t('nav:home.intro')}</p>

      <div className="mt-5 flex items-center gap-3">
        <Link
          to="/health"
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-fg transition-colors hover:bg-primary/90"
        >
          {t('nav:home.ctaHealth')}
          <ArrowRight size={14} />
        </Link>
        <span className="text-xs text-fg-subtle">
          {t('nav:home.activeEnv')}{' '}
          <span className="tnum text-fg-muted">{t(`common:env.labels.${env}`)}</span>
        </span>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link
              key={mod.id}
              to={`/${mod.path}`}
              className="group rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong"
            >
              <div className="flex items-start justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-2 text-fg-muted group-hover:text-fg">
                  <Icon size={17} strokeWidth={1.75} />
                </span>
                <Badge tone={mod.implemented ? 'up' : 'neutral'}>
                  {mod.implemented ? t('nav:home.tags.active') : t('nav:home.tags.soon')}
                </Badge>
              </div>
              <h2 className="mt-3 text-sm font-semibold text-fg">
                {t(`nav:modules.${mod.id}.label`)}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-fg-muted">
                {t(`nav:modules.${mod.id}.description`)}
              </p>
            </Link>
          );
        })}
      </div>

      <p className="mt-8 text-[11px] text-fg-subtle">{t('nav:home.footer')}</p>
    </div>
  );
}
