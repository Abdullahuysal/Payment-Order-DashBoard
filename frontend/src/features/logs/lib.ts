import { HttpError } from '@/services/http';

import type {
  AiConfidence,
  ExceptionGroup,
  ExceptionParams,
  HistogramBucket,
  LogLevel,
  LogSearchParams,
  TimeRangePreset,
} from './types';

export function isNotConfigured(error: unknown): boolean {
  return error instanceof HttpError && error.status === 503;
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error) ?? 'error';
  } catch {
    return 'error';
  }
}

export interface LogFilterState {
  q: string;
  levels: LogLevel[];
  service: string;
  traceId: string;
  preset: TimeRangePreset;
  from: string;
  to: string;
}

export const EMPTY_FILTER: LogFilterState = {
  q: '',
  levels: [],
  service: '',
  traceId: '',
  preset: '1h',
  from: '',
  to: '',
};

type Tone = 'neutral' | 'up' | 'degraded' | 'down' | 'logs';

const LEVEL_RANK: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5,
};

export const LEVEL_TONE: Record<LogLevel, Tone> = {
  trace: 'neutral',
  debug: 'neutral',
  info: 'logs',
  warn: 'degraded',
  error: 'down',
  fatal: 'down',
};

export const CONFIDENCE_TONE: Record<AiConfidence, Tone> = {
  low: 'down',
  medium: 'degraded',
  high: 'up',
};

export const TONE_CHIP_ACTIVE: Record<Tone, string> = {
  neutral: 'border-border-strong bg-surface-2 text-fg',
  logs: 'border-accent-logs/40 bg-accent-logs/10 text-accent-logs',
  degraded: 'border-status-degraded/40 bg-status-degraded/10 text-status-degraded',
  down: 'border-status-down/40 bg-status-down/10 text-status-down',
  up: 'border-status-up/40 bg-status-up/10 text-status-up',
};

export function sortLevels(levels: readonly LogLevel[]): LogLevel[] {
  return [...levels].sort((a, b) => LEVEL_RANK[a] - LEVEL_RANK[b]);
}

export function toggleLevel(levels: readonly LogLevel[], level: LogLevel): LogLevel[] {
  return levels.includes(level)
    ? levels.filter((l) => l !== level)
    : sortLevels([...levels, level]);
}

const PRESET_MINUTES: Record<Exclude<TimeRangePreset, 'custom'>, number> = {
  '15m': 15,
  '1h': 60,
  '24h': 60 * 24,
};

export function presetRange(
  preset: Exclude<TimeRangePreset, 'custom'>,
  now: number = Date.now(),
): { from: string; to: string } {
  const to = new Date(now);
  const from = new Date(now - PRESET_MINUTES[preset] * 60_000);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function histogramPeak(buckets: readonly HistogramBucket[]): number {
  return buckets.reduce((max, b) => (b.count > max ? b.count : max), 0);
}

export function barHeightPercent(count: number, peak: number): number {
  if (peak <= 0) return 0;
  return Math.max(2, Math.round((count / peak) * 100));
}

export function rankExceptionGroups(groups: readonly ExceptionGroup[]): ExceptionGroup[] {
  return [...groups].sort((a, b) => b.count - a.count || b.lastSeen.localeCompare(a.lastSeen));
}

/** `datetime-local` input değerini ISO'ya çevirir; boş/geçersiz değer `undefined` olur. */
export function localInputToIso(value: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function filterRange(
  state: LogFilterState,
  now: number = Date.now(),
): { from?: string | undefined; to?: string | undefined } {
  if (state.preset === 'custom') {
    return { from: localInputToIso(state.from), to: localInputToIso(state.to) };
  }
  return presetRange(state.preset, now);
}

export function filterToParams(
  state: LogFilterState,
  page: number,
  pageSize: number,
  now: number = Date.now(),
): LogSearchParams {
  const range = filterRange(state, now);
  return {
    ...(state.q ? { q: state.q } : {}),
    ...(state.levels.length > 0 ? { levels: state.levels } : {}),
    ...(state.service.trim() ? { service: state.service.trim() } : {}),
    ...(state.traceId.trim() ? { traceId: state.traceId.trim() } : {}),
    ...(range.from ? { from: range.from } : {}),
    ...(range.to ? { to: range.to } : {}),
    page,
    pageSize,
  };
}

export function filterToExceptionParams(
  state: LogFilterState,
  now: number = Date.now(),
): ExceptionParams {
  const range = filterRange(state, now);
  return {
    ...(range.from ? { from: range.from } : {}),
    ...(range.to ? { to: range.to } : {}),
    ...(state.service.trim() ? { service: state.service.trim() } : {}),
  };
}
