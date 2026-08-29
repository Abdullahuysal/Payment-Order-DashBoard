import { apiClientForEnv } from '@/services/http';
import type { AppEnvironment } from '@/types';

import { mockHealthChecks } from '../mock';
import type { HealthCheck, ServiceHealth } from '../types';

export interface FetchHealthArgs {
  env: AppEnvironment;
  checks: HealthCheck[];
  signal?: AbortSignal;
}

export interface ProbeSpec {
  id: string;
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: string;
  expectedStatus: number;
}

export function toProbeSpec(c: HealthCheck): ProbeSpec {
  return {
    id: c.id,
    method: c.method,
    url: c.url,
    expectedStatus: c.expectedStatus,
    ...(c.headers && Object.keys(c.headers).length > 0 ? { headers: c.headers } : {}),
    ...(c.body !== undefined ? { body: c.body } : {}),
  };
}

export async function fetchHealthChecks({
  env,
  checks,
}: FetchHealthArgs): Promise<ServiceHealth[]> {
  void apiClientForEnv(env);

  return mockHealthChecks(env, checks);
}
