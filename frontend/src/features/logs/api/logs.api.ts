import { ENVIRONMENT_HEADER } from '@/services/config';
import { apiClient } from '@/services/http';
import type { AppEnvironment } from '@/types';

import type {
  AiSummary,
  AiSummaryRequest,
  ExceptionGroup,
  ExceptionParams,
  LogEntry,
  LogSearchParams,
  LogSearchResponse,
  SavedQuery,
} from '../types';

const R = '/api/v1/logs';

function headers(env: AppEnvironment): Record<string, string> {
  return { [ENVIRONMENT_HEADER]: env };
}

type QueryValue = string | number | boolean | null | undefined;

function opts(env: AppEnvironment, signal?: AbortSignal, query?: Record<string, QueryValue>) {
  return {
    headers: headers(env),
    ...(signal ? { signal } : {}),
    ...(query ? { query } : {}),
  };
}

function searchQuery(params: LogSearchParams): Record<string, QueryValue> {
  const { levels, ...rest } = params;
  return {
    ...(rest as Record<string, QueryValue>),
    ...(levels && levels.length > 0 ? { levels: levels.join(',') } : {}),
  };
}

export const logsApi = {
  search(
    env: AppEnvironment,
    params: LogSearchParams,
    signal?: AbortSignal,
  ): Promise<LogSearchResponse> {
    return apiClient().get<LogSearchResponse>(
      `${R}/search`,
      opts(env, signal, searchQuery(params)),
    );
  },

  getById(env: AppEnvironment, id: string, signal?: AbortSignal): Promise<LogEntry> {
    return apiClient().get<LogEntry>(`${R}/${encodeURIComponent(id)}`, opts(env, signal));
  },

  exceptions(
    env: AppEnvironment,
    params: ExceptionParams,
    signal?: AbortSignal,
  ): Promise<ExceptionGroup[]> {
    return apiClient().get<ExceptionGroup[]>(
      `${R}/exceptions`,
      opts(env, signal, params as Record<string, QueryValue>),
    );
  },

  aiSummary(env: AppEnvironment, body: AiSummaryRequest, signal?: AbortSignal): Promise<AiSummary> {
    return apiClient().post<AiSummary>(`${R}/ai-summary`, body, opts(env, signal));
  },

  savedQueries: {
    get(env: AppEnvironment, signal?: AbortSignal): Promise<SavedQuery[]> {
      return apiClient().get<SavedQuery[]>(`${R}/saved-queries`, opts(env, signal));
    },

    put(env: AppEnvironment, queries: SavedQuery[], signal?: AbortSignal): Promise<SavedQuery[]> {
      return apiClient().put<SavedQuery[]>(`${R}/saved-queries`, queries, opts(env, signal));
    },
  },
};
