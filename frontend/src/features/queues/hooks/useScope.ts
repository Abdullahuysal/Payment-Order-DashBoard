import { useMemo } from 'react';

import { useAppStore } from '@/app/store';

import { compileMatcher, deriveServerHints, MATCH_ALL, type ScopeMatcher } from '../scope';

export interface QueueScope {
  enabled: boolean;
  patterns: string[];
  active: boolean;
  match: ScopeMatcher;
  hints: string[];
}

export function useQueueScope(): QueueScope {
  const enabled = useAppStore((s) => s.queueScopeEnabled);
  const patterns = useAppStore((s) => s.queueScopePatterns);
  const active = enabled && patterns.length > 0;

  const match = useMemo(() => (active ? compileMatcher(patterns) : MATCH_ALL), [active, patterns]);
  const hints = useMemo(() => (active ? deriveServerHints(patterns) : []), [active, patterns]);

  return { enabled, patterns, active, match, hints };
}
