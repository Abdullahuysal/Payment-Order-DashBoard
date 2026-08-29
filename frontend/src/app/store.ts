import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { APP_ENVIRONMENTS, config } from '@/services/config';
import type { AppEnvironment } from '@/types';

export type ThemeName = 'dark' | 'light';

interface AppState {
  environment: AppEnvironment;
  setEnvironment: (env: AppEnvironment) => void;

  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;

  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
}

const LEGACY_ENV: Record<string, AppEnvironment> = {
  prod: 'production',
  staging: 'preprod',
  test: 'dev',
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      environment: config.defaultEnv,
      setEnvironment: (environment) => set({ environment }),

      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

      commandOpen: false,
      setCommandOpen: (commandOpen) => set({ commandOpen }),
    }),
    {
      name: 'boyner-ops-ui',
      version: 1,
      partialize: (s) => ({
        environment: s.environment,
        theme: s.theme,
        sidebarCollapsed: s.sidebarCollapsed,
      }),
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<AppState>;
        if (version < 1 && typeof state.environment === 'string') {
          state.environment = LEGACY_ENV[state.environment] ?? config.defaultEnv;
        }
        return state as AppState;
      },
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>;
        const environment =
          p.environment && APP_ENVIRONMENTS.includes(p.environment)
            ? p.environment
            : current.environment;
        const theme: ThemeName = p.theme === 'light' ? 'light' : 'dark';
        return { ...current, ...p, environment, theme };
      },
    },
  ),
);

export const getCurrentEnv = (): AppEnvironment => useAppStore.getState().environment;
