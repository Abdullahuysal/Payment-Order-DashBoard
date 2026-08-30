import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { useAppStore } from '@/app/store';

import { ordersApi } from '../api/orders.api';
import type { LookupField, LookupResponse } from '../types';

import { orderKeys } from './useOrderDossier';

export interface LookupInput {
  field: LookupField;
  value: string;
}

export function useOrderLookup(input: LookupInput | null): UseQueryResult<LookupResponse> {
  const env = useAppStore((s) => s.environment);
  const field = input?.field ?? 'orderNumber';
  const value = input?.value.trim() ?? '';

  return useQuery({
    queryKey: orderKeys.lookup(env, field, value),
    queryFn: ({ signal }) => ordersApi.lookup(env, field, value, signal),
    enabled: input !== null && value.length > 0,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
