import { useEffect } from 'react';

import { useAppStore } from '@/app/store';

export function useApplyTheme(): void {
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
  }, [theme]);
}
