import type { AppEnvironment } from '@/types';

import type {
  Profile,
  ProfileInput,
  Run,
  RunEvent,
  RunHistoryQuery,
  RunSummary,
  Scenario,
  ScenarioDetail,
  StartRunRequest,
  StartRunResponse,
} from '../types';
import { realTestRunsApi } from './testRuns.api';
import { mockTestRunsApi } from './testRuns.mock';

export interface TestRunsApi {
  listScenarios(env: AppEnvironment, signal?: AbortSignal): Promise<Scenario[]>;
  getScenario(env: AppEnvironment, idOrKey: string, signal?: AbortSignal): Promise<ScenarioDetail>;
  listProfiles(env: AppEnvironment, scenarioId: string, signal?: AbortSignal): Promise<Profile[]>;
  saveProfile(
    env: AppEnvironment,
    scenarioId: string,
    input: ProfileInput,
    profileId?: string,
  ): Promise<Profile>;
  deleteProfile(env: AppEnvironment, scenarioId: string, profileId: string): Promise<void>;
  startRun(env: AppEnvironment, request: StartRunRequest): Promise<StartRunResponse>;
  listRuns(
    env: AppEnvironment,
    query: RunHistoryQuery,
    signal?: AbortSignal,
  ): Promise<RunSummary[]>;
  getRun(env: AppEnvironment, runId: string, signal?: AbortSignal): Promise<Run>;
  cancelRun(env: AppEnvironment, runId: string): Promise<void>;
  subscribeRunEvents(
    env: AppEnvironment,
    runId: string,
    onEvent: (event: RunEvent) => void,
  ): () => void;
}

function readMockFlag(): boolean {
  const raw = import.meta.env.VITE_TESTRUNS_MOCK;
  if (raw == null || raw === '') return true;
  return !['false', '0', 'off', 'no'].includes(raw.toLowerCase());
}

export const TESTRUNS_MOCK = readMockFlag();

export const testRunsApi: TestRunsApi = TESTRUNS_MOCK ? mockTestRunsApi : realTestRunsApi;
