import { useEffect } from 'react';

import { THEME_COLOR_SCHEME, useAppStore } from '@/app/store';

export function useApplyTheme(): void {
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = THEME_COLOR_SCHEME[theme];
  }, [theme]);
}
