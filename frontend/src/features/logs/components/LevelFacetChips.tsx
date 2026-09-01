import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';
import { formatCount } from '@/lib/format';

import { LEVEL_TONE, TONE_CHIP_ACTIVE } from '../lib';
import type { LevelCount, LogLevel } from '../types';

export function LevelFacetChips({
  facets,
  active,
  onToggle,
}: {
  facets: LevelCount[] | undefined;
  active: LogLevel[];
  onToggle: (level: LogLevel) => void;
}) {
  const { t } = useTranslation('logs');

  if (!facets || facets.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-surface px-3 py-2 text-[11px] text-fg-subtle">
        {t('facets.empty')}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] text-fg-subtle">{t('facets.title')}</span>
      {facets.map(({ level, count }) => {
        const on = active.includes(level);
        return (
          <button
            key={level}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(level)}
            className={cn(
              'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] font-medium leading-none transition-colors',
              on
                ? TONE_CHIP_ACTIVE[LEVEL_TONE[level]]
                : 'border-border text-fg-muted hover:border-border-strong hover:text-fg',
            )}
          >
            {t(`levels.${level}`)}
            <span className="tnum text-fg-subtle">{formatCount(count)}</span>
          </button>
        );
      })}
    </div>
  );
}
