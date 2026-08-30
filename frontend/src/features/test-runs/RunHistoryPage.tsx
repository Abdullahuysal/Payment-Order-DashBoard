import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RotateCw } from 'lucide-react';

import { useAppStore } from '@/app/store';
import { Badge, Button } from '@/components/ui';
import {
  formatDateTime,
  formatDurationMs,
  isEnvSupported,
  RUN_STATUS_LABEL,
  RUN_STATUS_OPTIONS,
  RUN_STATUS_TONE,
} from './lib';
import { ErrorHint, LoadingLines, ProdDisabledNotice, controlClass } from './components/kit';
import { KindBadge } from './components/KindBadge';
import { useRunHistory, useScenarios } from './hooks/useTestRuns';
import type { RunHistoryQuery, RunStatus } from './types';

export default function RunHistoryPage() {
  const env = useAppStore((s) => s.environment);
  const navigate = useNavigate();
  const scenarios = useScenarios();

  const [scenarioId, setScenarioId] = useState('');
  const [status, setStatus] = useState<'' | RunStatus>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const query = useMemo<RunHistoryQuery>(
    () => ({
      ...(scenarioId ? { scenarioId } : {}),
      ...(status ? { status } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    }),
    [scenarioId, status, from, to],
  );

  const history = useRunHistory(query);

  return (
    <div className="mx-auto max-w-5xl py-4">
      <div className="flex items-center gap-1.5 text-xs text-fg-subtle">
        <Link to="/test-runs" className="hover:text-fg-muted">
          Test Koşumları
        </Link>
        <span>/</span>
        <span className="text-fg-muted">Koşum geçmişi</span>
      </div>

      <h1 className="mt-2 text-lg font-semibold text-fg">Koşum geçmişi</h1>

      {!isEnvSupported(env) ? (
        <ProdDisabledNotice />
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
            <label className="space-y-1">
              <span className="text-[11px] text-fg-subtle">Senaryo</span>
              <select
                className={controlClass}
                value={scenarioId}
                onChange={(event) => setScenarioId(event.target.value)}
              >
                <option value="">Tümü</option>
                {(scenarios.data ?? []).map((scenario) => (
                  <option key={scenario.id} value={scenario.id}>
                    {scenario.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-[11px] text-fg-subtle">Durum</span>
              <select
                className={controlClass}
                value={status}
                onChange={(event) => setStatus(event.target.value as '' | RunStatus)}
              >
                <option value="">Tümü</option>
                {RUN_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-[11px] text-fg-subtle">Başlangıç</span>
              <input
                type="date"
                className={controlClass}
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              />
            </label>

            <label className="space-y-1">
              <span className="text-[11px] text-fg-subtle">Bitiş</span>
              <input
                type="date"
                className={controlClass}
                value={to}
                onChange={(event) => setTo(event.target.value)}
              />
            </label>
          </div>

          <div className="mt-4">
            {history.isLoading ? (
              <LoadingLines rows={6} />
            ) : history.isError ? (
              <ErrorHint error={history.error} onRetry={() => void history.refetch()} />
            ) : (history.data ?? []).length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-xs text-fg-muted">
                Filtreye uyan koşum yok.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-fg-subtle">
                      <th className="px-3 py-2 font-medium">Senaryo</th>
                      <th className="px-3 py-2 font-medium">Durum</th>
                      <th className="px-3 py-2 font-medium">Başladı</th>
                      <th className="px-3 py-2 font-medium">Süre</th>
                      <th className="px-3 py-2 font-medium">Tetikleyen</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {(history.data ?? []).map((row) => (
                      <tr key={row.id} className="border-b border-border last:border-b-0">
                        <td className="px-3 py-2">
                          <Link
                            to={`/test-runs/runs/${row.id}`}
                            className="flex items-center gap-2 hover:underline"
                          >
                            <KindBadge kind={row.kind} />
                            <span className="min-w-0 truncate text-fg">{row.scenarioName}</span>
                          </Link>
                          {row.profileName && (
                            <span className="mt-0.5 block text-[11px] text-fg-subtle">
                              {row.profileName}
                              {row.repeat ? ` · ${row.repeat.count}×${row.repeat.concurrency}` : ''}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <Badge tone={RUN_STATUS_TONE[row.status]}>
                            {RUN_STATUS_LABEL[row.status]}
                          </Badge>
                        </td>
                        <td className="tnum px-3 py-2 text-xs text-fg-muted">
                          {formatDateTime(row.startedAt)}
                        </td>
                        <td className="tnum px-3 py-2 text-xs text-fg-muted">
                          {formatDurationMs(row.durationMs)}
                        </td>
                        <td className="px-3 py-2 text-xs text-fg-muted">
                          {row.triggeredBy ?? '—'}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              navigate(
                                `/test-runs/${row.scenarioKey}${row.profileId ? `?profile=${row.profileId}` : ''}`,
                              )
                            }
                          >
                            <RotateCw size={12} />
                            Yeniden
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
