import { Badge } from '@/components/ui';

import { KIND_LABEL, KIND_TONE } from '../lib';
import type { ScenarioKind } from '../types';

export function KindBadge({ kind }: { kind: ScenarioKind }) {
  return <Badge tone={KIND_TONE[kind]}>{KIND_LABEL[kind]}</Badge>;
}
