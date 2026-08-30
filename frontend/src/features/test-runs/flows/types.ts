import type { AppEnvironment } from '@/types';

import type { RunStatus } from '../types';

export interface TestFlowStepRef {
  scenarioKey: string;
  profileId?: string | undefined;
  bindings?: Record<string, string> | undefined;
}

export interface TestFlow {
  id: string;
  name: string;
  description?: string | undefined;
  steps: TestFlowStepRef[];
}

export interface TestFlowRun {
  id: string;
  flowId: string;
  environment: AppEnvironment;
  status: RunStatus;
  startedAt: string;
  finishedAt?: string | undefined;
  runIds: string[];
}
