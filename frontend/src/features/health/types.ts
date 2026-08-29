import type { AppEnvironment } from '@/types';

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
  environment: AppEnvironment;
  name: string;
  group: HealthGroup;
  method: string;
  url: string;
  headers?: Record<string, string> | undefined;
  body?: string | undefined;
  expectedStatus: number;
  isEnabled: boolean;
  source: 'builtin' | 'custom';
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
  rowVersion: string;
}

export interface CreateHealthCheckRequest {
  name: string;
  group: HealthGroup;
  method: string;
  url: string;
  headers?: Record<string, string> | undefined;
  body?: string | undefined;
  expectedStatus: number;
}

export interface UpdateHealthCheckRequest extends CreateHealthCheckRequest {
  isEnabled: boolean;
  rowVersion: string;
}

export interface HealthSummary {
  total: number;
  enabled: number;
  disabled: number;
}
