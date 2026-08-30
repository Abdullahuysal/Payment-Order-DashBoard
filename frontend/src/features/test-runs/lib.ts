import type { AppEnvironment } from '@/types';

import type {
  BulkLimits,
  InputField,
  RepeatConfig,
  RunIteration,
  RunResultSummary,
  RunStatus,
  RunStep,
  RunStepStatus,
  ScenarioKind,
  StepDef,
  StepKind,
} from './types';

export type Tone = 'neutral' | 'up' | 'degraded' | 'down' | 'logs';

export const DEFAULT_BULK_LIMITS: BulkLimits = { maxCount: 10, maxConcurrency: 5 };

export const SUPPORTED_ENVIRONMENTS: readonly AppEnvironment[] = ['dev', 'preprod'];

export function isEnvSupported(env: AppEnvironment): boolean {
  return SUPPORTED_ENVIRONMENTS.includes(env);
}

export const KIND_LABEL: Record<ScenarioKind, string> = {
  retail: 'Retail',
  merchant: 'Merchant',
  generic: 'Genel',
};

export const KIND_TONE: Record<ScenarioKind, Tone> = {
  retail: 'logs',
  merchant: 'degraded',
  generic: 'neutral',
};

export const STEP_KIND_LABEL: Record<StepKind, string> = {
  httpRequest: 'HTTP',
  soapRequest: 'SOAP',
  poll: 'Poll',
  dbQuery: 'DB',
  extract: 'Extract',
  assert: 'Assert',
  delay: 'Bekleme',
};

export const RUN_STATUS_LABEL: Record<RunStatus, string> = {
  queued: 'Sırada',
  running: 'Çalışıyor',
  passed: 'Geçti',
  failed: 'Kaldı',
  cancelled: 'İptal edildi',
};

export const RUN_STATUS_TONE: Record<RunStatus, Tone> = {
  queued: 'neutral',
  running: 'logs',
  passed: 'up',
  failed: 'down',
  cancelled: 'degraded',
};

export const STEP_STATUS_LABEL: Record<RunStepStatus, string> = {
  pending: 'Bekliyor',
  running: 'Çalışıyor',
  passed: 'Geçti',
  failed: 'Kaldı',
  skipped: 'Atlandı',
};

export const STEP_STATUS_TONE: Record<RunStepStatus, Tone> = {
  pending: 'neutral',
  running: 'logs',
  passed: 'up',
  failed: 'down',
  skipped: 'neutral',
};

export const ACTIVE_RUN_STATUSES: readonly RunStatus[] = ['queued', 'running'];

export function isRunActive(status: RunStatus): boolean {
  return ACTIVE_RUN_STATUSES.includes(status);
}

export const RUN_STATUS_OPTIONS: ReadonlyArray<{ value: RunStatus; label: string }> = (
  ['queued', 'running', 'passed', 'failed', 'cancelled'] as const
).map((value) => ({ value, label: RUN_STATUS_LABEL[value] }));

const dateTimeFmt = new Intl.DateTimeFormat('tr', { dateStyle: 'short', timeStyle: 'short' });

export function formatDateTime(input: string | Date | null | undefined): string {
  if (!input) return '—';
  const date = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return '—';
  return dateTimeFmt.format(date);
}

export function formatDurationMs(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 1 : 0)} sn`;
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return rest > 0 ? `${minutes} dk ${rest} sn` : `${minutes} dk`;
}

export function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
  return sorted[mid] ?? 0;
}

export function summarizeIterations(iterations: readonly RunIteration[]): RunResultSummary {
  const durations = iterations
    .map((it) => it.durationMs)
    .filter((value): value is number => typeof value === 'number');
  return {
    total: iterations.length,
    passed: iterations.filter((it) => it.status === 'passed').length,
    failed: iterations.filter((it) => it.status === 'failed').length,
    durationMs: {
      min: durations.length ? Math.min(...durations) : 0,
      median: median(durations),
      max: durations.length ? Math.max(...durations) : 0,
    },
    orderNos: iterations
      .map((it) => it.orderNo)
      .filter((value): value is string => typeof value === 'string'),
  };
}

export function clampRepeat(repeat: RepeatConfig, limits: BulkLimits): RepeatConfig {
  const count = clampInt(repeat.count, 1, limits.maxCount);
  return {
    count,
    concurrency: clampInt(repeat.concurrency, 1, Math.min(limits.maxConcurrency, count)),
  };
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function defaultInputValues(fields: readonly InputField[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.defaultValue !== undefined) {
      result[field.name] = field.defaultValue;
    } else if (field.type === 'boolean') {
      result[field.name] = false;
    } else if (field.type === 'select') {
      result[field.name] = field.options?.[0]?.value ?? '';
    } else {
      result[field.name] = '';
    }
  }
  return result;
}

export function coerceInputValue(field: InputField, raw: string): unknown {
  if (field.type === 'number') {
    if (raw.trim() === '') return '';
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : raw;
  }
  if (field.type === 'boolean') return raw === 'true';
  return raw;
}

export function parsePrefillFromSearch(
  fields: readonly InputField[],
  search: string,
): Record<string, unknown> {
  const params = new URLSearchParams(search);
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    const raw = params.get(field.name);
    if (raw == null) continue;
    result[field.name] = coerceInputValue(field, raw);
  }
  return result;
}

export function validateInputs(
  fields: readonly InputField[],
  values: Record<string, unknown>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const value = values[field.name];
    if (field.required) {
      const empty =
        value == null ||
        value === '' ||
        (field.type === 'select' && value === '') ||
        (field.type === 'number' && Number.isNaN(Number(value)));
      if (empty) {
        errors[field.name] = 'Zorunlu alan';
        continue;
      }
    }
    if (
      field.type === 'number' &&
      value !== '' &&
      value != null &&
      !Number.isFinite(Number(value))
    ) {
      errors[field.name] = 'Sayı bekleniyor';
    }
  }
  return errors;
}

export interface TimelineItem {
  key: string;
  title: string;
  kind: StepKind;
  status: RunStepStatus;
  startedAt?: string | undefined;
  finishedAt?: string | undefined;
  durationMs?: number | undefined;
  request?: unknown;
  response?: unknown;
  error?: string | undefined;
  attempts?: number | undefined;
  hasDetail: boolean;
}

function isRunStep(step: StepDef | RunStep): step is RunStep {
  return 'status' in step;
}

export function toTimelineItems(steps: ReadonlyArray<StepDef | RunStep>): TimelineItem[] {
  return steps.map((step) => {
    if (!isRunStep(step)) {
      return {
        key: step.key,
        title: step.title,
        kind: step.kind,
        status: 'pending',
        hasDetail: false,
      };
    }
    const hasDetail =
      step.request != null ||
      step.response != null ||
      (step.error != null && step.error !== '') ||
      step.attempts != null;
    return {
      key: step.key,
      title: step.title,
      kind: step.kind,
      status: step.status,
      startedAt: step.startedAt,
      finishedAt: step.finishedAt,
      durationMs: step.durationMs,
      request: step.request,
      response: step.response,
      error: step.error,
      attempts: step.attempts,
      hasDetail,
    };
  });
}

export function prettyValue(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return JSON.stringify(JSON.parse(trimmed), null, 2);
      } catch {
        return value;
      }
    }
    return value;
  }
  try {
    return JSON.stringify(value, null, 2) ?? '—';
  } catch {
    return '[serileştirilemedi]';
  }
}

export function inlineValue(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value) ?? '—';
  } catch {
    return '[nesne]';
  }
}
