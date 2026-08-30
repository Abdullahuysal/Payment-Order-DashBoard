import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAppStore } from '@/app/store';

import { serviceHealthApi } from '../api/health.api';
import { sortChecks } from '../mapping';
import type {
  CreateHealthCheckRequest,
  HealthCheck,
  HealthProbeMap,
  HealthProbeResult,
  HealthSummary,
  UpdateHealthCheckRequest,
} from '../types';

export const serviceHealthKeys = {
  all: ['service-health'] as const,
  list: (env: string) => ['service-health', 'checks', env] as const,
  probes: (env: string) => ['service-health', 'probes', env] as const,
};

const EMPTY_PROBES: HealthProbeMap = {};

interface UseHealthChecksResult {
  checks: HealthCheck[];
  probes: HealthProbeMap;
  summary: HealthSummary;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Client-side cache of the latest probe outcome per check. Nothing fetches it — the run
 * mutations write into it, so the cards keep showing the last real result until the next run.
 */
export function useHealthProbes(): HealthProbeMap {
  const env = useAppStore((s) => s.environment);
  const { data } = useQuery({
    queryKey: serviceHealthKeys.probes(env),
    queryFn: () => EMPTY_PROBES,
    initialData: EMPTY_PROBES,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  return data;
}

function useProbeWriter() {
  const env = useAppStore((s) => s.environment);
  const queryClient = useQueryClient();

  return (results: readonly HealthProbeResult[]) => {
    queryClient.setQueryData<HealthProbeMap>(serviceHealthKeys.probes(env), (previous) => {
      const next: HealthProbeMap = { ...(previous ?? EMPTY_PROBES) };
      for (const result of results) next[result.checkId] = result;
      return next;
    });
  };
}

export function useHealthChecks(): UseHealthChecksResult {
  const env = useAppStore((s) => s.environment);

  const query = useQuery({
    queryKey: serviceHealthKeys.list(env),
    queryFn: ({ signal }) => serviceHealthApi.list(env, signal),
    refetchOnWindowFocus: true,
    staleTime: 10_000,
  });

  const checks = useMemo(() => sortChecks(query.data ?? []), [query.data]);
  const probes = useHealthProbes();

  const summary = useMemo<HealthSummary>(() => {
    const enabled = checks.filter((c) => c.isEnabled).length;
    let up = 0;
    let down = 0;
    for (const check of checks) {
      const status = probes[check.id]?.status;
      if (status === 'up') up += 1;
      else if (status === 'down' || status === 'error') down += 1;
    }
    return {
      total: checks.length,
      enabled,
      disabled: checks.length - enabled,
      up,
      down,
      unknown: checks.length - up - down,
    };
  }, [checks, probes]);

  return {
    checks,
    probes,
    summary,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: () => void query.refetch(),
  };
}

function useInvalidateList() {
  const env = useAppStore((s) => s.environment);
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: serviceHealthKeys.list(env) });
}

export function useCreateHealthCheck() {
  const env = useAppStore((s) => s.environment);
  const invalidate = useInvalidateList();
  return useMutation({
    mutationFn: (input: CreateHealthCheckRequest) => serviceHealthApi.create(env, input),
    onSuccess: invalidate,
  });
}

export function useUpdateHealthCheck() {
  const env = useAppStore((s) => s.environment);
  const invalidate = useInvalidateList();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateHealthCheckRequest }) =>
      serviceHealthApi.update(env, id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteHealthCheck() {
  const env = useAppStore((s) => s.environment);
  const invalidate = useInvalidateList();
  return useMutation({
    mutationFn: (id: string) => serviceHealthApi.remove(env, id),
    onSuccess: invalidate,
  });
}

/** Runs one check for real and stores its outcome. */
export function useRunHealthCheck() {
  const env = useAppStore((s) => s.environment);
  const writeProbes = useProbeWriter();
  return useMutation({
    mutationFn: (id: string) => serviceHealthApi.run(env, id),
    onSuccess: (result) => writeProbes([result]),
  });
}

export function useRunAllHealthChecks() {
  const env = useAppStore((s) => s.environment);
  const writeProbes = useProbeWriter();
  return useMutation({
    mutationFn: () => serviceHealthApi.runAll(env),
    onSuccess: (batch) => writeProbes(batch.results),
  });
}
