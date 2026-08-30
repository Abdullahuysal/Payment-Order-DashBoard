import type { AppEnvironment } from '@/types';

export type ScenarioKind = 'retail' | 'merchant' | 'generic';

export type InputFieldType = 'string' | 'number' | 'boolean' | 'select' | 'secret';

export type StepKind =
  'httpRequest' | 'soapRequest' | 'poll' | 'dbQuery' | 'extract' | 'assert' | 'delay';

export type RunStepStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';

export type RunStatus = 'queued' | 'running' | 'passed' | 'failed' | 'cancelled';

export interface InputOption {
  value: string;
  label: string;
}

export interface InputField {
  name: string;
  label: string;
  type: InputFieldType;
  required: boolean;
  options?: InputOption[] | undefined;
  placeholder?: string | undefined;
  help?: string | undefined;
  defaultValue?: unknown;
}

export interface Scenario {
  id: string;
  key: string;
  name: string;
  description: string;
  kind: ScenarioKind;
  inputs: InputField[];
}

export interface StepDef {
  key: string;
  title: string;
  kind: StepKind;
}

export interface BulkLimits {
  maxCount: number;
  maxConcurrency: number;
}

export interface ScenarioDetail extends Scenario {
  steps: StepDef[];
  bulk?: BulkLimits | undefined;
}

export interface Profile {
  id: string;
  name: string;
  environment: AppEnvironment;
  values: Record<string, unknown>;
  updatedAt: string;
}

export interface ProfileInput {
  name: string;
  values: Record<string, unknown>;
}

export interface RepeatConfig {
  count: number;
  concurrency: number;
}

export interface RunStep {
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
}

export interface RunIteration {
  index: number;
  status: RunStatus;
  runId?: string | undefined;
  durationMs?: number | undefined;
  orderNo?: string | undefined;
  error?: string | undefined;
}

export interface DurationSpread {
  min: number;
  median: number;
  max: number;
}

export interface RunResultSummary {
  total: number;
  passed: number;
  failed: number;
  durationMs: DurationSpread;
  orderNos: string[];
}

export interface Run {
  id: string;
  scenarioId: string;
  scenarioKey: string;
  scenarioName: string;
  kind: ScenarioKind;
  profileId?: string | undefined;
  profileName?: string | undefined;
  environment: AppEnvironment;
  status: RunStatus;
  startedAt: string;
  finishedAt?: string | undefined;
  triggeredBy?: string | undefined;
  runParams: Record<string, unknown>;
  variables: Record<string, unknown>;
  steps: RunStep[];
  repeat?: RepeatConfig | undefined;
  iterations?: RunIteration[] | undefined;
  summary?: RunResultSummary | undefined;
}

export interface RunSummary {
  id: string;
  scenarioId: string;
  scenarioKey: string;
  scenarioName: string;
  kind: ScenarioKind;
  profileId?: string | undefined;
  profileName?: string | undefined;
  environment: AppEnvironment;
  status: RunStatus;
  startedAt: string;
  finishedAt?: string | undefined;
  durationMs?: number | undefined;
  triggeredBy?: string | undefined;
  repeat?: RepeatConfig | undefined;
}

export interface StartRunRequest {
  scenarioId: string;
  profileId?: string | undefined;
  runParams: Record<string, unknown>;
  repeat?: RepeatConfig | undefined;
}

export interface StartRunResponse {
  runId: string;
}

export interface RunHistoryQuery {
  scenarioId?: string | undefined;
  status?: RunStatus | undefined;
  from?: string | undefined;
  to?: string | undefined;
}

export type RunEvent =
  | { type: 'step-started'; stepKey: string; at: string }
  | {
      type: 'step-finished';
      stepKey: string;
      status: RunStepStatus;
      at: string;
      durationMs: number;
      error?: string | undefined;
      attempts?: number | undefined;
    }
  | {
      type: 'run-finished';
      status: RunStatus;
      at: string;
      summary?: RunResultSummary | undefined;
    };
