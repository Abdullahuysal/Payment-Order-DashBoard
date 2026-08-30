import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useAppStore } from '@/app/store';

import { testRunsApi } from '../api';
import type { Run, RunEvent, RunStep } from '../types';
import { testRunKeys } from './useTestRuns';

export function useRunEvents(runId: string | undefined, enabled: boolean): void {
  const env = useAppStore((s) => s.environment);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!runId || !enabled) return;
    const key = testRunKeys.run(env, runId);

    const patch = (updater: (run: Run) => Run) => {
      queryClient.setQueryData<Run>(key, (prev) => (prev ? updater(prev) : prev));
    };

    const patchStep = (stepKey: string, next: Partial<RunStep>) => {
      patch((run) => ({
        ...run,
        steps: run.steps.map((step) => (step.key === stepKey ? { ...step, ...next } : step)),
      }));
    };

    const onEvent = (event: RunEvent) => {
      if (event.type === 'step-started') {
        patch((run) => ({
          ...run,
          status: run.status === 'queued' ? 'running' : run.status,
        }));
        patchStep(event.stepKey, { status: 'running', startedAt: event.at });
        return;
      }

      if (event.type === 'step-finished') {
        patchStep(event.stepKey, {
          status: event.status,
          finishedAt: event.at,
          durationMs: event.durationMs,
          ...(event.error != null ? { error: event.error } : {}),
          ...(event.attempts != null ? { attempts: event.attempts } : {}),
        });
        void queryClient.invalidateQueries({ queryKey: key });
        return;
      }

      patch((run) => ({
        ...run,
        status: event.status,
        finishedAt: event.at,
        ...(event.summary ? { summary: event.summary } : {}),
      }));
      void queryClient.invalidateQueries({ queryKey: key });
      void queryClient.invalidateQueries({ queryKey: ['test-runs', 'runs', env] });
    };

    return testRunsApi.subscribeRunEvents(env, runId, onEvent);
  }, [runId, enabled, env, queryClient]);
}
