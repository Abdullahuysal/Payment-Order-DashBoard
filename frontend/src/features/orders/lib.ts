import {
  CircleCheck,
  CircleHelp,
  CircleMinus,
  CircleX,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';

import i18n from '@/i18n';
import type { AppEnvironment } from '@/types';

import type {
  CheckItem,
  CheckState,
  LookupField,
  OrderChannel,
  OrderDossier,
  RecentLookup,
  StatusTone,
} from './types';

export type BadgeTone = 'neutral' | 'up' | 'degraded' | 'down' | 'logs';

export const SUPPORTED_ENVIRONMENTS: readonly AppEnvironment[] = ['dev', 'preprod'];

export function isEnvSupported(env: AppEnvironment): boolean {
  return SUPPORTED_ENVIRONMENTS.includes(env);
}

export const LOOKUP_FIELD_VALUES: readonly LookupField[] = [
  'orderNumber',
  'customerNo',
  'packageNo',
  'invoiceNo',
  'trackingNo',
];

export const LOOKUP_FIELD_PLACEHOLDER: Record<LookupField, string> = {
  orderNumber: '30012345',
  customerNo: '1002453',
  packageNo: 'PKG-77001',
  invoiceNo: 'FTR-100234',
  trackingNo: '7260012345',
};

export function channelLabel(channel: OrderChannel): string {
  return i18n.t(`orders:channel.${channel}`);
}

export const CHANNEL_TONE: Record<OrderChannel, BadgeTone> = {
  retail: 'neutral',
  merchant: 'degraded',
  mixed: 'logs',
};

export const STATUS_TONE_BADGE: Record<StatusTone, BadgeTone> = {
  neutral: 'neutral',
  positive: 'up',
  warning: 'degraded',
  critical: 'down',
};

export const CHECK_STATE_TONE: Record<CheckState, BadgeTone> = {
  ok: 'up',
  missing: 'down',
  partial: 'degraded',
  na: 'neutral',
  unknown: 'neutral',
};

const CHECK_STATE_ICON: Record<CheckState, LucideIcon> = {
  ok: CircleCheck,
  missing: CircleX,
  partial: TriangleAlert,
  na: CircleMinus,
  unknown: CircleHelp,
};

export function stateTone(state: CheckState): BadgeTone {
  return CHECK_STATE_TONE[state];
}

export function stateLabel(state: CheckState): string {
  return i18n.t(`orders:checkState.${state}`);
}

export function stateIcon(state: CheckState): LucideIcon {
  return CHECK_STATE_ICON[state];
}

export { formatDateTime } from '@/lib/format';

export function cellText(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return i18n.t('orders:raw.object');
  }
}

export function prettyJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2) ?? '—';
  } catch {
    return i18n.t('orders:raw.unserializable');
  }
}

function summarizeCheck(check: CheckItem): string {
  const symbol = i18n.t(`orders:checkState.short.${check.state}`);
  const value = check.value ? ` ${check.value}` : '';
  return `${check.label.toLocaleLowerCase(i18n.language)}${value} ${symbol}`;
}

export function buildSummaryText(dossier: OrderDossier): string {
  const head =
    dossier.channel === 'merchant' && dossier.merchantName
      ? i18n.t('orders:summary.orderMerchant', {
          orderNumber: dossier.orderNumber,
          merchantName: dossier.merchantName,
        })
      : i18n.t('orders:summary.order', { orderNumber: dossier.orderNumber });
  const checks = dossier.checks.map(summarizeCheck).join(' | ');
  const status = i18n.t('orders:summary.status', {
    status: dossier.status.label.toLocaleLowerCase(i18n.language),
  });
  return checks ? `${head}: ${checks} | ${status}` : `${head}: ${status}`;
}

const RECENT_KEY_PREFIX = 'boyner-ops:orders:recent:v1:';
const RECENT_LIMIT = 15;

function recentKey(env: AppEnvironment): string {
  return `${RECENT_KEY_PREFIX}${env}`;
}

export function readRecentLookups(env: AppEnvironment): RecentLookup[] {
  try {
    const raw = window.localStorage.getItem(recentKey(env));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecentLookup).slice(0, RECENT_LIMIT);
  } catch {
    return [];
  }
}

export function writeRecentLookup(env: AppEnvironment, entry: RecentLookup): RecentLookup[] {
  const next = [entry, ...readRecentLookups(env).filter((r) => r.orderId !== entry.orderId)].slice(
    0,
    RECENT_LIMIT,
  );
  try {
    window.localStorage.setItem(recentKey(env), JSON.stringify(next));
  } catch {
    return next;
  }
  return next;
}

export function clearRecentLookups(env: AppEnvironment): void {
  try {
    window.localStorage.removeItem(recentKey(env));
  } catch {
    return;
  }
}

function isRecentLookup(value: unknown): value is RecentLookup {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v['orderId'] === 'string' &&
    typeof v['orderNumber'] === 'string' &&
    typeof v['channel'] === 'string' &&
    typeof v['statusLabel'] === 'string' &&
    typeof v['statusTone'] === 'string' &&
    typeof v['viewedAt'] === 'string'
  );
}
