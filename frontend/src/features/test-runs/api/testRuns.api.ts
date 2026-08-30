import { config, ENVIRONMENT_HEADER } from '@/services/config';
import { apiClient } from '@/services/http';
import type { AppEnvironment } from '@/types';

import type {
  Profile,
  Run,
  RunEvent,
  RunSummary,
  Scenario,
  ScenarioDetail,
  StartRunResponse,
} from '../types';
import type { TestRunsApi } from './index';

const R = '/api/v1/test-runs';

function headers(env: AppEnvironment): Record<string, string> {
  return { [ENVIRONMENT_HEADER]: env };
}

type QueryValue = string | number | boolean | null | undefined;

function opts(env: AppEnvironment, signal?: AbortSignal, query?: Record<string, QueryValue>) {
  return {
    headers: headers(env),
    ...(signal ? { signal } : {}),
    ...(query ? { query } : {}),
  };
}

const seg = (value: string): string => encodeURIComponent(value);

export const realTestRunsApi: TestRunsApi = {
  listScenarios(env, signal) {
    return apiClient().get<Scenario[]>(`${R}/scenarios`, opts(env, signal));
  },

  getScenario(env, idOrKey, signal) {
    return apiClient().get<ScenarioDetail>(`${R}/scenarios/${seg(idOrKey)}`, opts(env, signal));
  },

  listProfiles(env, scenarioId, signal) {
    return apiClient().get<Profile[]>(
      `${R}/scenarios/${seg(scenarioId)}/profiles`,
      opts(env, signal),
    );
  },

  saveProfile(env, scenarioId, input, profileId) {
    const base = `${R}/scenarios/${seg(scenarioId)}/profiles`;
    return profileId
      ? apiClient().put<Profile>(`${base}/${seg(profileId)}`, input, { headers: headers(env) })
      : apiClient().post<Profile>(base, input, { headers: headers(env) });
  },

  deleteProfile(env, scenarioId, profileId) {
    return apiClient().delete<void>(
      `${R}/scenarios/${seg(scenarioId)}/profiles/${seg(profileId)}`,
      { headers: headers(env) },
    );
  },

  startRun(env, request) {
    return apiClient().post<StartRunResponse>(R, request, { headers: headers(env) });
  },

  listRuns(env, query, signal) {
    return apiClient().get<RunSummary[]>(R, opts(env, signal, query as Record<string, QueryValue>));
  },

  getRun(env, runId, signal) {
    return apiClient().get<Run>(`${R}/${seg(runId)}`, opts(env, signal));
  },

  cancelRun(env, runId) {
    return apiClient().post<void>(`${R}/${seg(runId)}/cancel`, undefined, {
      headers: headers(env),
    });
  },

  subscribeRunEvents(env, runId, onEvent) {
    const root = config.apiBaseUrl.endsWith('/') ? config.apiBaseUrl : `${config.apiBaseUrl}/`;
    const url = new URL(`api/v1/test-runs/${seg(runId)}/events`, root);
    url.searchParams.set('env', env);
    const source = new EventSource(url.toString());

    const forward = (type: RunEvent['type']) => (raw: MessageEvent<string>) => {
      try {
        const parsed = JSON.parse(raw.data) as Record<string, unknown>;
        onEvent({ ...parsed, type } as RunEvent);
      } catch {
        source.dispatchEvent(new Event('parse-error'));
      }
    };

    source.addEventListener('step-started', forward('step-started'));
    source.addEventListener('step-finished', forward('step-finished'));
    source.addEventListener('run-finished', forward('run-finished'));

    return () => source.close();
  },
};
