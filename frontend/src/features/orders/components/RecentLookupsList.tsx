import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui';

import { channelLabel, formatDateTime, STATUS_TONE_BADGE } from '../lib';
import type { RecentLookup } from '../types';
import { PanelHeading } from './kit';

export function RecentLookupsList({
  items,
  onClear,
}: {
  items: readonly RecentLookup[];
  onClear: () => void;
}) {
  const { t } = useTranslation(['orders', 'common']);
  if (items.length === 0) return null;

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <PanelHeading>{t('orders:recent.heading')}</PanelHeading>
        <button
          type="button"
          onClick={onClear}
          className="text-[11px] text-fg-subtle underline underline-offset-2 hover:text-fg-muted hover:no-underline"
        >
          {t('common:actions.clear')}
        </button>
      </div>
      <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
        {items.map((item) => (
          <li key={item.orderId}>
            <Link
              to={`/orders/${item.orderId}`}
              className="flex items-center gap-2.5 bg-surface px-3 py-2 transition-colors hover:bg-surface-2"
            >
              <Clock size={13} className="shrink-0 text-fg-subtle" />
              <span className="tnum text-sm text-fg">{item.orderNumber}</span>
              <Badge tone="neutral">{channelLabel(item.channel)}</Badge>
              <Badge tone={STATUS_TONE_BADGE[item.statusTone]}>{item.statusLabel}</Badge>
              <span className="ml-auto text-[11px] text-fg-subtle">
                {formatDateTime(item.viewedAt)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
