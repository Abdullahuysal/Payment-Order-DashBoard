import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';

import { useAppStore } from '@/app/store';
import type { AppEnvironment } from '@/types';

import { MOCK_ORDER_SAMPLES } from './api/orders.api.mock';
import { ORDERS_MOCK } from './api/orders.api';
import { LookupResultsList } from './components/LookupResultsList';
import { RecentLookupsList } from './components/RecentLookupsList';
import { SearchBar } from './components/SearchBar';
import { InlineHint, PanelHeading, ProdDisabledNotice } from './components/kit';
import { useOrderLookup, type LookupInput } from './hooks/useOrderLookup';
import { useRecentLookups } from './hooks/useRecentLookups';
import { isEnvSupported } from './lib';
import type { LookupField } from './types';

export default function OrdersPage() {
  const env = useAppStore((s) => s.environment);
  if (!isEnvSupported(env)) return <ProdDisabledNotice />;
  return <OrdersView env={env} />;
}

function OrdersView({ env }: { env: AppEnvironment }) {
  const { t } = useTranslation(['orders', 'common']);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const navigatedFor = useRef<string | null>(null);

  const [field, setField] = useState<LookupField>('orderNumber');
  const [value, setValue] = useState('');
  const [lookupInput, setLookupInput] = useState<LookupInput | null>(null);

  const lookup = useOrderLookup(lookupInput);
  const recents = useRecentLookups();

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== '/' || event.defaultPrevented) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;
      event.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!lookup.isSuccess || !lookupInput) return;
    const matches = lookup.data.matches;
    const key = `${lookupInput.field}:${lookupInput.value}`;
    if (matches.length === 1 && matches[0] && navigatedFor.current !== key) {
      navigatedFor.current = key;
      void navigate(`/orders/${matches[0].orderId}`);
    }
  }, [lookup.isSuccess, lookup.data, lookupInput, navigate]);

  const submit = () => {
    const trimmed = value.trim();
    if (trimmed.length === 0) return;
    if (field === 'orderNumber') {
      void navigate(`/orders/${encodeURIComponent(trimmed)}`);
      return;
    }
    navigatedFor.current = null;
    setLookupInput({ field, value: trimmed });
  };

  const matches = lookup.data?.matches ?? [];
  const showResults = lookupInput !== null && field !== 'orderNumber';

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="text-base font-semibold text-fg">{t('orders:page.title')}</h1>
        <p className="mt-0.5 text-xs text-fg-muted">
          <Trans
            t={t}
            i18nKey="orders:page.subtitle"
            values={{ env: t(`common:env.labels.${env}`) }}
            components={{ b: <span className="text-fg" /> }}
          />
        </p>
      </header>

      <SearchBar
        field={field}
        value={value}
        pending={lookup.isFetching}
        inputRef={inputRef}
        onFieldChange={(next) => {
          setField(next);
          setLookupInput(null);
        }}
        onValueChange={setValue}
        onSubmit={submit}
      />

      {showResults && (
        <section className="space-y-2">
          <PanelHeading>{t('orders:results.heading')}</PanelHeading>
          {lookup.isFetching ? (
            <div className="h-16 animate-pulse rounded-lg border border-border bg-surface motion-reduce:animate-none" />
          ) : lookup.isError ? (
            <InlineHint className="border-status-down/30 text-status-down">
              {t('orders:results.error', { message: lookup.error.message })}
            </InlineHint>
          ) : matches.length === 0 ? (
            <InlineHint>{t('orders:results.empty')}</InlineHint>
          ) : (
            <LookupResultsList matches={matches} />
          )}
        </section>
      )}

      <RecentLookupsList items={recents.items} onClear={recents.clear} />

      {!showResults && recents.items.length === 0 && (
        <section className="space-y-2">
          <PanelHeading>{t('orders:how.heading')}</PanelHeading>
          <div className="rounded-lg border border-border bg-surface px-4 py-3 text-xs leading-relaxed text-fg-muted">
            <p>
              <Trans
                t={t}
                i18nKey="orders:how.body"
                components={{ b: <span className="text-fg" />, k: <span className="tnum" /> }}
              />
            </p>
            {ORDERS_MOCK && (
              <div className="mt-2 border-t border-border pt-2">
                <span className="text-[11px] text-fg-subtle">{t('orders:how.sampleLabel')}</span>
                <ul className="mt-1 space-y-0.5">
                  {MOCK_ORDER_SAMPLES.map((orderNumber) => (
                    <li key={orderNumber} className="flex gap-2">
                      <span className="tnum text-fg">{orderNumber}</span>
                      <span className="text-fg-subtle">
                        — {t(`orders:mockSamples.${orderNumber}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
