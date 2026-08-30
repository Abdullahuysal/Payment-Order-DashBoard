import { Link } from 'react-router-dom';
import { ArrowRight, FlaskConical } from 'lucide-react';

import { useAppStore } from '@/app/store';
import { Badge } from '@/components/ui';
import { formatRelative } from '@/lib/format';

import { TESTRUNS_MOCK } from './api';
import { KindBadge } from './components/KindBadge';
import { ErrorHint, LoadingLines, ProdDisabledNotice } from './components/kit';
import { useRunHistory, useScenarios } from './hooks/useTestRuns';
import { isEnvSupported, RUN_STATUS_LABEL, RUN_STATUS_TONE } from './lib';

export default function TestRunsPage() {
  const env = useAppStore((s) => s.environment);
  const scenarios = useScenarios();
  const recent = useRunHistory({});

  return (
    <div className="mx-auto max-w-4xl py-6">
      <p className="text-xs font-medium uppercase tracking-wide text-fg-subtle">Test Koşumları</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-fg">Senaryo koşumları</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fg-muted">
        Uçtan uca test senaryolarını seçili ortama karşı çalıştır, adımları canlı izle, üretilen
        değişkenleri sonraki senaryoya taşı. Sayfalar senaryoya göre elle kodlanmaz; gelen şemadan
        render edilir.
      </p>

      <div className="mt-5 rounded-lg border border-border bg-surface px-4 py-3 text-xs leading-relaxed text-fg-muted">
        <span className="font-semibold text-fg">Retail</span> = Boyner’in kendi ürünlerine ait
        süreçler. <span className="font-semibold text-fg">Merchant</span> = Boyner harici (3. parti)
        satıcıların süreçleri. Kargo ve fatura akışları iki tarafta farklı işlediği için senaryolar
        ayrı tutulur.
        {TESTRUNS_MOCK && (
          <span className="mt-1 block text-fg-subtle">
            Şu an <span className="tnum">mock</span> veriyle çalışıyor —{' '}
            <span className="tnum">VITE_TESTRUNS_MOCK=false</span> ile gerçek API’ye geçilir.
          </span>
        )}
      </div>

      {!isEnvSupported(env) ? (
        <ProdDisabledNotice />
      ) : (
        <>
          <section className="mt-8">
            <h2 className="text-sm font-semibold text-fg">Senaryolar</h2>
            {scenarios.isLoading ? (
              <div className="mt-3">
                <LoadingLines rows={4} />
              </div>
            ) : scenarios.isError ? (
              <div className="mt-3">
                <ErrorHint error={scenarios.error} onRetry={() => void scenarios.refetch()} />
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(scenarios.data ?? []).map((scenario) => (
                  <Link
                    key={scenario.id}
                    to={`/test-runs/${scenario.key}`}
                    className="group flex flex-col rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-fg">{scenario.name}</h3>
                      <ArrowRight
                        size={14}
                        className="mt-0.5 shrink-0 text-fg-subtle transition-colors group-hover:text-fg"
                      />
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-fg-muted">
                      {scenario.description}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <KindBadge kind={scenario.kind} />
                      <span className="text-[11px] text-fg-subtle">
                        {scenario.inputs.length} parametre
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-fg">Son koşumlar</h2>
              <Link
                to="/test-runs/history"
                className="text-xs text-fg-muted underline underline-offset-2 hover:text-fg"
              >
                Tümü
              </Link>
            </div>

            {recent.isLoading ? (
              <div className="mt-3">
                <LoadingLines rows={3} />
              </div>
            ) : recent.isError ? (
              <div className="mt-3">
                <ErrorHint error={recent.error} onRetry={() => void recent.refetch()} />
              </div>
            ) : (recent.data ?? []).length === 0 ? (
              <p className="mt-3 rounded-lg border border-dashed border-border px-4 py-6 text-center text-xs text-fg-muted">
                Bu ortamda henüz koşum yok.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
                {(recent.data ?? []).slice(0, 6).map((row) => (
                  <li key={row.id}>
                    <Link
                      to={`/test-runs/runs/${row.id}`}
                      className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-surface-2"
                    >
                      <FlaskConical size={14} className="shrink-0 text-fg-subtle" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-fg">{row.scenarioName}</span>
                        <span className="block truncate text-[11px] text-fg-subtle">
                          başladı {formatRelative(row.startedAt)}
                          {row.profileName ? ` · ${row.profileName}` : ''}
                        </span>
                      </span>
                      <Badge tone={RUN_STATUS_TONE[row.status]}>
                        {RUN_STATUS_LABEL[row.status]}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
