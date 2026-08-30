import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import { useAppStore } from '@/app/store';
import type { AppEnvironment } from '@/types';

import { testRunsApi } from '../api';
import type {
  Profile,
  ProfileInput,
  Run,
  RunHistoryQuery,
  RunSummary,
  Scenario,
  ScenarioDetail,
  StartRunRequest,
  StartRunResponse,
} from '../types';

export const testRunKeys = {
  all: ['test-runs'] as const,
  scenarios: (env: string) => ['test-runs', 'scenarios', env] as const,
  scenario: (env: string, key: string) => ['test-runs', 'scenario', env, key] as const,
  profiles: (env: string, scenarioId: string) =>
    ['test-runs', 'profiles', env, scenarioId] as const,
  runs: (env: string, query: RunHistoryQuery) => ['test-runs', 'runs', env, query] as const,
  run: (env: string, runId: string) => ['test-runs', 'run', env, runId] as const,
};

function useEnv(): AppEnvironment {
  return useAppStore((s) => s.environment);
}

export function useScenarios(): UseQueryResult<Scenario[]> {
  const env = useEnv();
  return useQuery({
    queryKey: testRunKeys.scenarios(env),
    queryFn: ({ signal }) => testRunsApi.listScenarios(env, signal),
    staleTime: 60_000,
  });
}

export function useScenario(key: string | undefined): UseQueryResult<ScenarioDetail> {
  const env = useEnv();
  return useQuery({
    queryKey: testRunKeys.scenario(env, key ?? ''),
    queryFn: ({ signal }) => testRunsApi.getScenario(env, key ?? '', signal),
    enabled: Boolean(key),
    staleTime: 60_000,
  });
}

export function useProfiles(scenarioId: string | undefined): UseQueryResult<Profile[]> {
  const env = useEnv();
  return useQuery({
    queryKey: testRunKeys.profiles(env, scenarioId ?? ''),
    queryFn: ({ signal }) => testRunsApi.listProfiles(env, scenarioId ?? '', signal),
    enabled: Boolean(scenarioId),
    staleTime: 15_000,
  });
}

export function useSaveProfile(scenarioId: string) {
  const env = useEnv();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, profileId }: { input: ProfileInput; profileId?: string | undefined }) =>
      testRunsApi.saveProfile(env, scenarioId, input, profileId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: testRunKeys.profiles(env, scenarioId) }),
  });
}

export function useDeleteProfile(scenarioId: string) {
  const env = useEnv();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) => testRunsApi.deleteProfile(env, scenarioId, profileId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: testRunKeys.profiles(env, scenarioId) }),
  });
}

export function useStartRun() {
  const env = useEnv();
  const queryClient = useQueryClient();
  return useMutation<StartRunResponse, Error, StartRunRequest>({
    mutationFn: (request) => testRunsApi.startRun(env, request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['test-runs', 'runs', env] }),
  });
}

export function useRun(runId: string | undefined): UseQueryResult<Run> {
  const env = useEnv();
  return useQuery({
    queryKey: testRunKeys.run(env, runId ?? ''),
    queryFn: ({ signal }) => testRunsApi.getRun(env, runId ?? '', signal),
    enabled: Boolean(runId),
    staleTime: 2_000,
  });
}

export function useRunHistory(query: RunHistoryQuery): UseQueryResult<RunSummary[]> {
  const env = useEnv();
  return useQuery({
    queryKey: testRunKeys.runs(env, query),
    queryFn: ({ signal }) => testRunsApi.listRuns(env, query, signal),
    staleTime: 10_000,
    placeholderData: (prev) => prev,
  });
}

export function useCancelRun() {
  const env = useEnv();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (runId: string) => testRunsApi.cancelRun(env, runId),
    onSuccess: (_data, runId) =>
      queryClient.invalidateQueries({ queryKey: testRunKeys.run(env, runId) }),
  });
}
