import { Badge } from '@/components/ui';

import { channelLabel, CHANNEL_TONE } from '../lib';
import type { OrderChannel } from '../types';

export function ChannelBadge({
  channel,
  merchantName,
}: {
  channel: OrderChannel;
  merchantName?: string | undefined;
}) {
  return (
    <Badge tone={CHANNEL_TONE[channel]} className="gap-1">
      {channelLabel(channel)}
      {merchantName && <span className="text-fg-subtle">· {merchantName}</span>}
    </Badge>
  );
}
