import type { Status } from '@/types';

export type HealthGroup = 'payment' | 'order' | 'platform' | 'custom';

export const HEALTH_GROUPS: readonly HealthGroup[] = [
  'payment',
  'order',
  'platform',
  'custom',
] as const;

export const HEALTH_GROUP_LABEL: Record<HealthGroup, string> = {
  payment: 'Ödeme',
  order: 'Sipariş',
  platform: 'Platform',
  custom: 'Özel',
};

export interface HealthCheck {
  id: string;
  name: string;
  group: HealthGroup;
  method: string;
  url: string;
  headers?: Record<string, string> | undefined;
  body?: string | undefined;
  expectedStatus: number;
  source: 'builtin' | 'custom';
  createdAt?: string | undefined;
}

export interface ServiceHealth {
  checkId: string;
  name: string;
  group: HealthGroup;
  probeUrl: string;
  method: string;
  status: Status;
  httpStatus: number | null;
  latencyMs: number | null;
  checkedAt: string;
  detail?: string | undefined;
}

export interface HealthRow {
  check: HealthCheck;
  health: ServiceHealth | undefined;
}

export interface HealthSummary {
  total: number;
  up: number;
  degraded: number;
  down: number;
  unknown: number;
}
