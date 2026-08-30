import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { useAppStore } from '@/app/store';
import { HttpError } from '@/services/http';

import { ordersApi } from '../api/orders.api';
import type { OrderDossier } from '../types';

export const orderKeys = {
  all: ['orders'] as const,
  dossier: (env: string, orderId: string) => ['orders', 'dossier', env, orderId] as const,
  lookup: (env: string, field: string, value: string) =>
    ['orders', 'lookup', env, field, value] as const,
};

function isNotFound(error: unknown): boolean {
  return error instanceof HttpError && error.status === 404;
}

export function useOrderDossier(orderId: string | undefined): UseQueryResult<OrderDossier> {
  const env = useAppStore((s) => s.environment);

  return useQuery({
    queryKey: orderKeys.dossier(env, orderId ?? ''),
    queryFn: ({ signal }) => ordersApi.getDossier(env, orderId ?? '', signal),
    enabled: Boolean(orderId),
    staleTime: 15_000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => !isNotFound(error) && failureCount < 2,
  });
}

export { isNotFound as isOrderNotFound };
