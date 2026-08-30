import { Ban, RotateCw } from 'lucide-react';

import { Badge, Button, Card, CardBody, CardHeader, CardTitle } from '@/components/ui';
import { formatRelative } from '@/lib/format';
import { ENV_LABELS } from '@/services/config';

import { isRunActive, RUN_STATUS_LABEL, RUN_STATUS_TONE } from '../lib';
import type { Run } from '../types';
import { JsonView } from './JsonView';
import { KindBadge } from './KindBadge';
import { RunSummaryPanel } from './RunSummaryPanel';
import { StepTimeline } from './StepTimeline';
import { VariablesPanel } from './VariablesPanel';

interface RunViewProps {
  run: Run;
  live?: boolean | undefined;
  onCancel?: (() => void) | undefined;
  onRerun?: (() => void) | undefined;
  cancelPending?: boolean | undefined;
  rerunPending?: boolean | undefined;
  onUseVariableInNext?: ((key: string, value: unknown) => void) | undefined;
}

export function RunView({
  run,
  live,
  onCancel,
  onRerun,
  cancelPending,
  rerunPending,
  onUseVariableInNext,
}: RunViewProps) {
  const active = isRunActive(run.status);

  return (
    <div className="space-y-4">
      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-fg">{run.scenarioName}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-fg-subtle">
              <KindBadge kind={run.kind} />
              <Badge tone={RUN_STATUS_TONE[run.status]}>{RUN_STATUS_LABEL[run.status]}</Badge>
              {live && active && (
                <span className="inline-flex items-center gap-1 text-accent-logs">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-logs motion-safe:animate-pulse" />
                  canlı
                </span>
              )}
              <span>
                ortam <span className="tnum text-fg-muted">{ENV_LABELS[run.environment]}</span>
              </span>
              <span>başladı {formatRelative(run.startedAt)}</span>
              {run.profileName && <span>profil {run.profileName}</span>}
              {run.triggeredBy && <span>tetikleyen {run.triggeredBy}</span>}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {active && onCancel && (
              <Button size="sm" onClick={onCancel} disabled={cancelPending ?? false}>
                <Ban size={13} />
                İptal et
              </Button>
            )}
            {!active && onRerun && (
              <Button
                size="sm"
                variant="primary"
                onClick={onRerun}
                disabled={rerunPending ?? false}
              >
                <RotateCw size={13} />
                Yeniden çalıştır
              </Button>
            )}
          </div>
        </div>

        {Object.keys(run.runParams).length > 0 && (
          <JsonView label="parametreler" value={run.runParams} />
        )}
      </header>

      {run.repeat && (
        <Card>
          <CardHeader>
            <CardTitle>Toplu koşum özeti</CardTitle>
          </CardHeader>
          <CardBody>
            <RunSummaryPanel
              repeat={run.repeat}
              iterations={run.iterations}
              summary={run.summary}
            />
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Adımlar</CardTitle>
        </CardHeader>
        <CardBody>
          <StepTimeline steps={run.steps} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Değişken çantası</CardTitle>
        </CardHeader>
        <CardBody>
          <VariablesPanel variables={run.variables} onUseInNext={onUseVariableInNext} />
        </CardBody>
      </Card>
    </div>
  );
}
