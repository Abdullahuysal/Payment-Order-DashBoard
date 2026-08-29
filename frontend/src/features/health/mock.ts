import type { AppEnvironment, Status } from '@/types';

import type { HealthCheck, ServiceHealth } from './types';

const BASE_STATUS: Record<string, Status> = {
  'payment-gateway': 'up',
  'payment-3ds': 'up',
  'wallet-service': 'degraded',
  'order-orchestrator': 'up',
  'order-fulfillment': 'down',
  'notification-service': 'up',
};

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function jitter(base: number, spread: number): number {
  return Math.max(1, Math.round(base + (Math.random() - 0.5) * spread));
}

function baselineFor(check: HealthCheck): Status {
  if (check.source === 'builtin') return BASE_STATUS[check.id] ?? 'unknown';
  const bucket = hash(check.id) % 10;
  if (bucket === 0) return 'down';
  if (bucket === 1 || bucket === 2) return 'degraded';
  return 'up';
}

function rollStatus(check: HealthCheck, env: AppEnvironment): Status {
  const base = baselineFor(check);
  const flip = Math.random();
  if (env === 'dev' && base === 'up' && flip > 0.85) return 'degraded';
  if (env === 'production' && base === 'degraded' && flip > 0.7) return 'up';
  return base;
}

function toResult(check: HealthCheck, env: AppEnvironment): ServiceHealth {
  const status = rollStatus(check, env);

  const latencyMs =
    status === 'down' ? null : status === 'degraded' ? jitter(1400, 900) : jitter(180, 140);

  const httpStatus =
    status === 'down' ? null : status === 'degraded' ? check.expectedStatus : check.expectedStatus;

  const detail =
    status === 'down'
      ? 'Bağlantı kurulamadı (ECONNREFUSED)'
      : status === 'degraded'
        ? 'Yanıt süresi eşiğin üzerinde'
        : undefined;

  return {
    checkId: check.id,
    name: check.name,
    group: check.group,
    probeUrl: check.url,
    method: check.method,
    status,
    httpStatus,
    latencyMs,
    checkedAt: new Date().toISOString(),
    detail,
  };
}

export function mockHealthChecks(
  env: AppEnvironment,
  checks: HealthCheck[],
): Promise<ServiceHealth[]> {
  const results = checks.map((c) => toResult(c, env));
  return new Promise((resolve) => setTimeout(() => resolve(results), 350));
}
