import { ENVIRONMENT_HEADER } from '@/services/config';
import { apiClient } from '@/services/http';
import type { AppEnvironment } from '@/types';

import type { LookupField, LookupResponse, OrderDossier } from '../types';
import { mockOrdersApi } from './orders.api.mock';

const R = '/api/v1/orders';

function headers(env: AppEnvironment): Record<string, string> {
  return { [ENVIRONMENT_HEADER]: env };
}

const seg = (value: string): string => encodeURIComponent(value);

export interface OrdersApi {
  getDossier(env: AppEnvironment, orderId: string, signal?: AbortSignal): Promise<OrderDossier>;
  lookup(
    env: AppEnvironment,
    field: LookupField,
    value: string,
    signal?: AbortSignal,
  ): Promise<LookupResponse>;
}

export const realOrdersApi: OrdersApi = {
  getDossier(env, orderId, signal) {
    return apiClient().get<OrderDossier>(`${R}/${seg(orderId)}`, {
      headers: headers(env),
      ...(signal ? { signal } : {}),
    });
  },

  lookup(env, field, value, signal) {
    return apiClient().get<LookupResponse>(`${R}/lookup`, {
      headers: headers(env),
      query: { field, value },
      ...(signal ? { signal } : {}),
    });
  },
};

function readMockFlag(): boolean {
  const raw = import.meta.env.VITE_ORDERS_MOCK;
  if (raw == null || raw === '') return true;
  return !['false', '0', 'off', 'no'].includes(raw.toLowerCase());
}

export const ORDERS_MOCK = readMockFlag();

export const ordersApi: OrdersApi = ORDERS_MOCK ? mockOrdersApi : realOrdersApi;
