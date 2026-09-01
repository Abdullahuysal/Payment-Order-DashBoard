import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useAppStore } from '@/app/store';
import { Button, Segmented } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatCount } from '@/lib/format';
import { ENV_LABELS } from '@/services/config';

import { AiSummaryCard } from './components/AiSummaryCard';
import { ExceptionGroupsPanel } from './components/ExceptionGroupsPanel';
import { LevelFacetChips } from './components/LevelFacetChips';
import { LogDetailDrawer } from './components/LogDetailDrawer';
import { LogFilterBar } from './components/LogFilterBar';
import { LogTable } from './components/LogTable';
import { TimelineHistogram } from './components/TimelineHistogram';
import { LogPanelEmpty, LogPanelError, LogSkeleton } from './components/kit';
import { logKeys, useLogAiSummary, useLogExceptions, useLogSearch } from './hooks/useLogs';
import {
  EMPTY_FILTER,
  filterRange,
  filterToExceptionParams,
  filterToParams,
  toggleLevel,
  type LogFilterState,
} from './lib';
import type { LogEntry } from './types';

const PAGE_SIZE = 50;
type Tab = 'logs' | 'exceptionsAi';

export default function LogsPage() {
  const { t } = useTranslation('logs');
  const env = useAppStore((s) => s.environment);
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<LogFilterState>(EMPTY_FILTER);
  const [rangeAnchor, setRangeAnchor] = useState(() => Date.now());
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<Tab>('logs');
  const [selected, setSelected] = useState<LogEntry | null>(null);

  const params = useMemo(
    () => filterToParams(filter, page, PAGE_SIZE, rangeAnchor),
    [filter, page, rangeAnchor],
  );
  const exceptionParams = useMemo(
    () => filterToExceptionParams(filter, rangeAnchor),
    [filter, rangeAnchor],
  );
  const aiReq = useMemo(() => {
    const range = filterRange(filter, rangeAnchor);
    return { ...(range.from ? { from: range.from } : {}), ...(range.to ? { to: range.to } : {}) };
  }, [filter, rangeAnchor]);

  const search = useLogSearch(params);
  const exceptions = useLogExceptions(exceptionParams, tab === 'exceptionsAi');
  const ai = useLogAiSummary(aiReq, false);

  const applyFilter = useCallback((next: LogFilterState) => {
    setFilter(next);
    setPage(1);
    setRangeAnchor(Date.now());
  }, []);

  const refreshAll = () => {
    setRangeAnchor(Date.now());
    void queryClient.invalidateQueries({ queryKey: logKeys.all });
  };

  const facets = search.data?.facets;
  const items = search.data?.items ?? [];
  const totalPages = search.data?.totalPages ?? 1;
  const anyFetching = search.isFetching || (tab === 'exceptionsAi' && exceptions.isFetching);

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-fg">{t('page.title')}</h1>
          <p className="mt-0.5 max-w-2xl text-xs text-fg-muted">
            {t('page.subtitle', { env: ENV_LABELS[env] })}
          </p>
        </div>
        <Button size="sm" onClick={refreshAll} disabled={anyFetching}>
          <RefreshCw size={13} className={cn(anyFetching && 'motion-safe:animate-spin')} />
          {t('states.retry')}
        </Button>
      </header>

      <LogFilterBar value={filter} onChange={applyFilter} />

      <Segmented<Tab>
        ariaLabel={t('page.title')}
        value={tab}
        onChange={setTab}
        options={[
          { value: 'logs', label: t('tabs.logs') },
          { value: 'exceptionsAi', label: t('tabs.exceptionsAi') },
        ]}
      />

      {tab === 'logs' ? (
        <div className="space-y-3">
          <TimelineHistogram buckets={facets?.histogram} />
          <LevelFacetChips
            facets={facets?.byLevel}
            active={filter.levels}
            onToggle={(level) =>
              applyFilter({ ...filter, levels: toggleLevel(filter.levels, level) })
            }
          />

          {search.isLoading && !search.data ? (
            <LogSkeleton />
          ) : search.error && !search.data ? (
            <LogPanelError error={search.error} onRetry={() => void search.refetch()} />
          ) : items.length === 0 ? (
            <LogPanelEmpty message={t('table.empty')} />
          ) : (
            <>
              <div className="flex items-center justify-between text-[11px] text-fg-subtle">
                <span className="tnum">
                  {t('table.total', { value: formatCount(search.data?.totalCount ?? 0) })}
                </span>
                {totalPages > 1 && (
                  <span className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1 || search.isFetching}
                    >
                      ‹
                    </Button>
                    <span className="tnum">
                      {page} / {totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages || search.isFetching}
                    >
                      ›
                    </Button>
                  </span>
                )}
              </div>
              <LogTable entries={items} selectedId={selected?.id} onSelect={setSelected} />
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          <div>
            {exceptions.isLoading && !exceptions.data ? (
              <LogSkeleton rows={4} />
            ) : exceptions.error && !exceptions.data ? (
              <LogPanelError error={exceptions.error} onRetry={() => void exceptions.refetch()} />
            ) : (
              <ExceptionGroupsPanel groups={exceptions.data ?? []} />
            )}
          </div>
          <AiSummaryCard
            summary={ai.query.data ?? ai.refresh.data}
            isLoading={ai.query.isFetching}
            isGenerating={ai.refresh.isPending}
            error={ai.refresh.error ?? ai.query.error}
            onGenerate={() => ai.refresh.mutate()}
          />
        </div>
      )}

      <LogDetailDrawer entry={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
