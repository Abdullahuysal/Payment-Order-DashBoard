import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui';

import { channelLabel, formatDateTime, STATUS_TONE_BADGE } from '../lib';
import type { LookupMatch } from '../types';

export function LookupResultsList({ matches }: { matches: readonly LookupMatch[] }) {
  const { t } = useTranslation('orders');
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] text-fg-subtle">{t('results.count', { count: matches.length })}</p>
      <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
        {matches.map((match) => (
          <li key={match.orderId}>
            <Link
              to={`/orders/${match.orderId}`}
              className="flex items-center gap-3 bg-surface px-3 py-2.5 transition-colors hover:bg-surface-2"
            >
              <span className="tnum text-sm font-medium text-fg">{match.orderNumber}</span>
              <Badge tone="neutral">{channelLabel(match.channel)}</Badge>
              <Badge tone={STATUS_TONE_BADGE[match.status.tone]}>{match.status.label}</Badge>
              <span className="ml-auto text-[11px] text-fg-subtle">
                {formatDateTime(match.createdAt)}
              </span>
              <ChevronRight size={14} className="shrink-0 text-fg-subtle" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
