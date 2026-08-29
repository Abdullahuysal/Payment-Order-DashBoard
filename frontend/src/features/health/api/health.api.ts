import { ENVIRONMENT_HEADER } from '@/services/config';
import { apiClient } from '@/services/http';
import type { AppEnvironment } from '@/types';

import type { CreateHealthCheckRequest, HealthCheck, UpdateHealthCheckRequest } from '../types';

const RESOURCE = '/api/v1/service-health/checks';

function envHeaders(env: AppEnvironment): Record<string, string> {
  return { [ENVIRONMENT_HEADER]: env };
}

export const serviceHealthApi = {
  list(env: AppEnvironment, signal?: AbortSignal): Promise<HealthCheck[]> {
    return apiClient().get<HealthCheck[]>(RESOURCE, {
      headers: envHeaders(env),
      ...(signal ? { signal } : {}),
    });
  },

  getById(env: AppEnvironment, id: string, signal?: AbortSignal): Promise<HealthCheck> {
    return apiClient().get<HealthCheck>(`${RESOURCE}/${id}`, {
      headers: envHeaders(env),
      ...(signal ? { signal } : {}),
    });
  },

  create(env: AppEnvironment, input: CreateHealthCheckRequest): Promise<HealthCheck> {
    return apiClient().post<HealthCheck>(RESOURCE, input, { headers: envHeaders(env) });
  },

  update(env: AppEnvironment, id: string, input: UpdateHealthCheckRequest): Promise<HealthCheck> {
    return apiClient().put<HealthCheck>(`${RESOURCE}/${id}`, input, { headers: envHeaders(env) });
  },

  remove(env: AppEnvironment, id: string): Promise<void> {
    return apiClient().delete<void>(`${RESOURCE}/${id}`, { headers: envHeaders(env) });
  },
};
