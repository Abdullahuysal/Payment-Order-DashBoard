import { Link, Navigate } from 'react-router-dom';

import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui';
import { MODULES } from '@/lib/constants';

import { TEST_RUN_SCENARIO_STEPS } from './scenarios';

const mod = MODULES.find((m) => m.id === 'test-runs')!;

export interface ScenarioPageProps {
  scenarioId: string;
}

export default function ScenarioPage({ scenarioId }: ScenarioPageProps) {
  const scenario = mod.children?.find((c) => c.id === scenarioId);
  if (!scenario) return <Navigate to={`/${mod.path}`} replace />;

  const steps = TEST_RUN_SCENARIO_STEPS[scenarioId] ?? [];

  return (
    <div className="mx-auto max-w-3xl py-4">
      <div className="flex items-center gap-1.5 text-xs text-fg-subtle">
        <Link to={`/${mod.path}`} className="hover:text-fg-muted">
          Test Koşumları
        </Link>
        <span>/</span>
        <span className="text-fg-muted">{scenario.label}</span>
      </div>

      <h1 className="mt-2 text-lg font-semibold text-fg">{scenario.label}</h1>
      <p className="mt-1 max-w-2xl text-sm text-fg-muted">{scenario.description}</p>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          disabled
          className="inline-flex h-9 items-center rounded-md bg-primary px-3.5 text-sm font-medium text-primary-fg disabled:opacity-40"
        >
          Koşumu başlat
        </button>
        <span className="rounded border border-border px-2 py-0.5 text-[11px] uppercase tracking-wide text-fg-subtle">
          Yakında
        </span>
      </div>

      {steps.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Planlanan akış</CardTitle>
          </CardHeader>
          <CardBody>
            <ol className="space-y-2 text-sm text-fg-muted">
              {steps.map((step, i) => (
                <li key={step} className="flex gap-3">
                  <span className="tnum shrink-0 text-fg-subtle">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      )}

      <p className="mt-6 text-[11px] text-fg-subtle">
        Faz 0 — bu senaryonun parametreleri, tetikleme ve pass/fail çıktısı sonraki fazda eklenecek.
      </p>
    </div>
  );
}
