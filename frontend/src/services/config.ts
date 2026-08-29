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

interface AppConfig {
  apiBaseUrl: Record<AppEnvironment, string>;
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
  apiBaseUrl: {
    dev: import.meta.env.VITE_API_BASE_URL_DEV ?? '',
    preprod: import.meta.env.VITE_API_BASE_URL_PREPROD ?? '',
    production: import.meta.env.VITE_API_BASE_URL_PRODUCTION ?? '',
  },
  defaultEnv: readDefaultEnv(),
  httpTimeoutMs: readTimeout(),
};

export function resolveApiBaseUrl(env: AppEnvironment): string {
  return config.apiBaseUrl[env];
}

export interface MonitoredApp {
  id: string;
  name: string;
  group: 'payment' | 'order' | 'platform';
  baseUrl: string;
  alivePath: string;
}

export const MONITORED_APPS_SEED: readonly MonitoredApp[] = [
  {
    id: 'payment-gateway',
    name: 'Payment Gateway',
    group: 'payment',
    baseUrl: 'https://payment-gateway.boyner.internal',
    alivePath: '/actuator/health',
  },
  {
    id: 'payment-3ds',
    name: '3DS Service',
    group: 'payment',
    baseUrl: 'https://payment-3ds.boyner.internal',
    alivePath: '/health',
  },
  {
    id: 'wallet-service',
    name: 'Wallet Service',
    group: 'payment',
    baseUrl: 'https://wallet.boyner.internal',
    alivePath: '/actuator/health/liveness',
  },
  {
    id: 'order-orchestrator',
    name: 'Order Orchestrator',
    group: 'order',
    baseUrl: 'https://order-orchestrator.boyner.internal',
    alivePath: '/health',
  },
  {
    id: 'order-fulfillment',
    name: 'Fulfillment Service',
    group: 'order',
    baseUrl: 'https://fulfillment.boyner.internal',
    alivePath: '/actuator/health',
  },
  {
    id: 'notification-service',
    name: 'Notification Service',
    group: 'platform',
    baseUrl: 'https://notification.boyner.internal',
    alivePath: '/health',
  },
];
