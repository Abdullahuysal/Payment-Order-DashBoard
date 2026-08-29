import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAppStore } from '@/app/store';

import { serviceHealthApi } from '../api/health.api';
import { sortChecks } from '../mapping';
import type {
  CreateHealthCheckRequest,
  HealthCheck,
  HealthSummary,
  UpdateHealthCheckRequest,
} from '../types';

export const serviceHealthKeys = {
  all: ['service-health'] as const,
  list: (env: string) => ['service-health', 'checks', env] as const,
};

interface UseHealthChecksResult {
  checks: HealthCheck[];
  summary: HealthSummary;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
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

  const summary = useMemo<HealthSummary>(() => {
    const enabled = checks.filter((c) => c.isEnabled).length;
    return { total: checks.length, enabled, disabled: checks.length - enabled };
  }, [checks]);

  return {
    checks,
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
