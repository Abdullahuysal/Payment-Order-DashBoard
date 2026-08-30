import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { ErrorHint, LoadingLines } from './components/kit';
import { RunView } from './components/RunView';
import { ScenarioChooser } from './components/ScenarioChooser';
import { useRunEvents } from './hooks/useRunEvents';
import { useCancelRun, useRun, useScenarios, useStartRun } from './hooks/useTestRuns';
import { isRunActive } from './lib';

export default function RunPage() {
  const { runId } = useParams();
  const navigate = useNavigate();

  const runQuery = useRun(runId);
  const run = runQuery.data;
  const live = run ? isRunActive(run.status) : false;
  useRunEvents(runId, live);

  const cancelRun = useCancelRun();
  const startRun = useStartRun();
  const scenarios = useScenarios();

  const [carry, setCarry] = useState<{ key: string; value: unknown } | null>(null);

  const rerun = () => {
    if (!run) return;
    startRun.mutate(
      {
        scenarioId: run.scenarioId,
        ...(run.profileId ? { profileId: run.profileId } : {}),
        runParams: run.runParams,
        ...(run.repeat ? { repeat: run.repeat } : {}),
      },
      { onSuccess: (result) => navigate(`/test-runs/runs/${result.runId}`) },
    );
  };

  return (
    <div className="mx-auto max-w-3xl py-4">
      <div className="flex items-center gap-1.5 text-xs text-fg-subtle">
        <Link to="/test-runs" className="hover:text-fg-muted">
          Test Koşumları
        </Link>
        <span>/</span>
        <Link to="/test-runs/history" className="hover:text-fg-muted">
          Geçmiş
        </Link>
        <span>/</span>
        <span className="tnum text-fg-muted">{runId}</span>
      </div>

      <div className="mt-6">
        {runQuery.isLoading ? (
          <LoadingLines rows={6} />
        ) : runQuery.isError ? (
          <ErrorHint error={runQuery.error} onRetry={() => void runQuery.refetch()} />
        ) : !run ? null : (
          <RunView
            run={run}
            live={live}
            onCancel={() => {
              if (runId) cancelRun.mutate(runId);
            }}
            onRerun={rerun}
            cancelPending={cancelRun.isPending}
            rerunPending={startRun.isPending}
            onUseVariableInNext={(key, value) => setCarry({ key, value })}
          />
        )}
      </div>

      <ScenarioChooser
        open={carry != null}
        onClose={() => setCarry(null)}
        scenarios={scenarios.data ?? []}
        variableKey={carry?.key ?? ''}
        onPick={(scenario) => {
          if (!carry) return;
          const query = new URLSearchParams({ [carry.key]: String(carry.value) });
          setCarry(null);
          void navigate(`/test-runs/${scenario.key}?${query.toString()}`);
        }}
      />
    </div>
  );
}
