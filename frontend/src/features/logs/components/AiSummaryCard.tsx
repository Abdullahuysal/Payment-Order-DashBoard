import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Badge, Button, Card, CardBody, CardHeader, CardTitle } from '@/components/ui';
import { formatRelative } from '@/lib/format';

import { CONFIDENCE_TONE, errorMessage, isNotConfigured } from '../lib';
import type { AiSummary, AiSummaryGroup } from '../types';

function GroupCard({ group }: { group: AiSummaryGroup }) {
  const { t } = useTranslation('logs');
  return (
    <div className="space-y-1.5 rounded-md border border-border bg-bg px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-xs font-semibold text-fg">{group.title}</h4>
        <Badge tone={CONFIDENCE_TONE[group.confidence]}>
          {t(`ai.confidence.${group.confidence}`)}
        </Badge>
      </div>
      <dl className="space-y-1 text-[11px]">
        <div>
          <dt className="text-fg-subtle">{t('ai.group.rootCause')}</dt>
          <dd className="text-fg-muted">{group.rootCauseGuess}</dd>
        </div>
        <div>
          <dt className="text-fg-subtle">{t('ai.group.impact')}</dt>
          <dd className="text-fg-muted">{group.impact}</dd>
        </div>
        <div>
          <dt className="text-fg-subtle">{t('ai.group.suggestedAction')}</dt>
          <dd className="text-fg-muted">{group.suggestedAction}</dd>
        </div>
        {group.relatedTraceIds && group.relatedTraceIds.length > 0 && (
          <div>
            <dt className="text-fg-subtle">{t('ai.group.relatedTraces')}</dt>
            <dd className="tnum break-all text-fg-muted">{group.relatedTraceIds.join(', ')}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

export function AiSummaryCard({
  summary,
  isLoading,
  isGenerating,
  error,
  onGenerate,
}: {
  summary: AiSummary | undefined;
  isLoading: boolean;
  isGenerating: boolean;
  error: unknown;
  onGenerate: () => void;
}) {
  const { t } = useTranslation('logs');
  const busy = isLoading || isGenerating;
  const notConfigured = isNotConfigured(error);

  return (
    <Card>
      <CardHeader>
        <div className="min-w-0">
          <CardTitle>{t('ai.title')}</CardTitle>
          <p className="mt-0.5 text-[11px] text-fg-muted">{t('ai.description')}</p>
        </div>
        <Button size="sm" onClick={onGenerate} disabled={busy || notConfigured}>
          <Sparkles size={13} />
          {isGenerating ? t('ai.generating') : summary ? t('ai.regenerate') : t('ai.generate')}
        </Button>
      </CardHeader>
      <CardBody className="space-y-3">
        {notConfigured ? (
          <p className="text-xs text-fg-muted">{t('states.notConfigured')}</p>
        ) : error ? (
          <p className="text-xs text-status-down">
            {t('states.error', { message: errorMessage(error) })}
          </p>
        ) : !summary ? (
          <p className="text-xs text-fg-subtle">{busy ? t('states.loading') : t('ai.empty')}</p>
        ) : (
          <>
            <p className="text-xs font-medium text-fg">{summary.headline}</p>
            <div className="space-y-2">
              {summary.groups.map((group, i) => (
                <GroupCard key={`${group.title}-${i}`} group={group} />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2 text-[11px] text-fg-subtle">
              <span>
                {t('ai.meta.generatedAt', { relative: formatRelative(summary.generatedAt) })}
              </span>
              {summary.cached && <Badge tone="neutral">{t('ai.meta.cached')}</Badge>}
              <span className="tnum">{t('ai.meta.model', { model: summary.modelUsed })}</span>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}
