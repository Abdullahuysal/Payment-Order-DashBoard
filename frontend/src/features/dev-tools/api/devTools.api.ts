import { apiClient } from '@/services/http';

import type { DevToolKey, DevToolRunRequest, DevToolRunResult } from '../types';
import { mockDevToolsApi } from './devTools.api.mock';

const R = '/api/v1/dev-tools';

const seg = (value: string): string => encodeURIComponent(value);

export interface DevToolsApi {
  run(key: DevToolKey, request: DevToolRunRequest, signal?: AbortSignal): Promise<DevToolRunResult>;
}

export const realDevToolsApi: DevToolsApi = {
  run(key, request, signal) {
    return apiClient().post<DevToolRunResult>(`${R}/${seg(key)}`, request, {
      ...(signal ? { signal } : {}),
    });
  },
};

function readMockFlag(): boolean {
  const raw = import.meta.env.VITE_DEVTOOLS_MOCK;
  if (raw == null || raw === '') return true;
  return !['false', '0', 'off', 'no'].includes(raw.toLowerCase());
}

export const DEVTOOLS_MOCK = readMockFlag();

export const devToolsApi: DevToolsApi = DEVTOOLS_MOCK ? mockDevToolsApi : realDevToolsApi;
