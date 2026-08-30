import { useCallback, useEffect, useState } from 'react';

import { useAppStore } from '@/app/store';

import { clearRecentLookups, readRecentLookups, writeRecentLookup } from '../lib';
import type { RecentLookup } from '../types';

interface UseRecentLookupsResult {
  items: RecentLookup[];
  add: (entry: Omit<RecentLookup, 'viewedAt'>) => void;
  clear: () => void;
}

export function useRecentLookups(): UseRecentLookupsResult {
  const env = useAppStore((s) => s.environment);
  const [items, setItems] = useState<RecentLookup[]>(() => readRecentLookups(env));

  useEffect(() => {
    setItems(readRecentLookups(env));
  }, [env]);

  const add = useCallback(
    (entry: Omit<RecentLookup, 'viewedAt'>) => {
      const next = writeRecentLookup(env, { ...entry, viewedAt: new Date().toISOString() });
      setItems(next);
    },
    [env],
  );

  const clear = useCallback(() => {
    clearRecentLookups(env);
    setItems([]);
  }, [env]);

  return { items, add, clear };
}
