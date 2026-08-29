import type { AppEnvironment } from '@/types';

export const APP_ENVIRONMENTS: readonly AppEnvironment[] = [
  'dev',
  'preprod',
  'production',
] as const;

export const ENV_LABELS: Record<AppEnvironment, string> = {
  dev: 'Dev',
  preprod: 'Preprod',
  production: 'Prod',
};

export const ENVIRONMENT_HEADER = 'X-Environment';

interface AppConfig {
  apiBaseUrl: string;
  defaultEnv: AppEnvironment;
  httpTimeoutMs: number;
}

function readDefaultEnv(): AppEnvironment {
  const raw = import.meta.env.VITE_DEFAULT_ENV;
  return raw && APP_ENVIRONMENTS.includes(raw) ? raw : 'dev';
}

function readTimeout(): number {
  const parsed = Number(import.meta.env.VITE_HTTP_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 10_000;
}

export const config: AppConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  defaultEnv: readDefaultEnv(),
  httpTimeoutMs: readTimeout(),
};
