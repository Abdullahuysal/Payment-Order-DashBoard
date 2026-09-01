import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Segmented } from '@/components/ui';
import { cn } from '@/lib/cn';

import { useDebouncedValue } from '../hooks/useDebouncedValue';
import {
  EMPTY_FILTER,
  LEVEL_TONE,
  TONE_CHIP_ACTIVE,
  toggleLevel,
  type LogFilterState,
} from '../lib';
import { LOG_LEVELS, type TimeRangePreset } from '../types';

export function LogFilterBar({
  value,
  onChange,
}: {
  value: LogFilterState;
  onChange: (next: LogFilterState) => void;
}) {
  const { t } = useTranslation('logs');
  const [qDraft, setQDraft] = useState(value.q);
  const debouncedQ = useDebouncedValue(qDraft, 300);

  useEffect(() => {
    setQDraft(value.q);
  }, [value.q]);

  useEffect(() => {
    if (debouncedQ !== value.q) onChange({ ...value, q: debouncedQ });
  }, [debouncedQ, value, onChange]);

  const presets: TimeRangePreset[] = ['15m', '1h', '24h', 'custom'];
  const dirty =
    value.q !== '' ||
    value.levels.length > 0 ||
    value.service !== '' ||
    value.traceId !== '' ||
    value.preset !== EMPTY_FILTER.preset;

  return (
    <div className="space-y-2.5 rounded-lg border border-border bg-surface px-3 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search
            size={13}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-subtle"
          />
          <input
            type="search"
            value={qDraft}
            onChange={(e) => setQDraft(e.target.value)}
            placeholder={t('filter.qPlaceholder')}
            aria-label={t('filter.qAria')}
            spellCheck={false}
            className="tnum h-7 w-full rounded-md border border-border bg-bg pl-7 pr-7 text-xs text-fg placeholder:text-fg-subtle focus:border-border-strong focus:outline-none"
          />
        </div>

        <Segmented<TimeRangePreset>
          ariaLabel={t('filter.rangeAria')}
          size="sm"
          value={value.preset}
          onChange={(preset) => onChange({ ...value, preset })}
          options={presets.map((p) => ({ value: p, label: t(`presets.${p}`) }))}
        />

        {dirty && (
          <button
            type="button"
            onClick={() => onChange({ ...EMPTY_FILTER })}
            className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-[11px] text-fg-subtle hover:text-fg"
          >
            <X size={12} />
            {t('filter.reset')}
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] text-fg-subtle">{t('filter.levelLabel')}</span>
        {LOG_LEVELS.map((level) => {
          const active = value.levels.includes(level);
          const tone = LEVEL_TONE[level];
          return (
            <button
              key={level}
              type="button"
              aria-pressed={active}
              onClick={() => onChange({ ...value, levels: toggleLevel(value.levels, level) })}
              className={cn(
                'rounded border px-1.5 py-0.5 text-[11px] font-medium leading-none transition-colors',
                active
                  ? TONE_CHIP_ACTIVE[tone]
                  : 'border-border text-fg-subtle hover:border-border-strong hover:text-fg-muted',
              )}
            >
              {t(`levels.${level}`)}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={value.service}
          onChange={(e) => onChange({ ...value, service: e.target.value })}
          placeholder={t('filter.servicePlaceholder')}
          aria-label={t('filter.serviceAria')}
          spellCheck={false}
          className="tnum h-7 w-40 rounded-md border border-border bg-bg px-2 text-xs text-fg placeholder:text-fg-subtle focus:border-border-strong focus:outline-none"
        />
        <input
          type="text"
          value={value.traceId}
          onChange={(e) => onChange({ ...value, traceId: e.target.value })}
          placeholder={t('filter.traceIdPlaceholder')}
          aria-label={t('filter.traceIdAria')}
          spellCheck={false}
          className="tnum h-7 w-56 rounded-md border border-border bg-bg px-2 text-xs text-fg placeholder:text-fg-subtle focus:border-border-strong focus:outline-none"
        />

        {value.preset === 'custom' && (
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1 text-[11px] text-fg-subtle">
              {t('filter.from')}
              <input
                type="datetime-local"
                value={value.from}
                onChange={(e) => onChange({ ...value, from: e.target.value })}
                className="tnum h-7 rounded-md border border-border bg-bg px-2 text-xs text-fg focus:border-border-strong focus:outline-none"
              />
            </label>
            <label className="flex items-center gap-1 text-[11px] text-fg-subtle">
              {t('filter.to')}
              <input
                type="datetime-local"
                value={value.to}
                onChange={(e) => onChange({ ...value, to: e.target.value })}
                className="tnum h-7 rounded-md border border-border bg-bg px-2 text-xs text-fg focus:border-border-strong focus:outline-none"
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
