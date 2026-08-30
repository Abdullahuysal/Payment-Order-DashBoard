import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Badge, Button, Card, CardBody, CardHeader, CardTitle, CopyButton } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatRelative } from '@/lib/format';

import { ChannelBadge } from './components/ChannelBadge';
import { ChecksStrip } from './components/ChecksStrip';
import { DossierSectionView } from './components/DossierSectionView';
import { IdentifiersBar } from './components/IdentifiersBar';
import { LinksRow } from './components/LinksRow';
import { OrderTimeline } from './components/OrderTimeline';
import { WarningsBanner } from './components/WarningsBanner';
import { DossierSkeleton, NotFoundState } from './components/kit';
import { isOrderNotFound, useOrderDossier } from './hooks/useOrderDossier';
import { useRecentLookups } from './hooks/useRecentLookups';
import { buildSummaryText, formatDateTime, STATUS_TONE_BADGE } from './lib';
import type { OrderDossier } from './types';

export default function OrderDossierPage() {
  const { t } = useTranslation(['orders', 'common']);
  const { orderId } = useParams();
  const query = useOrderDossier(orderId);

  if (query.isLoading) {
    return (
      <div className="mx-auto max-w-4xl">
        <BackLink />
        <div className="mt-4">
          <DossierSkeleton />
        </div>
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="mx-auto max-w-4xl">
        <BackLink />
        {isOrderNotFound(query.error) ? (
          <NotFoundState orderId={orderId ?? ''} />
        ) : (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-status-down/30 bg-surface px-4 py-3 text-xs text-status-down"
          >
            {t('orders:dossier.loadError', { message: query.error.message })}
            <button
              type="button"
              onClick={() => void query.refetch()}
              className="ml-2 underline underline-offset-2 hover:no-underline"
            >
              {t('common:actions.retry')}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!query.data) return null;

  return (
    <DossierView
      dossier={query.data}
      isFetching={query.isFetching}
      onRefresh={() => void query.refetch()}
    />
  );
}

function DossierView({
  dossier,
  isFetching,
  onRefresh,
}: {
  dossier: OrderDossier;
  isFetching: boolean;
  onRefresh: () => void;
}) {
  const { t } = useTranslation(['orders', 'common']);
  const { add: addRecent } = useRecentLookups();

  const { orderId, orderNumber, channel } = dossier;
  const { label: statusLabel, tone: statusTone } = dossier.status;
  useEffect(() => {
    addRecent({ orderId, orderNumber, channel, statusLabel, statusTone });
  }, [addRecent, orderId, orderNumber, channel, statusLabel, statusTone]);

  const customerLine = [dossier.customer.name, dossier.customer.email, dossier.customer.phone]
    .filter((part): part is string => Boolean(part))
    .join(' · ');

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <BackLink />

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="tnum text-lg font-semibold text-fg">{dossier.orderNumber}</h1>
            <ChannelBadge channel={dossier.channel} merchantName={dossier.merchantName} />
            <Badge tone={STATUS_TONE_BADGE[dossier.status.tone]}>{dossier.status.label}</Badge>
          </div>
          <p className="text-[11px] text-fg-subtle">
            {t('orders:dossier.timestamps', {
              created: formatDateTime(dossier.createdAt),
              updated: formatDateTime(dossier.updatedAt),
            })}
            {customerLine && <span className="text-fg-muted"> · {customerLine}</span>}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span role="status" className="text-[11px] text-fg-subtle">
            {t('orders:dossier.fetched', { relative: formatRelative(dossier.fetchedAt) })}
          </span>
          <CopyButton
            value={buildSummaryText(dossier)}
            idleLabel={t('orders:dossier.copySummary')}
            className="h-8 px-2"
          />
          <Button size="sm" onClick={onRefresh} disabled={isFetching}>
            <RefreshCw size={13} className={cn(isFetching && 'motion-safe:animate-spin')} />
            {t('common:actions.refresh')}
          </Button>
        </div>
      </header>

      <WarningsBanner warnings={dossier.warnings} />

      <ChecksStrip checks={dossier.checks} />

      <IdentifiersBar identifiers={dossier.identifiers} />

      {dossier.sections.map((section) => (
        <DossierSectionView key={section.key} section={section} />
      ))}

      <Card>
        <CardHeader>
          <CardTitle>{t('orders:dossier.timelineTitle')}</CardTitle>
        </CardHeader>
        <CardBody>
          <OrderTimeline timeline={dossier.timeline} />
        </CardBody>
      </Card>

      {dossier.links.length > 0 && (
        <div className="space-y-1.5">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
            {t('orders:dossier.relatedPanels')}
          </h2>
          <LinksRow links={dossier.links} />
        </div>
      )}
    </div>
  );
}

function BackLink() {
  const { t } = useTranslation('orders');
  return (
    <Link to="/orders" className="text-xs text-fg-subtle transition-colors hover:text-fg-muted">
      {t('dossier.back')}
    </Link>
  );
}
