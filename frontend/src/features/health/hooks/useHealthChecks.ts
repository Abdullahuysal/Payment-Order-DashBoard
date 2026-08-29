import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useAppStore } from '@/app/store';

import { fetchHealthChecks } from '../api/health.api';
import { checksSignature, composeChecks } from '../checks';
import { useHealthConfigStore } from '../store';
import type { HealthRow, HealthSummary, ServiceHealth } from '../types';

export const HEALTH_REFETCH_MS = 15_000;

export const healthKeys = {
  all: ['health'] as const,
  list: (env: string, signature: string) => ['health', 'list', env, signature] as const,
};

interface UseHealthChecksResult {
  rows: HealthRow[];
  summary: HealthSummary;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  refetchIntervalMs: number;
  refetch: () => void;
}

export function useHealthChecks(): UseHealthChecksResult {
  const env = useAppStore((s) => s.environment);
  const customChecks = useHealthConfigStore((s) => s.customChecks);
  const overrides = useHealthConfigStore((s) => s.overrides);

  const checks = useMemo(() => composeChecks(customChecks, overrides), [customChecks, overrides]);
  const signature = useMemo(() => checksSignature(checks), [checks]);

  const query = useQuery({
    queryKey: healthKeys.list(env, signature),
    queryFn: ({ signal }) => fetchHealthChecks({ env, checks, signal }),
    refetchInterval: HEALTH_REFETCH_MS,
    refetchOnWindowFocus: true,
    staleTime: HEALTH_REFETCH_MS / 2,
    placeholderData: (prev) => prev,
  });

  const rows = useMemo<HealthRow[]>(() => {
    const byId = new Map<string, ServiceHealth>();
    for (const h of query.data ?? []) byId.set(h.checkId, h);
    return checks.map((check) => ({ check, health: byId.get(check.id) }));
  }, [checks, query.data]);

  const summary = useMemo<HealthSummary>(() => {
    const acc: HealthSummary = { total: rows.length, up: 0, degraded: 0, down: 0, unknown: 0 };
    for (const r of rows) acc[r.health?.status ?? 'unknown'] += 1;
    return acc;
  }, [rows]);

  return {
    rows,
    summary,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetchIntervalMs: HEALTH_REFETCH_MS,
    refetch: () => void query.refetch(),
  };
}
