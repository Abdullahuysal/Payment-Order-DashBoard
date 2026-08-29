import type { HealthCheck, UpdateHealthCheckRequest } from './types';

export function toUpdateRequest(
  check: HealthCheck,
  patch: Partial<UpdateHealthCheckRequest> = {},
): UpdateHealthCheckRequest {
  return {
    name: check.name,
    group: check.group,
    method: check.method,
    url: check.url,
    expectedStatus: check.expectedStatus,
    isEnabled: check.isEnabled,
    rowVersion: check.rowVersion,
    ...(check.headers && Object.keys(check.headers).length > 0 ? { headers: check.headers } : {}),
    ...(check.body !== undefined ? { body: check.body } : {}),
    ...patch,
  };
}

export function sortChecks(checks: readonly HealthCheck[]): HealthCheck[] {
  const groupOrder: Record<HealthCheck['group'], number> = {
    payment: 0,
    order: 1,
    platform: 2,
    custom: 3,
  };
  return [...checks].sort(
    (a, b) => groupOrder[a.group] - groupOrder[b.group] || a.name.localeCompare(b.name, 'tr'),
  );
}
