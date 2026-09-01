import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';

import { useAppStore } from '@/app/store';
import type { AppEnvironment } from '@/types';

import { logsApi } from '../api/logs.api';
import type {
  AiSummaryRequest,
  ExceptionGroup,
  ExceptionParams,
  LogSearchParams,
  LogSearchResponse,
  SavedQuery,
} from '../types';

const AI_SUMMARY_STALE_MS = 60 * 60 * 1000;

export const logKeys = {
  all: ['logs'] as const,
  search: (env: string, params: LogSearchParams) => ['logs', 'search', env, params] as const,
  exceptions: (env: string, params: ExceptionParams) =>
    ['logs', 'exceptions', env, params] as const,
  aiSummary: (env: string, req: AiSummaryRequest) => ['logs', 'ai-summary', env, req] as const,
  savedQueries: (env: string) => ['logs', 'saved-queries', env] as const,
};

function useEnv(): AppEnvironment {
  return useAppStore((s) => s.environment);
}

export function useLogSearch(
  params: LogSearchParams,
  enabled = true,
): UseQueryResult<LogSearchResponse> {
  const env = useEnv();
  return useQuery({
    queryKey: logKeys.search(env, params),
    queryFn: ({ signal }) => logsApi.search(env, params, signal),
    staleTime: 15_000,
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useLogExceptions(
  params: ExceptionParams,
  enabled = true,
): UseQueryResult<ExceptionGroup[]> {
  const env = useEnv();
  return useQuery({
    queryKey: logKeys.exceptions(env, params),
    queryFn: ({ signal }) => logsApi.exceptions(env, params, signal),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    enabled,
  });
}

/** AI özeti pahalı; sonuç 1 saat taze tutulur, "yenile" düğmesi force ile mutasyona gider. */
export function useLogAiSummary(req: AiSummaryRequest, enabled: boolean) {
  const env = useEnv();
  const queryClient = useQueryClient();
  const key = logKeys.aiSummary(env, req);

  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => logsApi.aiSummary(env, req, signal),
    staleTime: AI_SUMMARY_STALE_MS,
    gcTime: AI_SUMMARY_STALE_MS,
    enabled,
  });

  const refresh = useMutation({
    mutationFn: () => logsApi.aiSummary(env, { ...req, force: true }),
    onSuccess: (data) => {
      queryClient.setQueryData(key, data);
    },
  });

  return { query, refresh };
}

export function useSavedQueries() {
  const env = useEnv();
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: logKeys.savedQueries(env),
    queryFn: ({ signal }) => logsApi.savedQueries.get(env, signal),
    staleTime: 60_000,
  });

  const save = useMutation({
    mutationFn: (queries: SavedQuery[]) => logsApi.savedQueries.put(env, queries),
    onSuccess: (data) => {
      queryClient.setQueryData(logKeys.savedQueries(env), data);
    },
  });

  return { list, save };
}
