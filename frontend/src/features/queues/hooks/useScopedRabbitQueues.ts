import { useQueries } from '@tanstack/react-query';

import { useAppStore } from '@/app/store';

import { queuesApi } from '../api/queues.api';
import { rabbitHasProblem } from '../lib';
import { classifyRabbitQueue, type QueueCategory } from '../scope';
import type { RabbitQueue } from '../types';
import { queueKeys, useRefreshInterval } from './useQueues';
import type { QueueScope } from './useScope';

const FETCH_CAP = 200;
const MAX_HINTS = 6;

export interface ScopeSummary {
  total: number;
  error: number;
  skip: number;
  backlog: number;
  errorMessages: number;
  backlogMessages: number;
}

export interface ScopedRabbitView {
  rows: RabbitQueue[];
  categoryOf: Map<string, Set<QueueCategory>>;
  summary: ScopeSummary;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  capped: boolean;
}

const keyOf = (q: RabbitQueue) => `${q.virtualHost}::${q.name}`;

function worstFirst(a: RabbitQueue, b: RabbitQueue): number {
  const pa = rabbitHasProblem(a) ? 0 : 1;
  const pb = rabbitHasProblem(b) ? 0 : 1;
  return pa - pb || b.messagesReady - a.messagesReady || a.name.localeCompare(b.name, 'tr');
}

export function useScopedRabbitQueues(opts: {
  scope: QueueScope;
  enabled: boolean;
  serverFilters: { onlyProblems?: boolean; deadLetterOnly?: boolean };
  search: string;
  category: QueueCategory | null;
  page: number;
  pageSize: number;
}): ScopedRabbitView {
  const { scope, enabled, serverFilters, search, category, page, pageSize } = opts;
  const env = useAppStore((s) => s.environment);
  const refetchInterval = useRefreshInterval();

  const hints = scope.hints.length > 0 ? scope.hints.slice(0, MAX_HINTS) : [null];

  const queries = useQueries({
    queries: hints.map((hint) => {
      const params = {
        ...(serverFilters.onlyProblems ? { onlyProblems: true } : {}),
        ...(serverFilters.deadLetterOnly ? { deadLetterOnly: true } : {}),
        ...(hint ? { nameContains: hint } : {}),
        page: 1,
        pageSize: FETCH_CAP,
      };
      return {
        queryKey: queueKeys.rabbitQueues(env, params),
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          queuesApi.rabbitQueues(env, params, signal),
        enabled: enabled && scope.active,
        staleTime: 5_000,
        refetchInterval,
        placeholderData: (prev: unknown) => prev,
      };
    }),
  });

  const seen = new Set<string>();
  const merged: RabbitQueue[] = [];
  for (const q of queries.flatMap((r) => r.data?.items ?? [])) {
    const k = keyOf(q);
    if (seen.has(k)) continue;
    seen.add(k);
    if (scope.match(q.name)) merged.push(q);
  }

  const categoryOf = new Map<string, Set<QueueCategory>>();
  const summary: ScopeSummary = {
    total: merged.length,
    error: 0,
    skip: 0,
    backlog: 0,
    errorMessages: 0,
    backlogMessages: 0,
  };
  for (const q of merged) {
    const cats = classifyRabbitQueue(q);
    categoryOf.set(keyOf(q), cats);
    if (cats.has('error')) {
      summary.error += 1;
      summary.errorMessages += q.messages;
    }
    if (cats.has('skip')) summary.skip += 1;
    if (cats.has('backlog')) {
      summary.backlog += 1;
      summary.backlogMessages += q.messagesReady;
    }
  }

  const term = search.trim().toLocaleLowerCase('tr');
  const filtered = merged
    .filter((q) => {
      if (term && !`${q.name} ${q.virtualHost}`.toLocaleLowerCase('tr').includes(term))
        return false;
      if (category && !categoryOf.get(keyOf(q))?.has(category)) return false;
      return true;
    })
    .sort(worstFirst);

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return {
    rows,
    categoryOf,
    summary,
    page: safePage,
    pageSize,
    totalCount,
    totalPages,
    isLoading: queries.some((r) => r.isLoading),
    isFetching: queries.some((r) => r.isFetching),
    isError: queries.some((r) => r.isError),
    error: queries.find((r) => r.error)?.error,
    refetch: () => queries.forEach((r) => void r.refetch()),
    capped: queries.some((r) => (r.data?.totalPages ?? 1) > 1),
  };
}
