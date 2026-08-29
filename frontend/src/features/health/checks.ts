import { joinUrl } from '@/lib/format';
import { MONITORED_APPS_SEED } from '@/services/config';

import type { HealthCheck } from './types';

export function builtinChecks(overrides: Record<string, string>): HealthCheck[] {
  return MONITORED_APPS_SEED.map((app) => {
    const alivePath = overrides[app.id] ?? app.alivePath;
    return {
      id: app.id,
      name: app.name,
      group: app.group,
      method: 'GET',
      url: joinUrl(app.baseUrl, alivePath),
      expectedStatus: 200,
      source: 'builtin',
    } satisfies HealthCheck;
  });
}

export function builtinAlivePath(checkId: string, overrides: Record<string, string>): string {
  const seed = MONITORED_APPS_SEED.find((a) => a.id === checkId);
  if (!seed) return '/';
  return overrides[checkId] ?? seed.alivePath;
}

export function isBuiltinPathOverridden(
  checkId: string,
  overrides: Record<string, string>,
): boolean {
  return checkId in overrides;
}

export function composeChecks(
  customChecks: HealthCheck[],
  overrides: Record<string, string>,
): HealthCheck[] {
  return [...builtinChecks(overrides), ...customChecks];
}

export function checksSignature(checks: HealthCheck[]): string {
  return checks.map((c) => `${c.id}|${c.method}|${c.url}|${c.expectedStatus}`).join('~');
}
