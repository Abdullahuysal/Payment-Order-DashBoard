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
  up: number;
  down: number;
  unknown: number;
}

export type HealthProbeStatus = 'up' | 'down' | 'error' | 'skipped';

export const HEALTH_PROBE_LABEL: Record<HealthProbeStatus, string> = {
  up: 'ayakta',
  down: 'beklenmeyen durum',
  error: 'ulaşılamadı',
  skipped: 'atlandı',
};

/** One executed probe: the service was really called and its status compared with expectedStatus. */
export interface HealthProbeResult {
  checkId: string;
  name: string;
  status: HealthProbeStatus;
  method: string;
  url: string;
  expectedStatus: number;
  httpStatus?: number | undefined;
  durationMs: number;
  error?: string | undefined;
  checkedAt: string;
}

export interface HealthProbeBatchResult {
  total: number;
  up: number;
  down: number;
  error: number;
  skipped: number;
  checkedAt: string;
  results: HealthProbeResult[];
}

/** Keyed by check id — the latest probe outcome the UI knows about. */
export type HealthProbeMap = Record<string, HealthProbeResult>;
